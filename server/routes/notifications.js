// File: server/routes/notifications.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { validateId, validatePagination } = require('../middleware/validation');
const { logger } = require('../middleware/errorHandler');

module.exports = function(pool) {
    const router = express.Router();

    // Get unread notifications for current user
    router.get('/unread', authMiddleware, validatePagination, async (req, res) => {
      try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const result = await pool.query(`
          SELECT id, type, title, message, data, created_at
          FROM notifications 
          WHERE user_id = $1 AND is_read = false 
          ORDER BY created_at DESC 
          LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);

        const notifications = result.rows.map(row => ({
          id: row.id,
          type: row.type,
          title: row.title,
          message: row.message,
          data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
          createdAt: row.created_at
        }));

        res.json({
          success: true,
          notifications,
          count: notifications.length
        });
      } catch (err) {
        logger.error('Error fetching unread notifications:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Get all notifications for current user
    router.get('/', authMiddleware, validatePagination, async (req, res) => {
      try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const result = await pool.query(`
          SELECT id, type, title, message, data, is_read, created_at, read_at
          FROM notifications 
          WHERE user_id = $1
          ORDER BY created_at DESC 
          LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);

        const notifications = result.rows.map(row => ({
          id: row.id,
          type: row.type,
          title: row.title,
          message: row.message,
          data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
          isRead: row.is_read,
          createdAt: row.created_at,
          readAt: row.read_at
        }));

        res.json({
          success: true,
          notifications,
          count: notifications.length
        });
      } catch (err) {
        logger.error('Error fetching notifications:', err);
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
          RETURNING id
        `, [notificationId, userId]);

        if (result.rows.length === 0) {
          return res.status(404).json({ 
            success: false, 
            error: 'Notification not found' 
          });
        }

        res.json({
          success: true,
          message: 'Notification marked as read'
        });
      } catch (err) {
        logger.error('Error marking notification as read:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Mark all notifications as read
    router.patch('/read-all', authMiddleware, async (req, res) => {
      try {
        const userId = req.user.userId;

        const result = await pool.query(`
          UPDATE notifications 
          SET is_read = true, read_at = CURRENT_TIMESTAMP
          WHERE user_id = $1 AND is_read = false
        `, [userId]);

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
          RETURNING id
        `, [notificationId, userId]);

        if (result.rows.length === 0) {
          return res.status(404).json({ 
            success: false, 
            error: 'Notification not found' 
          });
        }

        res.json({
          success: true,
          message: 'Notification deleted'
        });
      } catch (err) {
        logger.error('Error deleting notification:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Delete all read notifications
    router.delete('/read', authMiddleware, async (req, res) => {
      try {
        const userId = req.user.userId;

        const result = await pool.query(`
          DELETE FROM notifications 
          WHERE user_id = $1 AND is_read = true
        `, [userId]);

        res.json({
          success: true,
          message: `${result.rowCount} read notifications deleted`
        });
      } catch (err) {
        logger.error('Error deleting read notifications:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Get notification count
    router.get('/count', authMiddleware, async (req, res) => {
      try {
        const userId = req.user.userId;

        const result = await pool.query(`
          SELECT 
            COUNT(*) as total_count,
            COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
          FROM notifications 
          WHERE user_id = $1
        `, [userId]);

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

    return router;
};