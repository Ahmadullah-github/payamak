// server/socketHandler.js

const  {verifyToken} =  require("./utils/jwt");

// This map will store online users.
// Key: userId, Value: socket.id
const onlineUsers = new Map();

const initializeSocket = (io, pool) => {
  // Your Socket.IO authentication middleware
  io.use((socket, next) => {
    // ... JWT verification logic ...
    const token = socket.handshake.auth.token
    console.log("Token from socket handshake: ", token);
    const user = verifyToken(token);
    if (!user) {
      return next(new Error('Authentication error'));
    }
    // Attach userId to socket
    console.log("Verified userId from token: ", user.userId);
    socket.userId = user.userId;
    next();
  });

  io.on('connection', async (socket) => {
    console.log(`✅ User connected: ${socket.userId} with socket ID: ${socket.id}`);

    try {
      // Update user status in database
      await pool.query(
        `UPDATE users 
         SET is_online = true, last_seen = CURRENT_TIMESTAMP, socket_id = $1
         WHERE id = $2`,
        [socket.id, socket.userId]
      );
      
      // --- Presence Logic ---
      onlineUsers.set(socket.userId, socket.id);
      socket.broadcast.emit('user_online', { userId: socket.userId });
      socket.emit('current_online_users', Array.from(onlineUsers.keys()));
      
    } catch (error) {
      console.error('Error updating user status on connect:', error);
    }

    
    // --- Enhanced Disconnect Logic ---
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
      
      try {
        // Update user status in database
        await pool.query(
          `UPDATE users 
           SET is_online = false, last_seen = CURRENT_TIMESTAMP, socket_id = NULL
           WHERE id = $1`,
          [socket.userId]
        );
        
        onlineUsers.delete(socket.userId);
        socket.broadcast.emit('user_offline', { userId: socket.userId });
        
      } catch (error) {
        console.error('Error updating user status on disconnect:', error);
      }
    });

    // --- Enhanced Messaging for Both Direct and Group Chats ---
    socket.on('send_message', async (data) => {
      const { chatId, content, type = 'text' } = data;
      console.log(`💬 Message from ${socket.userId} to chat ${chatId}: ${content}`);
      
      try {
        // Verify user is member of the chat
        const memberCheck = await pool.query(
          'SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2',
          [chatId, socket.userId]
        );
        
        if (memberCheck.rows.length === 0) {
          socket.emit('message_error', { error: 'Access denied to this chat' });
          return;
        }
        
        // Save message to database
        const messageResult = await pool.query(
          `INSERT INTO messages (chat_id, sender_id, content, message_type, status)
           VALUES ($1, $2, $3, $4, 'sent')
           RETURNING id, chat_id, sender_id, content, message_type, status, timestamp`,
          [chatId, socket.userId, content, type]
        );
        
        const savedMessage = messageResult.rows[0];
        
        // Get sender info
        const senderResult = await pool.query(
          'SELECT full_name, is_online FROM users WHERE id = $1',
          [socket.userId]
        );
        
        const sender = senderResult.rows[0];
        
        // Create message object
        const messageData = {
          id: savedMessage.id.toString(),
          chatId: savedMessage.chat_id.toString(),
          senderId: savedMessage.sender_id.toString(),
          content: savedMessage.content,
          type: savedMessage.message_type,
          timestamp: savedMessage.timestamp,
          status: 'sent',
          senderName: sender.full_name,
          senderOnline: sender.is_online
        };
        
        // Get all chat members except sender
        const membersResult = await pool.query(
          'SELECT user_id FROM chat_members WHERE chat_id = $1 AND user_id != $2',
          [chatId, socket.userId]
        );
        
        const recipients = membersResult.rows;
        let deliveredCount = 0;
        
        // Send to all online members
        for (const member of recipients) {
          const memberSocketId = onlineUsers.get(member.user_id);
          
          if (memberSocketId) {
            // Member is online - send message immediately
            socket.to(memberSocketId).emit('new_message', messageData);
            
            // Record delivery
            await pool.query(
              `INSERT INTO message_deliveries (message_id, user_id)
               VALUES ($1, $2)
               ON CONFLICT (message_id, user_id) DO NOTHING`,
              [savedMessage.id, member.user_id]
            );
            
            deliveredCount++;
          }
        }
        
        // Update message status if delivered to anyone
        if (deliveredCount > 0) {
          messageData.status = 'delivered';
          socket.emit('message_status_update', { 
            messageId: messageData.id, 
            status: 'delivered',
            deliveredCount: deliveredCount
          });
          
          console.log(`✅ Message delivered to ${deliveredCount} members`);
        } else {
          console.log(`📴 No online members - message saved for later delivery`);
        }
        
        // Send confirmation to sender
        socket.emit('message_sent', messageData);
        
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });
    
    // --- Enhanced Chat Room Management ---
    socket.on('join_chat_room', async (data) => {
      const { chatId } = data;
      
      try {
        // Verify user is member of the chat
        const memberCheck = await pool.query(
          'SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2',
          [chatId, socket.userId]
        );
        
        if (memberCheck.rows.length === 0) {
          socket.emit('chat_error', { error: 'Access denied to this chat' });
          return;
        }
        
        socket.join(chatId);
        console.log(`🏠 User ${socket.userId} joined chat room: ${chatId}`);
        
        // Notify other members that user joined
        socket.to(chatId).emit('user_joined_chat', {
          userId: socket.userId,
          chatId: chatId
        });
        
      } catch (error) {
        console.error('Error joining chat room:', error);
        socket.emit('chat_error', { error: 'Failed to join chat room' });
      }
    });
    
    socket.on('leave_chat_room', (data) => {
      const { chatId } = data;
      socket.leave(chatId);
      console.log(`🚪 User ${socket.userId} left chat room: ${chatId}`);
      
      // Notify other members that user left
      socket.to(chatId).emit('user_left_chat', {
        userId: socket.userId,
        chatId: chatId
      });
    });
    
    // --- Enhanced Message Read Status ---
    socket.on('mark_message_read', async (data) => {
      const { messageId, chatId } = data;
      
      try {
        // Verify user is member of the chat and message exists
        const messageCheck = await pool.query(
          `SELECT m.sender_id, m.chat_id FROM messages m
           JOIN chat_members cm ON m.chat_id = cm.chat_id
           WHERE m.id = $1 AND cm.user_id = $2 AND m.sender_id != $2`,
          [messageId, socket.userId]
        );
        
        if (messageCheck.rows.length === 0) {
          return; // Message not found or user is sender
        }
        
        const senderId = messageCheck.rows[0].sender_id;
        
        // Mark message as read
        await pool.query(
          `INSERT INTO message_reads (message_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (message_id, user_id) DO NOTHING`,
          [messageId, socket.userId]
        );
        
        // Get total read count for this message
        const readCountResult = await pool.query(
          'SELECT COUNT(*) as read_count FROM message_reads WHERE message_id = $1',
          [messageId]
        );
        
        const readCount = readCountResult.rows[0].read_count;
        
        // Notify sender about read status
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          socket.to(senderSocketId).emit('message_status_update', {
            messageId,
            status: 'read',
            readCount: parseInt(readCount),
            readBy: socket.userId
          });
        }
        
        // Notify chat room about read status (for group chats)
        if (chatId) {
          socket.to(chatId).emit('message_read_update', {
            messageId,
            readBy: socket.userId,
            readCount: parseInt(readCount)
          });
        }
        
        console.log(`👁️ Message ${messageId} marked as read by user ${socket.userId}`);
        
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });
    
    // Typing indicators for enhanced UX
    socket.on('typing_start', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('user_typing', {
        userId: socket.userId,
        chatId: chatId
      });
    });
    
    socket.on('typing_stop', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('user_stopped_typing', {
        userId: socket.userId,
        chatId: chatId
      });
    });
  });
}

module.exports = { initializeSocket };