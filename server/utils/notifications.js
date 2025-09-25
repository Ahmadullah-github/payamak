// File: server/utils/notifications.js
const { logger } = require('../middleware/errorHandler');

class NotificationService {
  constructor(io, pool) {
    this.io = io;
    this.pool = pool;
    this.onlineUsers = new Map(); // userId -> socketId
  }

  // Set user online status
  setUserOnline(userId, socketId) {
    this.onlineUsers.set(userId, socketId);
    logger.info(`User ${userId} is now online with socket ${socketId}`);
  }

  // Set user offline status
  setUserOffline(userId) {
    this.onlineUsers.delete(userId);
    logger.info(`User ${userId} is now offline`);
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  // Get user's socket ID
  getUserSocketId(userId) {
    return this.onlineUsers.get(userId);
  }

  // Send real-time notification to user
  async sendNotificationToUser(userId, notificationData) {
    try {
      const socketId = this.getUserSocketId(userId);
      
      if (socketId) {
        // User is online, send real-time notification
        this.io.to(socketId).emit('notification', notificationData);
        logger.info(`Real-time notification sent to user ${userId}`);
        return true;
      } else {
        // User is offline, store notification for later retrieval
        await this.storeOfflineNotification(userId, notificationData);
        logger.info(`Notification stored for offline user ${userId}`);
        return false;
      }
    } catch (error) {
      logger.error('Error sending notification:', error);
      return false;
    }
  }

  // Store notification for offline users
  async storeOfflineNotification(userId, notificationData) {
    try {
      await this.pool.query(`
        INSERT INTO notifications (user_id, type, title, message, data, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [
        userId,
        notificationData.type,
        notificationData.title,
        notificationData.message,
        JSON.stringify(notificationData.data || {})
      ]);
    } catch (error) {
      logger.error('Error storing offline notification:', error);
    }
  }

  // Get unread notifications for user
  async getUnreadNotifications(userId) {
    try {
      const result = await this.pool.query(`
        SELECT id, type, title, message, data, created_at
        FROM notifications 
        WHERE user_id = $1 AND is_read = false 
        ORDER BY created_at DESC 
        LIMIT 50
      `, [userId]);

      return result.rows.map(row => ({
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
        createdAt: row.created_at
      }));
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId, userId) {
    try {
      await this.pool.query(`
        UPDATE notifications 
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
      `, [notificationId, userId]);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  }

  // Send message notification to chat members
  async notifyNewMessage(messageData, chatId, senderId) {
    try {
      // Get chat members except sender
      const membersResult = await this.pool.query(`
        SELECT cm.user_id, u.full_name
        FROM chat_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.chat_id = $1 AND cm.user_id != $2
      `, [chatId, senderId]);

      // Get sender info
      const senderResult = await this.pool.query(
        'SELECT full_name FROM users WHERE id = $1',
        [senderId]
      );

      const senderName = senderResult.rows[0]?.full_name || 'Someone';

      // Get chat info
      const chatResult = await this.pool.query(
        'SELECT type, name FROM chats WHERE id = $1',
        [chatId]
      );

      const chat = chatResult.rows[0];
      const chatName = chat?.type === 'group' ? chat.name : senderName;

      // Send notifications to all members
      for (const member of membersResult.rows) {
        const notificationData = {
          type: 'new_message',
          title: chatName,
          message: messageData.type === 'text' 
            ? messageData.content 
            : `${senderName} sent ${messageData.type === 'image' ? 'an image' : 
                messageData.type === 'video' ? 'a video' : 
                messageData.type === 'audio' ? 'an audio' : 'a file'}`,
          data: {
            chatId: chatId,
            messageId: messageData.id,
            senderId: senderId,
            senderName: senderName,
            messageType: messageData.type
          }
        };

        await this.sendNotificationToUser(member.user_id, notificationData);
      }
    } catch (error) {
      logger.error('Error sending message notifications:', error);
    }
  }

  // Clean up old notifications (call periodically)
  async cleanupOldNotifications(daysOld = 30) {
    try {
      await this.pool.query(`
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '${daysOld} days' 
        AND is_read = true
      `);
      logger.info(`Cleaned up old notifications older than ${daysOld} days`);
    } catch (error) {
      logger.error('Error cleaning up notifications:', error);
    }
  }
}

module.exports = NotificationService;