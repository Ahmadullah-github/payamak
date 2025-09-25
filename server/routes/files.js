// File: server/routes/files.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const { logger } = require('../middleware/errorHandler');

module.exports = function(pool) {
    const router = express.Router();

    // Serve profile pictures (public access)
    router.get('/profiles/:filename', async (req, res) => {
      try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../uploads/profiles', filename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ success: false, error: 'File not found' });
        }

        // Verify file exists in database and is public
        const fileResult = await pool.query(
          'SELECT * FROM files WHERE filename = $1 AND is_public = true',
          [filename]
        );

        if (fileResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'File not found' });
        }

        const file = fileResult.rows[0];
        
        // Set appropriate headers
        res.set({
          'Content-Type': file.mime_type,
          'Content-Length': file.file_size,
          'Cache-Control': 'public, max-age=86400' // Cache for 1 day
        });

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

      } catch (err) {
        logger.error('Error serving profile picture:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Serve media files (authenticated access)
    router.get('/media/:type/:filename', authMiddleware, async (req, res) => {
      try {
        const { type, filename } = req.params;
        const userId = req.user.userId;
        
        // Validate type
        const allowedTypes = ['images', 'videos', 'audio', 'documents'];
        if (!allowedTypes.includes(type)) {
          return res.status(400).json({ success: false, error: 'Invalid file type' });
        }

        const filePath = path.join(__dirname, '../uploads/media', type, filename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ success: false, error: 'File not found' });
        }

        // Verify file exists in database
        const fileResult = await pool.query(
          'SELECT * FROM files WHERE filename = $1',
          [filename]
        );

        if (fileResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'File not found' });
        }

        const file = fileResult.rows[0];

        // Check if user has access to this file (either uploaded by user or in a shared chat)
        const accessCheck = await pool.query(`
          SELECT 1 FROM (
            SELECT 1 WHERE $1 = $2
            UNION
            SELECT 1 FROM messages m
            JOIN chat_members cm ON m.chat_id = cm.chat_id
            WHERE m.media_file_id = $3 AND cm.user_id = $1
          ) as access_check
        `, [userId, file.uploaded_by, file.id]);

        if (accessCheck.rows.length === 0) {
          return res.status(403).json({ success: false, error: 'Access denied' });
        }

        // Set appropriate headers
        res.set({
          'Content-Type': file.mime_type,
          'Content-Length': file.file_size,
          'Cache-Control': 'private, max-age=3600' // Cache for 1 hour
        });

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

      } catch (err) {
        logger.error('Error serving media file:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Get file info (authenticated)  
    router.get('/info/:fileId', authMiddleware, async (req, res) => {
      try {
        const { fileId } = req.params;
        const userId = req.user.userId;

        const fileResult = await pool.query(
          `SELECT f.*, u.full_name as uploader_name
           FROM files f
           JOIN users u ON f.uploaded_by = u.id
           WHERE f.id = $1`,
          [fileId]
        );

        if (fileResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'File not found' });
        }

        const file = fileResult.rows[0];

        // Check if user has access to this file
        const accessCheck = await pool.query(`
          SELECT 1 FROM (
            SELECT 1 WHERE $1 = $2
            UNION
            SELECT 1 FROM messages m
            JOIN chat_members cm ON m.chat_id = cm.chat_id
            WHERE m.media_file_id = $3 AND cm.user_id = $1
          ) as access_check
        `, [userId, file.uploaded_by, file.id]);

        if (accessCheck.rows.length === 0) {
          return res.status(403).json({ success: false, error: 'Access denied' });
        }

        res.json({
          success: true,
          file: {
            id: file.id,
            filename: file.filename,
            mimeType: file.mime_type,
            fileSize: file.file_size,
            uploadedBy: file.uploaded_by,
            uploaderName: file.uploader_name,
            uploadedAt: file.uploaded_at,
            description: file.description
          }
        });

      } catch (err) {
        logger.error('Error getting file info:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Delete file (only by uploader)
    router.delete('/:fileId', authMiddleware, async (req, res) => {
      try {
        const { fileId } = req.params;
        const userId = req.user.userId;

        // Get file info and verify ownership
        const fileResult = await pool.query(
          'SELECT * FROM files WHERE id = $1 AND uploaded_by = $2',
          [fileId, userId]
        );

        if (fileResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'File not found or access denied' });
        }

        const file = fileResult.rows[0];

        // Check if file is being used as profile picture
        const profileCheck = await pool.query(
          'SELECT 1 FROM users WHERE profile_picture_id = $1',
          [fileId]
        );

        if (profileCheck.rows.length > 0) {
          return res.status(400).json({ 
            success: false, 
            error: 'Cannot delete file: currently used as profile picture' 
          });
        }

        // Check if file is being used in messages
        const messageCheck = await pool.query(
          'SELECT 1 FROM messages WHERE media_file_id = $1',
          [fileId]
        );

        if (messageCheck.rows.length > 0) {
          return res.status(400).json({ 
            success: false, 
            error: 'Cannot delete file: currently used in messages' 
          });
        }

        // Delete physical file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        // Delete from database
        await pool.query('DELETE FROM files WHERE id = $1', [fileId]);

        res.json({
          success: true,
          message: 'File deleted successfully'
        });

      } catch (err) {
        logger.error('Error deleting file:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    return router;
};