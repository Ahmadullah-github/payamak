// File: server/routes/users.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
const { profileUpload, processProfileImage, cleanupOnError } = require('../middleware/upload');
const { uploadLimiter, generalLimiter } = require('../middleware/rateLimiter');
const { validateProfileUpdate, validateId, validatePasswordChange } = require('../middleware/validation');
const { logger } = require('../middleware/errorHandler');

module.exports = function(pool) {
    const router = express.Router();

    // Security: Validate filename to prevent directory traversal
    const validateFilename = (filename) => {
        if (!filename || typeof filename !== 'string') return false;
        const safePattern = /^[a-zA-Z0-9._-]+$/;
        return safePattern.test(filename) && !filename.includes('..');
    };

    // Get all users (for chat list) with enhanced search and filtering
    router.get('/', authMiddleware, generalLimiter, async (req, res) => {
      try {
        const currentUserId = req.user.userId;
        const { search, limit, offset, excludeChat } = req.query;
        
        let query = `
          SELECT u.id, u.username, u.full_name, u.is_online, u.last_seen, u.status,
                 f.filename as profile_picture_filename, f.path as profile_picture_path
          FROM users u
          LEFT JOIN files f ON u.profile_picture_id = f.id
          WHERE u.id != $1 
        `;
        
        const queryParams = [currentUserId];
        let paramCount = 1;

        // Add search filter if provided
        if (search && search.trim() !== '') {
          paramCount++;
          query += ` AND (u.username ILIKE $${paramCount} OR u.full_name ILIKE $${paramCount}) `;
          queryParams.push(`%${search}%`);
        }

        // Exclude users from a specific chat if requested
        if (excludeChat) {
          paramCount++;
          query += ` AND u.id NOT IN (
            SELECT user_id FROM chat_members WHERE chat_id = $${paramCount}
          )`;
          queryParams.push(excludeChat);
        }

        query += ` ORDER BY 
          u.is_online DESC,
          u.full_name ASC
          ${limit ? ` LIMIT $${paramCount + 1}` : ''}
          ${offset ? ` OFFSET $${paramCount + 2}` : ''}
        `;

        if (limit) {
          queryParams.push(parseInt(limit));
        }
        if (offset) {
          queryParams.push(parseInt(offset));
        }
        
        const usersResult = await pool.query(query, queryParams);
        
        const users = usersResult.rows.map(user => ({
          id: user.id.toString(),
          username: user.username,
          fullName: user.full_name,
          avatarUrl: user.profile_picture_filename 
            ? `/api/files/profiles/${user.profile_picture_filename}`
            : `/api/avatars/${user.id}`, // Use consistent avatar service
          isOnline: user.is_online,
          lastSeen: user.last_seen,
          status: user.status,
          hasCustomAvatar: !!user.profile_picture_filename
        }));
        
        res.json({
          success: true,
          users: users,
          total: usersResult.rows.length
        });
      } catch (err) {
        logger.error('Error fetching users:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Get specific user info with enhanced data
    router.get('/:id', authMiddleware, validateId, async (req, res) => {
      try {
        const userId = req.params.id;
        const currentUserId = req.user.userId;
        
        const userResult = await pool.query(
          `SELECT u.id, u.username, u.full_name, u.is_online, u.last_seen, u.status, u.created_at,
                  f.filename as profile_picture_filename, f.path as profile_picture_path,
                  -- Check if current user has a chat with this user
                  EXISTS (
                    SELECT 1 FROM chats c
                    JOIN chat_members cm1 ON c.id = cm1.chat_id
                    JOIN chat_members cm2 ON c.id = cm2.chat_id
                    WHERE c.type = 'private' 
                    AND cm1.user_id = $1 
                    AND cm2.user_id = $2
                  ) as has_existing_chat
           FROM users u
           LEFT JOIN files f ON u.profile_picture_id = f.id
           WHERE u.id = $2`,
          [currentUserId, userId]
        );
        
        if (userResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        const user = userResult.rows[0];
        res.json({
          success: true,
          user: {
            id: user.id.toString(),
            username: user.username,
            fullName: user.full_name,
            avatarUrl: user.profile_picture_filename 
              ? `/api/files/profiles/${user.profile_picture_filename}`
              : `/api/avatars/${user.id}`,
            isOnline: user.is_online,
            lastSeen: user.last_seen,
            status: user.status,
            createdAt: user.created_at,
            hasExistingChat: user.has_existing_chat,
            hasCustomAvatar: !!user.profile_picture_filename
          }
        });
      } catch (err) {
        logger.error('Error fetching user:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Update user profile with enhanced fields
    router.put('/profile', authMiddleware, validateProfileUpdate, async (req, res) => {
      try {
        const { fullName, status, username } = req.body;
        const currentUserId = req.user.userId;

        if (!fullName || fullName.trim() === '') {
          return res.status(400).json({ success: false, error: 'Full name cannot be empty' });
        }

        // Check if username is already taken (if changing username)
        if (username) {
          const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1 AND id != $2',
            [username, currentUserId]
          );
          
          if (existingUser.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Username already taken' });
          }
        }

        const updateFields = [];
        const updateValues = [];
        let paramCount = 0;

        if (fullName) {
          updateFields.push(`full_name = $${++paramCount}`);
          updateValues.push(fullName.trim());
        }

        if (status !== undefined) {
          updateFields.push(`status = $${++paramCount}`);
          updateValues.push(status);
        }

        if (username) {
          updateFields.push(`username = $${++paramCount}`);
          updateValues.push(username.trim());
        }

        if (updateFields.length === 0) {
          return res.status(400).json({ success: false, error: 'No fields to update' });
        }

        updateValues.push(currentUserId);

        const updateResult = await pool.query(
          `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $${paramCount + 1} 
           RETURNING id, username, full_name, status, created_at, updated_at`,
          updateValues
        );

        if (updateResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'User not found' });
        }

        const updatedUser = updateResult.rows[0];

        res.json({ 
          success: true, 
          message: 'Profile updated successfully',
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            fullName: updatedUser.full_name,
            status: updatedUser.status,
            createdAt: updatedUser.created_at,
            updatedAt: updatedUser.updated_at
          }
        });
      } catch (err) {
        logger.error('Error updating profile:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Change user password
    router.put('/password', authMiddleware, validatePasswordChange, async (req, res) => {
      try {
        const { currentPassword, newPassword } = req.body;
        const currentUserId = req.user.userId;

        // Get current password hash
        const userResult = await pool.query(
          'SELECT password_hash FROM users WHERE id = $1',
          [currentUserId]
        );

        if (userResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(
          currentPassword, 
          userResult.rows[0].password_hash
        );

        if (!isValidPassword) {
          return res.status(400).json({ success: false, error: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await pool.query(
          'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newPasswordHash, currentUserId]
        );

        res.json({ 
          success: true, 
          message: 'Password updated successfully' 
        });
      } catch (err) {
        logger.error('Error changing password:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Upload profile picture with enhanced processing
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

          // Validate file type
          const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedMimeTypes.includes(mimetype)) {
            return res.status(400).json({ 
              success: false, 
              error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' 
            });
          }

          // Validate file size (max 5MB)
          const maxSize = 5 * 1024 * 1024;
          if (size > maxSize) {
            return res.status(400).json({ 
              success: false, 
              error: 'File too large. Maximum size is 5MB.' 
            });
          }

          // Start transaction
          const client = await pool.connect();
          try {
            await client.query('BEGIN');

            // Save file info to database
            const fileResult = await client.query(
              `INSERT INTO files (filename, path, mime_type, file_size, uploaded_by, is_public, description)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING id`,
              [filename, filePath, mimetype, size, currentUserId, true, 'Profile picture']
            );

            const fileId = fileResult.rows[0].id;

            // Get current profile picture ID to delete old one
            const currentPictureResult = await client.query(
              'SELECT profile_picture_id FROM users WHERE id = $1',
              [currentUserId]
            );

            const oldPictureId = currentPictureResult.rows[0]?.profile_picture_id;

            // Update user's profile picture
            await client.query(
              'UPDATE users SET profile_picture_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
              [fileId, currentUserId]
            );

            // Delete old profile picture file and database record if exists
            if (oldPictureId) {
              const oldFileResult = await client.query(
                'SELECT path FROM files WHERE id = $1',
                [oldPictureId]
              );

              if (oldFileResult.rows.length > 0) {
                const oldFilePath = oldFileResult.rows[0].path;
                if (fs.existsSync(oldFilePath)) {
                  fs.unlinkSync(oldFilePath);
                }
              }

              await client.query('DELETE FROM files WHERE id = $1', [oldPictureId]);
            }

            await client.query('COMMIT');

            res.json({
              success: true,
              message: 'Profile picture updated successfully',
              avatarUrl: `/api/files/profiles/${filename}`,
              fileInfo: {
                id: fileId,
                filename: filename,
                size: size,
                mimeType: mimetype
              }
            });

          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          } finally {
            client.release();
          }

        } catch (err) {
          logger.error('Error uploading profile picture:', err);
          res.status(500).json({ success: false, error: 'Failed to upload profile picture' });
        }
      }
    );

    // Delete profile picture
    router.delete('/profile-picture', authMiddleware, async (req, res) => {
      try {
        const currentUserId = req.user.userId;

        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // Get current profile picture ID
          const currentPictureResult = await client.query(
            'SELECT profile_picture_id FROM users WHERE id = $1',
            [currentUserId]
          );

          const pictureId = currentPictureResult.rows[0]?.profile_picture_id;

          if (!pictureId) {
            return res.status(400).json({ 
              success: false, 
              error: 'No profile picture to delete' 
            });
          }

          // Remove profile picture reference from user
          await client.query(
            'UPDATE users SET profile_picture_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [currentUserId]
          );

          // Get file info for deletion
          const fileResult = await client.query(
            'SELECT path FROM files WHERE id = $1',
            [pictureId]
          );

          if (fileResult.rows.length > 0) {
            const filePath = fileResult.rows[0].path;
            // Delete physical file
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }

          // Delete file record
          await client.query('DELETE FROM files WHERE id = $1', [pictureId]);

          await client.query('COMMIT');

          res.json({
            success: true,
            message: 'Profile picture deleted successfully'
          });

        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }

      } catch (err) {
        logger.error('Error deleting profile picture:', err);
        res.status(500).json({ success: false, error: 'Failed to delete profile picture' });
      }
    });

    // Get current user's full profile with statistics
    router.get('/me/profile', authMiddleware, async (req, res) => {
      try {
        const currentUserId = req.user.userId;

        const userResult = await pool.query(
          `SELECT u.id, u.username, u.full_name, u.status, u.created_at, u.updated_at,
                  f.filename as profile_picture_filename,
                  (SELECT COUNT(*) FROM chats c 
                   JOIN chat_members cm ON c.id = cm.chat_id 
                   WHERE cm.user_id = u.id) as total_chats,
                  (SELECT COUNT(*) FROM messages m 
                   WHERE m.sender_id = u.id) as total_messages
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
            updatedAt: user.updated_at,
            avatarUrl: user.profile_picture_filename
              ? `/api/files/profiles/${user.profile_picture_filename}`
              : null,
            statistics: {
              totalChats: parseInt(user.total_chats) || 0,
              totalMessages: parseInt(user.total_messages) || 0
            }
          }
        });
      } catch (err) {
        logger.error('Error fetching user profile:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Update user online status (for WebSocket connections)
    router.post('/online-status', authMiddleware, async (req, res) => {
      try {
        const { isOnline } = req.body;
        const currentUserId = req.user.userId;

        await pool.query(
          `UPDATE users SET 
            is_online = $1, 
            last_seen = CASE WHEN $1 = false THEN CURRENT_TIMESTAMP ELSE last_seen END
           WHERE id = $2`,
          [isOnline, currentUserId]
        );

        res.json({ 
          success: true, 
          message: `User marked as ${isOnline ? 'online' : 'offline'}` 
        });
      } catch (err) {
        logger.error('Error updating online status:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    return router;
};




// // File: server/routes/users.js
// const express = require('express');
// const path = require('path');
// const fs = require('fs');
// const authMiddleware = require('../middleware/authMiddleware');
// const { profileUpload, processProfileImage, cleanupOnError } = require('../middleware/upload');
// const { uploadLimiter } = require('../middleware/rateLimiter');
// const { validateProfileUpdate, validateId } = require('../middleware/validation');
// const { logger } = require('../middleware/errorHandler');

// module.exports = function(pool) {
//     const router = express.Router();

//     // Get all users (for chat list)
//     router.get('/', authMiddleware, async (req, res) => {
//       try {
//         const currentUserId = req.user.userId;
        
//         // Get all users except the current user with profile pictures
//         const usersResult = await pool.query(
//           `SELECT u.id, u.username, u.full_name, u.is_online, u.last_seen, u.status,
//                   f.filename as profile_picture_filename, f.path as profile_picture_path
//            FROM users u
//            LEFT JOIN files f ON u.profile_picture_id = f.id
//            WHERE u.id != $1 
//            ORDER BY u.full_name`,
//           [currentUserId]
//         );
        
//         const users = usersResult.rows.map(user => ({
//           id: user.id,
//           username: user.username,
//           fullName: user.full_name,
//           avatarUrl: user.profile_picture_filename 
//             ? `/api/files/profiles/${user.profile_picture_filename}`
//             : `https://i.pravatar.cc/150?u=${user.id}`,
//           isOnline: user.is_online,
//           lastSeen: user.last_seen,
//           status: user.status
//         }));
        
//         res.json(users);
//       } catch (err) {
//         logger.error('Error fetching users:', err);
//         res.status(500).json({ success: false, error: 'Server error' });
//       }
//     });

//     // Get specific user info
//     router.get('/:id', authMiddleware, validateId, async (req, res) => {
//       try {
//         const userId = req.params.id;
        
//         const userResult = await pool.query(
//           `SELECT u.id, u.username, u.full_name, u.is_online, u.last_seen, u.status,
//                   f.filename as profile_picture_filename, f.path as profile_picture_path
//            FROM users u
//            LEFT JOIN files f ON u.profile_picture_id = f.id
//            WHERE u.id = $1`,
//           [userId]
//         );
        
//         if (userResult.rows.length === 0) {
//           return res.status(404).json({ success: false, error: 'User not found' });
//         }
        
//         const user = userResult.rows[0];
//         res.json({
//           id: user.id,
//           username: user.username,
//           fullName: user.full_name,
//           avatarUrl: user.profile_picture_filename 
//             ? `/api/files/profiles/${user.profile_picture_filename}`
//             : `https://i.pravatar.cc/150?u=${user.id}`,
//           isOnline: user.is_online,
//           lastSeen: user.last_seen,
//           status: user.status
//         });
//       } catch (err) {
//         logger.error('Error fetching user:', err);
//         res.status(500).json({ success: false, error: 'Server error' });
//       }
//     });

//     // Update user profile
//     router.put('/', authMiddleware, validateProfileUpdate, async (req, res) => {
//       try {
//         const { fullName } = req.body;
//         const currentUserId = req.user.userId;

//         if (!fullName || fullName.trim() === '') {
//           return res.status(400).json({ success: false, error: 'Full name cannot be empty' });
//         }

//         const updateResult = await pool.query(
//           `UPDATE users SET full_name = $1 WHERE id = $2 
//            RETURNING id, username, full_name`,
//           [fullName, currentUserId]
//         );

//         if (updateResult.rows.length === 0) {
//           return res.status(404).json({ success: false, error: 'User not found' });
//         }

//         const updatedUser = {
//           id: updateResult.rows[0].id,
//           username: updateResult.rows[0].username,
//           fullName: updateResult.rows[0].full_name,
//         };

//         res.json({ success: true, user: updatedUser });
//       } catch (err) {
//         logger.error('Error updating profile:', err);
//         res.status(500).json({ success: false, error: 'Server error' });
//       }
//     });

//     // Upload profile picture
//     router.post('/profile-picture', 
//       authMiddleware, 
//       uploadLimiter,
//       profileUpload.single('profilePicture'),
//       processProfileImage,
//       cleanupOnError,
//       async (req, res) => {
//         try {
//           if (!req.file) {
//             return res.status(400).json({ success: false, error: 'No file uploaded' });
//           }

//           const currentUserId = req.user.userId;
//           const { filename, path: filePath, size, mimetype } = req.file;

//           // Save file info to database
//           const fileResult = await pool.query(
//             `INSERT INTO files (filename, path, mime_type, file_size, uploaded_by, is_public)
//              VALUES ($1, $2, $3, $4, $5, $6)
//              RETURNING id`,
//             [filename, filePath, mimetype, size, currentUserId, true]
//           );

//           const fileId = fileResult.rows[0].id;

//           // Get current profile picture ID to delete old one
//           const currentPictureResult = await pool.query(
//             'SELECT profile_picture_id FROM users WHERE id = $1',
//             [currentUserId]
//           );

//           const oldPictureId = currentPictureResult.rows[0]?.profile_picture_id;

//           // Update user's profile picture
//           await pool.query(
//             'UPDATE users SET profile_picture_id = $1 WHERE id = $2',
//             [fileId, currentUserId]
//           );

//           // Delete old profile picture file and database record
//           if (oldPictureId) {
//             const oldFileResult = await pool.query(
//               'SELECT path FROM files WHERE id = $1',
//               [oldPictureId]
//             );

//             if (oldFileResult.rows.length > 0) {
//               const oldFilePath = oldFileResult.rows[0].path;
//               if (fs.existsSync(oldFilePath)) {
//                 fs.unlinkSync(oldFilePath);
//               }
//             }

//             await pool.query('DELETE FROM files WHERE id = $1', [oldPictureId]);
//           }

//           res.json({
//             success: true,
//             message: 'Profile picture updated successfully',
//             avatarUrl: `/api/files/profiles/${filename}`
//           });

//         } catch (err) {
//           logger.error('Error uploading profile picture:', err);
//           res.status(500).json({ success: false, error: 'Failed to upload profile picture' });
//         }
//       }
//     );

//     // Get current user's full profile
//     router.get('/me/profile', authMiddleware, async (req, res) => {
//       try {
//         const currentUserId = req.user.userId;

//         const userResult = await pool.query(
//           `SELECT u.id, u.username, u.full_name, u.status, u.created_at,
//                   f.filename as profile_picture_filename
//            FROM users u
//            LEFT JOIN files f ON u.profile_picture_id = f.id
//            WHERE u.id = $1`,
//           [currentUserId]
//         );

//         if (userResult.rows.length === 0) {
//           return res.status(404).json({ success: false, error: 'User not found' });
//         }

//         const user = userResult.rows[0];
//         res.json({
//           success: true,
//           user: {
//             id: user.id,
//             username: user.username,
//             fullName: user.full_name,
//             status: user.status,
//             createdAt: user.created_at,
//             avatarUrl: user.profile_picture_filename
//               ? `/api/files/profiles/${user.profile_picture_filename}`
//               : null
//           }
//         });
//       } catch (err) {
//         logger.error('Error fetching user profile:', err);
//         res.status(500).json({ success: false, error: 'Server error' });
//       }
//     });

//     return router;
// };