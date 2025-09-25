// File: server/routes/messages.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

module.exports = function(pool) {
    const router = express.Router();

    // Get recent chats for the current user (optimized with new schema)
    router.get('/chats', authMiddleware, async (req, res) => {
      try {
        const userId = req.user.userId;

        const query = `
          SELECT 
              c.id as chat_id,
              c.type,
              c.name,
              c.last_activity,
              clv.last_message_content,
              clv.last_message_time,
              clv.last_sender_name,
              CASE 
                WHEN c.type = 'private' THEN 
                  (SELECT u.full_name FROM users u 
                   JOIN chat_members cm ON u.id = cm.user_id 
                   WHERE cm.chat_id = c.id AND u.id != $1 LIMIT 1)
                ELSE c.name
              END as display_name,
              CASE 
                WHEN c.type = 'private' THEN 
                  (SELECT u.is_online FROM users u 
                   JOIN chat_members cm ON u.id = cm.user_id 
                   WHERE cm.chat_id = c.id AND u.id != $1 LIMIT 1)
                ELSE false
              END as is_online,
              get_unread_count($1, c.id) as unread_count
          FROM chats c
          JOIN chat_members cm ON c.id = cm.chat_id
          LEFT JOIN chat_list_view clv ON c.id = clv.chat_id
          WHERE cm.user_id = $1
          ORDER BY c.last_activity DESC;
        `;

        const result = await pool.query(query, [userId]);
        res.json(result.rows.map(row => ({
          id: row.chat_id.toString(),
          type: row.type,
          name: row.display_name,
          lastMessage: row.last_message_content,
          timestamp: row.last_message_time,
          unreadCount: row.unread_count,
          isOnline: row.is_online,
          lastActivity: row.last_activity
        })));
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
    });

    // Get group chats for the current user
    router.get('/groups', authMiddleware, async (req, res) => {
      try {
        // This is a placeholder. In a real application, you would have a groups table and a user_groups table.
        const groups = [
          {
            id: 'g1',
            name: 'گروه پروژه پیامک',
            avatarUrl: 'https://i.pravatar.cc/150?u=group1',
            lastMessage: 'علی: فایل آپدیت شد',
            timestamp: '۱۰:۳۰',
            unreadCount: 3,
            membersCount: 8,
            isActive: true,
          },
          {
            id: 'g2',
            name: 'گروه طراحی',
            avatarUrl: 'https://i.pravatar.cc/150?u=group2',
            lastMessage: 'سارا: رنگ‌بندی جدید چطوره؟',
            timestamp: '۹:۱۵',
            unreadCount: 0,
            membersCount: 5,
            isActive: true,
          },
        ];
        res.json(groups);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
    });

    // Get chat messages (optimized for both direct and group chats)
    router.get('/chat/:chatId', authMiddleware, async (req, res) => {
      try {
        const currentUserId = req.user.userId;
        const chatId = req.params.chatId;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        
        // Verify user is member of the chat
        const memberCheck = await pool.query(
          'SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2',
          [chatId, currentUserId]
        );
        
        if (memberCheck.rows.length === 0) {
          return res.status(403).json({ message: 'Access denied to this chat' });
        }
        
        // Get messages with optimized query
        const messagesResult = await pool.query(
          `SELECT 
            m.id,
            m.chat_id,
            m.sender_id,
            m.content,
            m.message_type,
            m.status,
            m.timestamp,
            sender.full_name as sender_name,
            sender.is_online as sender_online,
            CASE WHEN mr.user_id IS NOT NULL THEN true ELSE false END as is_read
          FROM messages m
          JOIN users sender ON m.sender_id = sender.id
          LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = $1
          WHERE m.chat_id = $2
          ORDER BY m.timestamp DESC
          LIMIT $3 OFFSET $4`,
          [currentUserId, chatId, limit, offset]
        );
        
        const messages = messagesResult.rows.map(msg => ({
          id: msg.id.toString(),
          chatId: msg.chat_id.toString(),
          senderId: msg.sender_id.toString(),
          content: msg.content,
          type: msg.message_type,
          status: msg.status,
          timestamp: msg.timestamp,
          senderName: msg.sender_name,
          senderOnline: msg.sender_online,
          isRead: msg.is_read
        }));
        
        res.json(messages.reverse()); // Return in chronological order
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
    });

    // Save a new message (supports both direct and group chats)
    router.post('/', authMiddleware, async (req, res) => {
      try {
        const senderId = req.user.userId;
        const { chatId, content, type = 'text' } = req.body;
        
        if (!chatId || !content) {
          return res.status(400).json({ message: 'Chat ID and content are required' });
        }
        
        // Verify user is member of the chat
        const memberCheck = await pool.query(
          'SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2',
          [chatId, senderId]
        );
        
        if (memberCheck.rows.length === 0) {
          return res.status(403).json({ message: 'Access denied to this chat' });
        }
        
        // Insert the message into the database
        const messageResult = await pool.query(
          `INSERT INTO messages (chat_id, sender_id, content, message_type, status)
           VALUES ($1, $2, $3, $4, 'sent')
           RETURNING id, chat_id, sender_id, content, message_type, status, timestamp`,
          [chatId, senderId, content, type]
        );
        
        const newMessage = messageResult.rows[0];
        const formattedMessage = {
          id: newMessage.id.toString(),
          chatId: newMessage.chat_id.toString(),
          senderId: newMessage.sender_id.toString(),
          content: newMessage.content,
          type: newMessage.message_type,
          status: newMessage.status,
          timestamp: newMessage.timestamp
        };
        
        res.status(201).json(formattedMessage);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
    });

    // Update message status (delivered/read) - optimized for group chats
    router.patch('/:messageId/status', authMiddleware, async (req, res) => {
      try {
        const messageId = req.params.messageId;
        const { status } = req.body;
        const userId = req.user.userId;
        
        if (!['delivered', 'read'].includes(status)) {
          return res.status(400).json({ message: 'Invalid status' });
        }
        
        // Get message details to verify access
        const messageResult = await pool.query(
          `SELECT m.id, m.chat_id, m.sender_id 
           FROM messages m
           JOIN chat_members cm ON m.chat_id = cm.chat_id
           WHERE m.id = $1 AND cm.user_id = $2 AND m.sender_id != $2`,
          [messageId, userId]
        );
        
        if (messageResult.rows.length === 0) {
          return res.status(404).json({ message: 'Message not found or unauthorized' });
        }
        
        if (status === 'delivered') {
          // Insert delivery record
          await pool.query(
            `INSERT INTO message_deliveries (message_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (message_id, user_id) DO NOTHING`,
            [messageId, userId]
          );
        } else if (status === 'read') {
          // Insert read record
          await pool.query(
            `INSERT INTO message_reads (message_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (message_id, user_id) DO NOTHING`,
            [messageId, userId]
          );
        }
        
        res.json({
          id: messageId,
          status: status,
          userId: userId
        });
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
    });

    // Create a new chat (private or group)
    router.post('/chats', authMiddleware, async (req, res) => {
      try {
        const { type, name, memberIds = [] } = req.body;
        const creatorId = req.user.userId;
        
        if (!['private', 'group'].includes(type)) {
          return res.status(400).json({ message: 'Invalid chat type' });
        }
        
        if (type === 'group' && !name) {
          return res.status(400).json({ message: 'Group name is required' });
        }
        
        if (type === 'private' && memberIds.length !== 1) {
          return res.status(400).json({ message: 'Private chat requires exactly one other member' });
        }
        
        // Check if private chat already exists
        if (type === 'private') {
          const existingChat = await pool.query(
            `SELECT c.id FROM chats c
             JOIN chat_members cm1 ON c.id = cm1.chat_id
             JOIN chat_members cm2 ON c.id = cm2.chat_id
             WHERE c.type = 'private' 
             AND cm1.user_id = $1 
             AND cm2.user_id = $2`,
            [creatorId, memberIds[0]]
          );
          
          if (existingChat.rows.length > 0) {
            return res.status(409).json({ 
              message: 'Private chat already exists',
              chatId: existingChat.rows[0].id.toString()
            });
          }
        }
        
        // Create the chat
        const chatResult = await pool.query(
          `INSERT INTO chats (type, name, created_by)
           VALUES ($1, $2, $3)
           RETURNING id, type, name, created_by, created_at`,
          [type, name, creatorId]
        );
        
        const newChat = chatResult.rows[0];
        
        // Add creator as member
        await pool.query(
          `INSERT INTO chat_members (chat_id, user_id, role)
           VALUES ($1, $2, 'admin')`,
          [newChat.id, creatorId]
        );
        
        // Add other members
        const allMemberIds = [...memberIds];
        for (const memberId of allMemberIds) {
          await pool.query(
            `INSERT INTO chat_members (chat_id, user_id, role)
             VALUES ($1, $2, 'member')`,
            [newChat.id, memberId]
          );
        }
        
        res.status(201).json({
          id: newChat.id.toString(),
          type: newChat.type,
          name: newChat.name,
          createdBy: newChat.created_by.toString(),
          createdAt: newChat.created_at
        });
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
    });
    
    // Add members to group chat
    router.post('/chats/:chatId/members', authMiddleware, async (req, res) => {
      try {
        const chatId = req.params.chatId;
        const { memberIds } = req.body;
        const userId = req.user.userId;
        
        // Check if user is admin of the chat
        const adminCheck = await pool.query(
          `SELECT 1 FROM chat_members cm
           JOIN chats c ON cm.chat_id = c.id
           WHERE cm.chat_id = $1 AND cm.user_id = $2 
           AND (cm.role = 'admin' OR c.created_by = $2)`,
          [chatId, userId]
        );
        
        if (adminCheck.rows.length === 0) {
          return res.status(403).json({ message: 'Admin access required' });
        }
        
        // Add members
        const addedMembers = [];
        for (const memberId of memberIds) {
          try {
            await pool.query(
              `INSERT INTO chat_members (chat_id, user_id, role)
               VALUES ($1, $2, 'member')`,
              [chatId, memberId]
            );
            addedMembers.push(memberId);
          } catch (err) {
            // Member already exists, skip
            if (err.code !== '23505') throw err;
          }
        }
        
        res.json({ addedMembers });
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
    });
    
    // Get chat members
    router.get('/chats/:chatId/members', authMiddleware, async (req, res) => {
      try {
        const chatId = req.params.chatId;
        const userId = req.user.userId;
        
        // Check if user is member of the chat
        const memberCheck = await pool.query(
          'SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2',
          [chatId, userId]
        );
        
        if (memberCheck.rows.length === 0) {
          return res.status(403).json({ message: 'Access denied to this chat' });
        }
        
        // Get all members
        const membersResult = await pool.query(
          `SELECT 
            u.id,
            u.username,
            u.full_name,
            u.is_online,
            u.last_seen,
            cm.role,
            cm.joined_at
          FROM chat_members cm
          JOIN users u ON cm.user_id = u.id
          WHERE cm.chat_id = $1
          ORDER BY cm.joined_at ASC`,
          [chatId]
        );
        
        const members = membersResult.rows.map(member => ({
          id: member.id.toString(),
          username: member.username,
          fullName: member.full_name,
          isOnline: member.is_online,
          lastSeen: member.last_seen,
          role: member.role,
          joinedAt: member.joined_at
        }));
        
        res.json(members);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
    });

    return router;
};