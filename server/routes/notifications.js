// File: server/routes/notifications.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { validateId, validatePagination, validateNotificationCreate } = require('../middleware/validation');
const { notificationLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../middleware/errorHandler');

module.exports = function(pool, io) {
    const router = express.Router();

    // Notification types and templates
    const NOTIFICATION_TYPES = {
        MESSAGE: 'message',
        GROUP_INVITE: 'group_invite',
        FRIEND_REQUEST: 'friend_request',
        SYSTEM: 'system',
        MENTION: 'mention',
        REACTION: 'reaction',
        FILE_SHARED: 'file_shared',
        CHAT_CREATED: 'chat_created',
        MESSAGE_READ: 'message_read'
    };

    // Helper function to create notification and emit via socket
    const createNotification = async (userId, type, title, message, data = {}) => {
        try {
            const result = await pool.query(`
                INSERT INTO notifications (user_id, type, title, message, data, is_read, created_at)
                VALUES ($1, $2, $3, $4, $5, false, CURRENT_TIMESTAMP)
                RETURNING id, type, title, message, data, created_at
            `, [userId, type, title, message, JSON.stringify(data)]);

            const notification = result.rows[0];
            const formattedNotification = {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data,
                createdAt: notification.created_at,
                isRead: false
            };

            // Emit real-time notification via Socket.IO
            if (io) {
                io.to(`user_${userId}`).emit('notification', formattedNotification);
                io.to(`user_${userId}`).emit('notification_count_update', {
                    unreadCount: await getUnreadCount(userId)
                });
            }

            return formattedNotification;
        } catch (err) {
            logger.error('Error creating notification:', err);
            throw err;
        }
    };

    // Helper to get unread count
    const getUnreadCount = async (userId) => {
        const result = await pool.query(`
            SELECT COUNT(*) as count FROM notifications 
            WHERE user_id = $1 AND is_read = false
        `, [userId]);
        return parseInt(result.rows[0].count);
    };

    // Get unread notifications for current user with enhanced filtering
    router.get('/unread', authMiddleware, notificationLimiter, validatePagination, async (req, res) => {
        try {
            const userId = req.user.userId;
            const { limit = 20, offset = 0, type } = req.query;

            let query = `
                SELECT id, type, title, message, data, created_at, priority
                FROM notifications 
                WHERE user_id = $1 AND is_read = false 
            `;
            const queryParams = [userId];
            let paramCount = 1;

            if (type && Object.values(NOTIFICATION_TYPES).includes(type)) {
                paramCount++;
                query += ` AND type = $${paramCount} `;
                queryParams.push(type);
            }

            query += ` ORDER BY 
                CASE 
                    WHEN priority = 'high' THEN 1
                    WHEN priority = 'medium' THEN 2
                    ELSE 3
                END, 
                created_at DESC 
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;
            queryParams.push(parseInt(limit), parseInt(offset));

            const result = await pool.query(query, queryParams);

            const notifications = result.rows.map(row => ({
                id: row.id,
                type: row.type,
                title: row.title,
                message: row.message,
                data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
                createdAt: row.created_at,
                priority: row.priority || 'normal'
            }));

            const totalUnread = await getUnreadCount(userId);

            res.json({
                success: true,
                notifications,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: totalUnread,
                    hasMore: notifications.length === parseInt(limit)
                }
            });
        } catch (err) {
            logger.error('Error fetching unread notifications:', err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    // Get all notifications for current user with advanced filtering
    router.get('/', authMiddleware, notificationLimiter, validatePagination, async (req, res) => {
        try {
            const userId = req.user.userId;
            const { 
                limit = 50, 
                offset = 0, 
                type, 
                read, 
                priority,
                startDate,
                endDate 
            } = req.query;

            let query = `
                SELECT id, type, title, message, data, is_read, created_at, read_at, priority
                FROM notifications 
                WHERE user_id = $1
            `;
            const queryParams = [userId];
            let paramCount = 1;

            // Add filters
            if (type && Object.values(NOTIFICATION_TYPES).includes(type)) {
                paramCount++;
                query += ` AND type = $${paramCount} `;
                queryParams.push(type);
            }

            if (read !== undefined) {
                paramCount++;
                query += ` AND is_read = $${paramCount} `;
                queryParams.push(read === 'true');
            }

            if (priority && ['low', 'normal', 'medium', 'high'].includes(priority)) {
                paramCount++;
                query += ` AND priority = $${paramCount} `;
                queryParams.push(priority);
            }

            if (startDate) {
                paramCount++;
                query += ` AND created_at >= $${paramCount} `;
                queryParams.push(new Date(startDate));
            }

            if (endDate) {
                paramCount++;
                query += ` AND created_at <= $${paramCount} `;
                queryParams.push(new Date(endDate));
            }

            query += ` ORDER BY created_at DESC 
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;
            queryParams.push(parseInt(limit), parseInt(offset));

            const result = await pool.query(query, queryParams);

            // Get total count for pagination
            const countQuery = query.split('ORDER BY')[0].replace('SELECT id, type, title, message, data, is_read, created_at, read_at, priority', 'SELECT COUNT(*) as total');
            const countResult = await pool.query(countQuery, queryParams.slice(0, -2)); // Remove limit and offset
            const totalCount = parseInt(countResult.rows[0].total);

            const notifications = result.rows.map(row => ({
                id: row.id,
                type: row.type,
                title: row.title,
                message: row.message,
                data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
                isRead: row.is_read,
                createdAt: row.created_at,
                readAt: row.read_at,
                priority: row.priority || 'normal'
            }));

            res.json({
                success: true,
                notifications,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: totalCount,
                    hasMore: (parseInt(offset) + notifications.length) < totalCount
                }
            });
        } catch (err) {
            logger.error('Error fetching notifications:', err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    // Create a new notification (for internal use, e.g., from other routes)
    router.post('/', authMiddleware, validateNotificationCreate, async (req, res) => {
        try {
            const { userId, type, title, message, data, priority = 'normal' } = req.body;

            // Verify the requesting user has permission to create notifications
            // In a real app, you might want to restrict this to certain users or systems
            const notification = await createNotification(
                userId, 
                type, 
                title, 
                message, 
                { ...data, createdBy: req.user.userId }
            );

            res.status(201).json({
                success: true,
                notification,
                message: 'Notification created successfully'
            });
        } catch (err) {
            logger.error('Error creating notification:', err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    // Mark notification as read
    router.patch('/:id/read', authMiddleware, validateId, async (req, res) => {
        try {
            const notificationId = req.params.id;
            const userId = req.user.userId;

            const result = await pool.query(`
                UPDATE notifications 
                SET is_read = true, read_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND user_id = $2
                RETURNING id, type, title
            `, [notificationId, userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Notification not found' 
                });
            }

            // Emit update via socket
            if (io) {
                io.to(`user_${userId}`).emit('notification_read', { id: notificationId });
                io.to(`user_${userId}`).emit('notification_count_update', {
                    unreadCount: await getUnreadCount(userId)
                });
            }

            res.json({
                success: true,
                message: 'Notification marked as read',
                notification: result.rows[0]
            });
        } catch (err) {
            logger.error('Error marking notification as read:', err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    // Mark multiple notifications as read
    router.patch('/read-multiple', authMiddleware, async (req, res) => {
        try {
            const { notificationIds } = req.body;
            const userId = req.user.userId;

            if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Notification IDs array is required' 
                });
            }

            const result = await pool.query(`
                UPDATE notifications 
                SET is_read = true, read_at = CURRENT_TIMESTAMP
                WHERE id = ANY($1) AND user_id = $2 AND is_read = false
                RETURNING id
            `, [notificationIds, userId]);

            // Emit update via socket
            if (io) {
                io.to(`user_${userId}`).emit('notifications_read', { ids: notificationIds });
                io.to(`user_${userId}`).emit('notification_count_update', {
                    unreadCount: await getUnreadCount(userId)
                });
            }

            res.json({
                success: true,
                message: `${result.rowCount} notifications marked as read`,
                updatedCount: result.rowCount
            });
        } catch (err) {
            logger.error('Error marking multiple notifications as read:', err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    // Mark all notifications as read with optional filters
    router.patch('/read-all', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.userId;
            const { type, olderThan } = req.body;

            let query = `
                UPDATE notifications 
                SET is_read = true, read_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND is_read = false
            `;
            const queryParams = [userId];
            let paramCount = 1;

            if (type && Object.values(NOTIFICATION_TYPES).includes(type)) {
                paramCount++;
                query += ` AND type = $${paramCount} `;
                queryParams.push(type);
            }

            if (olderThan) {
                paramCount++;
                query += ` AND created_at < $${paramCount} `;
                queryParams.push(new Date(olderThan));
            }

            const result = await pool.query(query, queryParams);

            // Emit update via socket
            if (io) {
                io.to(`user_${userId}`).emit('all_notifications_read');
                io.to(`user_${userId}`).emit('notification_count_update', {
                    unreadCount: 0
                });
            }

            res.json({
                success: true,
                message: `${result.rowCount} notifications marked as read`
            });
        } catch (err) {
            logger.error('Error marking all notifications as read:', err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    // Delete notification
    router.delete('/:id', authMiddleware, validateId, async (req, res) => {
        try {
            const notificationId = req.params.id;
            const userId = req.user.userId;

            const result = await pool.query(`
                DELETE FROM notifications 
                WHERE id = $1 AND user_id = $2
                RETURNING id, type
            `, [notificationId, userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Notification not found' 
                });
            }

            // Emit update via socket
            if (io) {
                io.to(`user_${userId}`).emit('notification_deleted', { id: notificationId });
                io.to(`user_${userId}`).emit('notification_count_update', {
                    unreadCount: await getUnreadCount(userId)
                });
            }

            res.json({
                success: true,
                message: 'Notification deleted successfully'
            });
        } catch (err) {
            logger.error('Error deleting notification:', err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    // Delete multiple notifications
    router.delete('/', authMiddleware, async (req, res) => {
        try {
            const { notificationIds } = req.body;
            const userId = req.user.userId;

            if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Notification IDs array is required' 
                });
            }

            const result = await pool.query(`
                DELETE FROM notifications 
                WHERE id = ANY($1) AND user_id = $2
                RETURNING id
            `, [notificationIds, userId]);

            // Emit update via socket
            if (io) {
                io.to(`user_${userId}`).emit('notifications_deleted', { ids: notificationIds });
                io.to(`user_${userId}`).emit('notification_count_update', {
                    unreadCount: await getUnreadCount(userId)
                });
            }

            res.json({
                success: true,
                message: `${result.rowCount} notifications deleted successfully`
            });
        } catch (err) {
            logger.error('Error deleting multiple notifications:', err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    // Delete all read notifications with optional filters
    router.delete('/read', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.userId;
            const { olderThan, type } = req.body;

            let query = `
                DELETE FROM notifications 
                WHERE user_id = $1 AND is_read = true
            `;
            const queryParams = [userId];
            let paramCount = 1;

            if (olderThan) {
                paramCount++;
                query += ` AND created_at < $${paramCount} `;
                queryParams.push(new Date(olderThan));
            }

            if (type && Object.values(NOTIFICATION_TYPES).includes(type)) {
                paramCount++;
                query += ` AND type = $${paramCount} `;
                queryParams.push(type);
            }

            const result = await pool.query(query, queryParams);

            res.json({
                success: true,
                message: `${result.rowCount} read notifications deleted`
            });
        } catch (err) {
            logger.error('Error deleting read notifications:', err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    // Get notification statistics
    router.get('/stats', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.userId;
            const { days = 30 } = req.query;

            const result = await pool.query(`
                SELECT 
                    COUNT(*) as total_count,
                    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
                    COUNT(CASE WHEN is_read = true THEN 1 END) as read_count,
                    COUNT(CASE WHEN type = 'message' THEN 1 END) as message_count,
                    COUNT(CASE WHEN type = 'group_invite' THEN 1 END) as group_invite_count,
                    COUNT(CASE WHEN type = 'friend_request' THEN 1 END) as friend_request_count,
                    COUNT(CASE WHEN type = 'system' THEN 1 END) as system_count,
                    COUNT(CASE WHEN type = 'mention' THEN 1 END) as mention_count,
                    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '${days} days' THEN 1 END) as recent_count
                FROM notifications 
                WHERE user_id = $1
            `, [userId]);

            const stats = result.rows[0];

            res.json({
                success: true,
                stats: {
                    total: parseInt(stats.total_count),
                    unread: parseInt(stats.unread_count),
                    read: parseInt(stats.read_count),
                    byType: {
                        message: parseInt(stats.message_count),
                        group_invite: parseInt(stats.group_invite_count),
                        friend_request: parseInt(stats.friend_request_count),
                        system: parseInt(stats.system_count),
                        mention: parseInt(stats.mention_count)
                    },
                    recent: parseInt(stats.recent_count)
                }
            });
        } catch (err) {
            logger.error('Error fetching notification statistics:', err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    // Get notification count by type
    router.get('/count', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.userId;
            const { type } = req.query;

            let query = `
                SELECT 
                    COUNT(*) as total_count,
                    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
                FROM notifications 
                WHERE user_id = $1
            `;
            const queryParams = [userId];

            if (type && Object.values(NOTIFICATION_TYPES).includes(type)) {
                query += ` AND type = $2`;
                queryParams.push(type);
            }

            const result = await pool.query(query, queryParams);
            const counts = result.rows[0];

            res.json({
                success: true,
                totalCount: parseInt(counts.total_count),
                unreadCount: parseInt(counts.unread_count)
            });
        } catch (err) {
            logger.error('Error fetching notification count:', err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    // Export the createNotification function for use in other routes
    router.createNotification = createNotification;
    router.NOTIFICATION_TYPES = NOTIFICATION_TYPES;

    return router;
};



// // File: server/routes/notifications.js
// const express = require('express');
// const authMiddleware = require('../middleware/authMiddleware');
// const { validateId, validatePagination } = require('../middleware/validation');
// const { logger } = require('../middleware/errorHandler');

// module.exports = function(pool) {
//     const router = express.Router();

//     // Get unread notifications for current user
//     router.get('/unread', authMiddleware, validatePagination, async (req, res) => {
//       try {
//         const userId = req.user.userId;
//         const limit = parseInt(req.query.limit) || 20;
//         const offset = parseInt(req.query.offset) || 0;

//         const result = await pool.query(`
//           SELECT id, type, title, message, data, created_at
//           FROM notifications 
//           WHERE user_id = $1 AND is_read = false 
//           ORDER BY created_at DESC 
//           LIMIT $2 OFFSET $3
//         `, [userId, limit, offset]);

//         const notifications = result.rows.map(row => ({
//           id: row.id,
//           type: row.type,
//           title: row.title,
//           message: row.message,
//           data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
//           createdAt: row.created_at
//         }));

//         res.json({
//           success: true,
//           notifications,
//           count: notifications.length
//         });
//       } catch (err) {
//         logger.error('Error fetching unread notifications:', err);
//         res.status(500).json({ success: false, error: 'Server error' });
//       }
//     });

//     // Get all notifications for current user
//     router.get('/', authMiddleware, validatePagination, async (req, res) => {
//       try {
//         const userId = req.user.userId;
//         const limit = parseInt(req.query.limit) || 50;
//         const offset = parseInt(req.query.offset) || 0;

//         const result = await pool.query(`
//           SELECT id, type, title, message, data, is_read, created_at, read_at
//           FROM notifications 
//           WHERE user_id = $1
//           ORDER BY created_at DESC 
//           LIMIT $2 OFFSET $3
//         `, [userId, limit, offset]);

//         const notifications = result.rows.map(row => ({
//           id: row.id,
//           type: row.type,
//           title: row.title,
//           message: row.message,
//           data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
//           isRead: row.is_read,
//           createdAt: row.created_at,
//           readAt: row.read_at
//         }));

//         res.json({
//           success: true,
//           notifications,
//           count: notifications.length
//         });
//       } catch (err) {
//         logger.error('Error fetching notifications:', err);
//         res.status(500).json({ success: false, error: 'Server error' });
//       }
//     });

//     // Mark notification as read
//     router.patch('/:id/read', authMiddleware, validateId, async (req, res) => {
//       try {
//         const notificationId = req.params.id;
//         const userId = req.user.userId;

//         const result = await pool.query(`
//           UPDATE notifications 
//           SET is_read = true, read_at = CURRENT_TIMESTAMP
//           WHERE id = $1 AND user_id = $2
//           RETURNING id
//         `, [notificationId, userId]);

//         if (result.rows.length === 0) {
//           return res.status(404).json({ 
//             success: false, 
//             error: 'Notification not found' 
//           });
//         }

//         res.json({
//           success: true,
//           message: 'Notification marked as read'
//         });
//       } catch (err) {
//         logger.error('Error marking notification as read:', err);
//         res.status(500).json({ success: false, error: 'Server error' });
//       }
//     });

//     // Mark all notifications as read
//     router.patch('/read-all', authMiddleware, async (req, res) => {
//       try {
//         const userId = req.user.userId;

//         const result = await pool.query(`
//           UPDATE notifications 
//           SET is_read = true, read_at = CURRENT_TIMESTAMP
//           WHERE user_id = $1 AND is_read = false
//         `, [userId]);

//         res.json({
//           success: true,
//           message: `${result.rowCount} notifications marked as read`
//         });
//       } catch (err) {
//         logger.error('Error marking all notifications as read:', err);
//         res.status(500).json({ success: false, error: 'Server error' });
//       }
//     });

//     // Delete notification
//     router.delete('/:id', authMiddleware, validateId, async (req, res) => {
//       try {
//         const notificationId = req.params.id;
//         const userId = req.user.userId;

//         const result = await pool.query(`
//           DELETE FROM notifications 
//           WHERE id = $1 AND user_id = $2
//           RETURNING id
//         `, [notificationId, userId]);

//         if (result.rows.length === 0) {
//           return res.status(404).json({ 
//             success: false, 
//             error: 'Notification not found' 
//           });
//         }

//         res.json({
//           success: true,
//           message: 'Notification deleted'
//         });
//       } catch (err) {
//         logger.error('Error deleting notification:', err);
//         res.status(500).json({ success: false, error: 'Server error' });
//       }
//     });

//     // Delete all read notifications
//     router.delete('/read', authMiddleware, async (req, res) => {
//       try {
//         const userId = req.user.userId;

//         const result = await pool.query(`
//           DELETE FROM notifications 
//           WHERE user_id = $1 AND is_read = true
//         `, [userId]);

//         res.json({
//           success: true,
//           message: `${result.rowCount} read notifications deleted`
//         });
//       } catch (err) {
//         logger.error('Error deleting read notifications:', err);
//         res.status(500).json({ success: false, error: 'Server error' });
//       }
//     });

//     // Get notification count
//     router.get('/count', authMiddleware, async (req, res) => {
//       try {
//         const userId = req.user.userId;

//         const result = await pool.query(`
//           SELECT 
//             COUNT(*) as total_count,
//             COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
//           FROM notifications 
//           WHERE user_id = $1
//         `, [userId]);

//         const counts = result.rows[0];

//         res.json({
//           success: true,
//           totalCount: parseInt(counts.total_count),
//           unreadCount: parseInt(counts.unread_count)
//         });
//       } catch (err) {
//         logger.error('Error fetching notification count:', err);
//         res.status(500).json({ success: false, error: 'Server error' });
//       }
//     });

//     return router;
// };