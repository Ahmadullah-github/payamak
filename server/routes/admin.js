// File: server/routes/admin.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { validatePagination } = require('../middleware/validation');
const { logger } = require('../middleware/errorHandler');

// Simple admin middleware (in production, use proper role-based access control)
const adminMiddleware = async (req, res, next) => {
  try {
    // For now, we'll use a simple check - in production, add proper admin roles
    const userId = req.user.userId;
    
    // Check if user is admin (you would typically have an admin role/permission system)
    const adminCheck = await req.pool.query(
      'SELECT id FROM users WHERE id = $1 AND username = $2',
      [userId, 'admin'] // Simple check - replace with proper role system
    );
    
    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required' 
      });
    }
    
    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = function(pool) {
    const router = express.Router();
    
    // Add pool to request for admin middleware
    router.use((req, res, next) => {
      req.pool = pool;
      next();
    });

    // Get system statistics
    router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        // Get user statistics
        const userStats = await pool.query(`
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN is_online = true THEN 1 END) as online_users,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as new_users_today,
            COUNT(CASE WHEN last_seen >= NOW() - INTERVAL '1 day' THEN 1 END) as active_users_today
          FROM users
        `);

        // Get message statistics
        const messageStats = await pool.query(`
          SELECT 
            COUNT(*) as total_messages,
            COUNT(CASE WHEN timestamp >= NOW() - INTERVAL '1 day' THEN 1 END) as messages_today,
            COUNT(CASE WHEN timestamp >= NOW() - INTERVAL '1 hour' THEN 1 END) as messages_last_hour,
            COUNT(DISTINCT chat_id) as active_chats
          FROM messages
        `);

        // Get chat statistics
        const chatStats = await pool.query(`
          SELECT 
            COUNT(*) as total_chats,
            COUNT(CASE WHEN type = 'private' THEN 1 END) as private_chats,
            COUNT(CASE WHEN type = 'group' THEN 1 END) as group_chats,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as new_chats_today
          FROM chats
        `);

        // Get file statistics
        const fileStats = await pool.query(`
          SELECT 
            COUNT(*) as total_files,
            SUM(file_size) as total_storage_bytes,
            COUNT(CASE WHEN uploaded_at >= NOW() - INTERVAL '1 day' THEN 1 END) as files_uploaded_today
          FROM files
        `);

        const stats = {
          users: userStats.rows[0],
          messages: messageStats.rows[0],
          chats: chatStats.rows[0],
          files: fileStats.rows[0],
          timestamp: new Date().toISOString()
        };

        res.json({
          success: true,
          stats
        });
      } catch (err) {
        logger.error('Error fetching admin stats:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Get all users with pagination
    router.get('/users', authMiddleware, adminMiddleware, validatePagination, async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const search = req.query.search;

        let query = `
          SELECT 
            u.id, u.username, u.full_name, u.status, u.is_online, 
            u.last_seen, u.created_at, f.filename as profile_picture
          FROM users u
          LEFT JOIN files f ON u.profile_picture_id = f.id
        `;
        
        let params = [];
        
        if (search) {
          query += ' WHERE u.username ILIKE $1 OR u.full_name ILIKE $1';
          params.push(`%${search}%`);
        }
        
        query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        const users = result.rows.map(user => ({
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          status: user.status,
          isOnline: user.is_online,
          lastSeen: user.last_seen,
          createdAt: user.created_at,
          profilePicture: user.profile_picture ? `/api/files/profiles/${user.profile_picture}` : null
        }));

        res.json({
          success: true,
          users,
          count: users.length
        });
      } catch (err) {
        logger.error('Error fetching users:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Get recent messages across all chats
    router.get('/messages', authMiddleware, adminMiddleware, validatePagination, async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const result = await pool.query(`
          SELECT 
            m.id, m.content, m.message_type, m.timestamp,
            u.username as sender_username, u.full_name as sender_name,
            c.type as chat_type, c.name as chat_name
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          JOIN chats c ON m.chat_id = c.id
          ORDER BY m.timestamp DESC
          LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const messages = result.rows.map(msg => ({
          id: msg.id,
          content: msg.content,
          type: msg.message_type,
          timestamp: msg.timestamp,
          sender: {
            username: msg.sender_username,
            name: msg.sender_name
          },
          chat: {
            type: msg.chat_type,
            name: msg.chat_name
          }
        }));

        res.json({
          success: true,
          messages,
          count: messages.length
        });
      } catch (err) {
        logger.error('Error fetching messages:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Get system health
    router.get('/health', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        // Database health check
        const dbStart = Date.now();
        await pool.query('SELECT 1');
        const dbLatency = Date.now() - dbStart;

        // Get database connection info
        const connectionInfo = await pool.query(`
          SELECT 
            count(*) as connection_count,
            max(now() - state_change) as longest_connection
          FROM pg_stat_activity 
          WHERE state = 'active'
        `);

        // Memory usage (simplified)
        const memoryUsage = process.memoryUsage();

        const health = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: {
            connected: true,
            latency: dbLatency,
            connections: connectionInfo.rows[0]
          },
          memory: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024),
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024)
          },
          uptime: Math.round(process.uptime())
        };

        res.json({
          success: true,
          health
        });
      } catch (err) {
        logger.error('Error checking system health:', err);
        res.status(500).json({
          success: false,
          health: {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: err.message
          }
        });
      }
    });

    // Deactivate user
    router.patch('/users/:id/deactivate', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        const userId = req.params.id;

        const result = await pool.query(`
          UPDATE users 
          SET status = 'inactive', is_online = false
          WHERE id = $1
          RETURNING id, username
        `, [userId]);

        if (result.rows.length === 0) {
          return res.status(404).json({ 
            success: false, 
            error: 'User not found' 
          });
        }

        logger.info(`Admin deactivated user: ${result.rows[0].username}`);

        res.json({
          success: true,
          message: 'User deactivated successfully'
        });
      } catch (err) {
        logger.error('Error deactivating user:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Activate user
    router.patch('/users/:id/activate', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        const userId = req.params.id;

        const result = await pool.query(`
          UPDATE users 
          SET status = 'active'
          WHERE id = $1
          RETURNING id, username
        `, [userId]);

        if (result.rows.length === 0) {
          return res.status(404).json({ 
            success: false, 
            error: 'User not found' 
          });
        }

        logger.info(`Admin activated user: ${result.rows[0].username}`);

        res.json({
          success: true,
          message: 'User activated successfully'
        });
      } catch (err) {
        logger.error('Error activating user:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    return router;
};