// File: server/routes/users.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const { profileUpload, processProfileImage, cleanupOnError } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateProfileUpdate, validateId } = require('../middleware/validation');
const { logger } = require('../middleware/errorHandler');

module.exports = function(pool) {
    const router = express.Router();

    // Get all users (for chat list)
    router.get('/', authMiddleware, async (req, res) => {
      try {
        const currentUserId = req.user.userId;
        
        // Get all users except the current user with profile pictures
        const usersResult = await pool.query(
          `SELECT u.id, u.username, u.full_name, u.is_online, u.last_seen, u.status,
                  f.filename as profile_picture_filename, f.path as profile_picture_path
           FROM users u
           LEFT JOIN files f ON u.profile_picture_id = f.id
           WHERE u.id != $1 
           ORDER BY u.full_name`,
          [currentUserId]
        );
        
        const users = usersResult.rows.map(user => ({
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          avatarUrl: user.profile_picture_filename 
            ? `/api/files/profiles/${user.profile_picture_filename}`
            : `https://i.pravatar.cc/150?u=${user.id}`,
          isOnline: user.is_online,
          lastSeen: user.last_seen,
          status: user.status
        }));
        
        res.json(users);
      } catch (err) {
        logger.error('Error fetching users:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Get specific user info
    router.get('/:id', authMiddleware, validateId, async (req, res) => {
      try {
        const userId = req.params.id;
        
        const userResult = await pool.query(
          `SELECT u.id, u.username, u.full_name, u.is_online, u.last_seen, u.status,
                  f.filename as profile_picture_filename, f.path as profile_picture_path
           FROM users u
           LEFT JOIN files f ON u.profile_picture_id = f.id
           WHERE u.id = $1`,
          [userId]
        );
        
        if (userResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        const user = userResult.rows[0];
        res.json({
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          avatarUrl: user.profile_picture_filename 
            ? `/api/files/profiles/${user.profile_picture_filename}`
            : `https://i.pravatar.cc/150?u=${user.id}`,
          isOnline: user.is_online,
          lastSeen: user.last_seen,
          status: user.status
        });
      } catch (err) {
        logger.error('Error fetching user:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Update user profile
    router.put('/', authMiddleware, validateProfileUpdate, async (req, res) => {
      try {
        const { fullName } = req.body;
        const currentUserId = req.user.userId;

        if (!fullName || fullName.trim() === '') {
          return res.status(400).json({ success: false, error: 'Full name cannot be empty' });
        }

        const updateResult = await pool.query(
          `UPDATE users SET full_name = $1 WHERE id = $2 
           RETURNING id, username, full_name`,
          [fullName, currentUserId]
        );

        if (updateResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'User not found' });
        }

        const updatedUser = {
          id: updateResult.rows[0].id,
          username: updateResult.rows[0].username,
          fullName: updateResult.rows[0].full_name,
        };

        res.json({ success: true, user: updatedUser });
      } catch (err) {
        logger.error('Error updating profile:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Upload profile picture
    router.post('/profile-picture', 
      authMiddleware, 
      uploadLimiter,
      profileUpload.single('profilePicture'),
      processProfileImage,
      cleanupOnError,
      async (req, res) => {
        try {
          if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
          }

          const currentUserId = req.user.userId;
          const { filename, path: filePath, size, mimetype } = req.file;

          // Save file info to database
          const fileResult = await pool.query(
            `INSERT INTO files (filename, path, mime_type, file_size, uploaded_by, is_public)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [filename, filePath, mimetype, size, currentUserId, true]
          );

          const fileId = fileResult.rows[0].id;

          // Get current profile picture ID to delete old one
          const currentPictureResult = await pool.query(
            'SELECT profile_picture_id FROM users WHERE id = $1',
            [currentUserId]
          );

          const oldPictureId = currentPictureResult.rows[0]?.profile_picture_id;

          // Update user's profile picture
          await pool.query(
            'UPDATE users SET profile_picture_id = $1 WHERE id = $2',
            [fileId, currentUserId]
          );

          // Delete old profile picture file and database record
          if (oldPictureId) {
            const oldFileResult = await pool.query(
              'SELECT path FROM files WHERE id = $1',
              [oldPictureId]
            );

            if (oldFileResult.rows.length > 0) {
              const oldFilePath = oldFileResult.rows[0].path;
              if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
              }
            }

            await pool.query('DELETE FROM files WHERE id = $1', [oldPictureId]);
          }

          res.json({
            success: true,
            message: 'Profile picture updated successfully',
            avatarUrl: `/api/files/profiles/${filename}`
          });

        } catch (err) {
          logger.error('Error uploading profile picture:', err);
          res.status(500).json({ success: false, error: 'Failed to upload profile picture' });
        }
      }
    );

    // Get current user's full profile
    router.get('/me/profile', authMiddleware, async (req, res) => {
      try {
        const currentUserId = req.user.userId;

        const userResult = await pool.query(
          `SELECT u.id, u.username, u.full_name, u.status, u.created_at,
                  f.filename as profile_picture_filename
           FROM users u
           LEFT JOIN files f ON u.profile_picture_id = f.id
           WHERE u.id = $1`,
          [currentUserId]
        );

        if (userResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'User not found' });
        }

        const user = userResult.rows[0];
        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            status: user.status,
            createdAt: user.created_at,
            avatarUrl: user.profile_picture_filename
              ? `/api/files/profiles/${user.profile_picture_filename}`
              : null
          }
        });
      } catch (err) {
        logger.error('Error fetching user profile:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    return router;
};