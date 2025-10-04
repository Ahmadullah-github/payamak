// File: server/routes/files.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const { logger } = require('../middleware/errorHandler');

module.exports = function(pool) {
    const router = express.Router();

    // Enhanced type validation
    const allowedMediaTypes = ['images', 'videos', 'audio', 'documents', 'archives', 'code'];
    const publicTypes = ['profiles']; // Types that don't require authentication

    // Security: Validate filename to prevent directory traversal
    const validateFilename = (filename) => {
        if (!filename || typeof filename !== 'string') return false;
        // Prevent directory traversal and ensure safe filenames
        const safePattern = /^[a-zA-Z0-9._-]+$/;
        return safePattern.test(filename) && !filename.includes('..');
    };

    // Get MIME type from filename
    const getMimeType = (filename) => {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            // Images
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.svg': 'image/svg+xml',
            '.webp': 'image/webp',
            
            // Videos
            '.mp4': 'video/mp4',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            '.wmv': 'video/x-ms-wmv',
            '.webm': 'video/webm',
            
            // Audio
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.m4a': 'audio/mp4',
            
            // Documents
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.txt': 'text/plain',
            '.csv': 'text/csv',
            
            // Archives
            '.zip': 'application/zip',
            '.rar': 'application/vnd.rar',
            '.7z': 'application/x-7z-compressed',
            '.tar': 'application/x-tar',
            
            // Code
            '.js': 'application/javascript',
            '.ts': 'application/typescript',
            '.html': 'text/html',
            '.css': 'text/css',
            '.json': 'application/json',
            '.xml': 'application/xml'
        };
        
        return mimeTypes[ext] || 'application/octet-stream';
    };

    // Serve profile pictures (public access)
    router.get('/profiles/:filename', async (req, res) => {
      try {
        const { filename } = req.params;
        
        // Validate filename
        if (!validateFilename(filename)) {
          return res.status(400).json({ success: false, error: 'Invalid filename' });
        }

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
          'Content-Type': file.mime_type || getMimeType(filename),
          'Content-Length': file.file_size,
          'Cache-Control': 'public, max-age=86400', // Cache for 1 day
          'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`
        });

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.on('error', (err) => {
          logger.error('Error streaming file:', err);
          res.status(500).json({ success: false, error: 'Error streaming file' });
        });
        fileStream.pipe(res);

      } catch (err) {
        logger.error('Error serving profile picture:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Serve media files (authenticated access) - Enhanced for all file types
    router.get('/media/:type/:filename', authMiddleware, async (req, res) => {
      try {
        const { type, filename } = req.params;
        const userId = req.user.userId;
        
        // Validate type
        if (!allowedMediaTypes.includes(type)) {
          return res.status(400).json({ success: false, error: 'Invalid file type' });
        }

        // Validate filename
        if (!validateFilename(filename)) {
          return res.status(400).json({ success: false, error: 'Invalid filename' });
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

        // Determine if file should be displayed inline or downloaded
        const mimeType = file.mime_type || getMimeType(filename);
        const isInlineType = mimeType.startsWith('image/') || 
                           mimeType.startsWith('video/') || 
                           mimeType.startsWith('audio/') ||
                           mimeType === 'application/pdf' ||
                           mimeType.startsWith('text/');
        
        const contentDisposition = isInlineType 
          ? `inline; filename="${encodeURIComponent(filename)}"`
          : `attachment; filename="${encodeURIComponent(filename)}"`;

        // Set appropriate headers
        res.set({
          'Content-Type': mimeType,
          'Content-Length': file.file_size,
          'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
          'Content-Disposition': contentDisposition
        });

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.on('error', (err) => {
          logger.error('Error streaming file:', err);
          if (!res.headersSent) {
            res.status(500).json({ success: false, error: 'Error streaming file' });
          }
        });
        fileStream.pipe(res);

      } catch (err) {
        logger.error('Error serving media file:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Get file info (authenticated) - Enhanced response
    router.get('/info/:fileId', authMiddleware, async (req, res) => {
      try {
        const { fileId } = req.params;
        const userId = req.user.userId;

        const fileResult = await pool.query(
          `SELECT f.*, u.full_name as uploader_name,
                  CASE 
                    WHEN f.mime_type LIKE 'image/%' THEN 'image'
                    WHEN f.mime_type LIKE 'video/%' THEN 'video'
                    WHEN f.mime_type LIKE 'audio/%' THEN 'audio'
                    WHEN f.mime_type IN ('application/pdf', 
                                         'application/msword',
                                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                         'application/vnd.ms-excel',
                                         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                         'application/vnd.ms-powerpoint',
                                         'application/vnd.openxmlformats-officedocument.presentationml.presentation') THEN 'document'
                    ELSE 'file'
                  END as file_category
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
            originalName: file.original_name,
            mimeType: file.mime_type,
            fileSize: file.file_size,
            fileCategory: file.file_category,
            uploadedBy: file.uploaded_by,
            uploaderName: file.uploader_name,
            uploadedAt: file.uploaded_at,
            description: file.description,
            isPublic: file.is_public,
            path: file.path
          }
        });

      } catch (err) {
        logger.error('Error getting file info:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });

    // Enhanced file upload endpoint (you might want to add this)
    router.post('/upload', authMiddleware, async (req, res) => {
      try {
        const userId = req.user.userId;
        
        // Check if file was uploaded
        if (!req.files || Object.keys(req.files).length === 0) {
          return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const file = req.files.file; // assuming single file upload with key 'file'
        const { description, isPublic = false, fileType } = req.body;

        // Validate file type
        if (!fileType || !allowedMediaTypes.includes(fileType)) {
          return res.status(400).json({ 
            success: false, 
            error: `Invalid file type. Allowed types: ${allowedMediaTypes.join(', ')}` 
          });
        }

        // Validate filename
        if (!validateFilename(file.name)) {
          return res.status(400).json({ success: false, error: 'Invalid filename' });
        }

        // Get MIME type
        const mimeType = getMimeType(file.name);
        
        // Generate unique filename to prevent conflicts
        const timestamp = Date.now();
        const uniqueFilename = `${timestamp}_${file.name}`;
        
        // Create upload directory if it doesn't exist
        const uploadDir = path.join(__dirname, '../uploads/media', fileType);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, uniqueFilename);

        // Move file to upload directory
        await file.mv(filePath);

        // Save file info to database
        const fileResult = await pool.query(
          `INSERT INTO files (filename, original_name, mime_type, file_size, path, uploaded_by, description, is_public, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
           RETURNING *`,
          [uniqueFilename, file.name, mimeType, file.size, filePath, userId, description || null, isPublic]
        );

        const savedFile = fileResult.rows[0];

        res.status(201).json({
          success: true,
          message: 'File uploaded successfully',
          file: {
            id: savedFile.id,
            filename: savedFile.filename,
            originalName: savedFile.original_name,
            mimeType: savedFile.mime_type,
            fileSize: savedFile.file_size,
            fileType: fileType,
            description: savedFile.description,
            isPublic: savedFile.is_public,
            uploadedAt: savedFile.created_at
          }
        });

      } catch (err) {
        logger.error('Error uploading file:', err);
        res.status(500).json({ success: false, error: 'Server error during file upload' });
      }
    });

    // Delete file (only by uploader) - Enhanced with more checks
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
          return res.status(404).json({
            success: false,
            message: 'File not found or you do not have permission to access it'
          })
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
// // File: server/routes/files.js
// const express = require('express');
// const path = require('path');
// const fs = require('fs');
// const authMiddleware = require('../middleware/authMiddleware');
// const { logger } = require('../middleware/errorHandler');

// module.exports = function(pool) {
//     const router = express.Router();

//     // Serve profile pictures (public access)
//     router.get('/profiles/:filename', async (req, res) => {
//       try {
//         const { filename } = req.params;
//         const filePath = path.join(__dirname, '../uploads/profiles', filename);
        
//         // Check if file exists
//         if (!fs.existsSync(filePath)) {
//           return res.status(404).json({ success: false, error: 'File not found' });
//         }

//         // Verify file exists in database and is public
//         const fileResult = await pool.query(
//           'SELECT * FROM files WHERE filename = $1 AND is_public = true',
//           [filename]
//         );

//         if (fileResult.rows.length === 0) {
//           return res.status(404).json({ success: false, error: 'File not found' });
//         }

//         const file = fileResult.rows[0];
        
//         // Set appropriate headers
//         res.set({
//           'Content-Type': file.mime_type,
//           'Content-Length': file.file_size,
//           'Cache-Control': 'public, max-age=86400' // Cache for 1 day
//         });

//         // Stream the file
//         const fileStream = fs.createReadStream(filePath);
//         fileStream.pipe(res);

//       } catch (err) {
//         logger.error('Error serving profile picture:', err);
//         res.status(500).json({ success: false, error: 'Server error' });
//       }
//     });

//     // Serve media files (authenticated access)
//     router.get('/media/:type/:filename', authMiddleware, async (req, res) => {
//       try {
//         const { type, filename } = req.params;
//         const userId = req.user.userId;
        
//         // Validate type
//         const allowedTypes = ['images', 'videos', 'audio', 'documents'];
//         if (!allowedTypes.includes(type)) {
//           return res.status(400).json({ success: false, error: 'Invalid file type' });
//         }

//         const filePath = path.join(__dirname, '../uploads/media', type, filename);
        
//         // Check if file exists
//         if (!fs.existsSync(filePath)) {
//           return res.status(404).json({ success: false, error: 'File not found' });
//         }

//         // Verify file exists in database
//         const fileResult = await pool.query(
//           'SELECT * FROM files WHERE filename = $1',
//           [filename]
//         );

//         if (fileResult.rows.length === 0) {
//           return res.status(404).json({ success: false, error: 'File not found' });
//         }

//         const file = fileResult.rows[0];

//         // Check if user has access to this file (either uploaded by user or in a shared chat)
//         const accessCheck = await pool.query(`
//           SELECT 1 FROM (
//             SELECT 1 WHERE $1 = $2
//             UNION
//             SELECT 1 FROM messages m
//             JOIN chat_members cm ON m.chat_id = cm.chat_id
//             WHERE m.media_file_id = $3 AND cm.user_id = $1
//           ) as access_check
//         `, [userId, file.uploaded_by, file.id]);

//         if (accessCheck.rows.length === 0) {
//           return res.status(403).json({ success: false, error: 'Access denied' });
//         }

//         // Set appropriate headers
//         res.set({
//           'Content-Type': file.mime_type,
//           'Content-Length': file.file_size,
//           'Cache-Control': 'private, max-age=3600' // Cache for 1 hour
//         });

//         // Stream the file
//         const fileStream = fs.createReadStream(filePath);
//         fileStream.pipe(res);

//       } catch (err) {
//         logger.error('Error serving media file:', err);
//         res.status(500).json({ success: false, error: 'Server error' });
//       }
//     });

//     // Get file info (authenticated)  
//     router.get('/info/:fileId', authMiddleware, async (req, res) => {
//       try {
//         const { fileId } = req.params;
//         const userId = req.user.userId;

//         const fileResult = await pool.query(
//           `SELECT f.*, u.full_name as uploader_name
//            FROM files f
//            JOIN users u ON f.uploaded_by = u.id
//            WHERE f.id = $1`,
//           [fileId]
//         );

//         if (fileResult.rows.length === 0) {
//           return res.status(404).json({ success: false, error: 'File not found' });
//         }

//         const file = fileResult.rows[0];

//         // Check if user has access to this file
//         const accessCheck = await pool.query(`
//           SELECT 1 FROM (
//             SELECT 1 WHERE $1 = $2
//             UNION
//             SELECT 1 FROM messages m
//             JOIN chat_members cm ON m.chat_id = cm.chat_id
//             WHERE m.media_file_id = $3 AND cm.user_id = $1
//           ) as access_check
//         `, [userId, file.uploaded_by, file.id]);

//         if (accessCheck.rows.length === 0) {
//           return res.status(403).json({ success: false, error: 'Access denied' });
//         }

//         res.json({
//           success: true,
//           file: {
//             id: file.id,
//             filename: file.filename,
//             mimeType: file.mime_type,
//             fileSize: file.file_size,
//             uploadedBy: file.uploaded_by,
//             uploaderName: file.uploader_name,
//             uploadedAt: file.uploaded_at,
//             description: file.description
//           }
//         });

//       } catch (err) {
//         logger.error('Error getting file info:', err);
//         res.status(500).json({ success: false, error: 'Server error' });
//       }
//     });

//     // Delete file (only by uploader)
//     router.delete('/:fileId', authMiddleware, async (req, res) => {
//       try {
//         const { fileId } = req.params;
//         const userId = req.user.userId;

//         // Get file info and verify ownership
//         const fileResult = await pool.query(
//           'SELECT * FROM files WHERE id = $1 AND uploaded_by = $2',
//           [fileId, userId]
//         );

//         if (fileResult.rows.length === 0) {
//           return res.status(404).json({
//             success: false,
//             message: 'File not found or you do not have permission to access it'
//           })
//         }

//         const file = fileResult.rows[0];

//         // Check if file is being used as profile picture
//         const profileCheck = await pool.query(
//           'SELECT 1 FROM users WHERE profile_picture_id = $1',
//           [fileId]
//         );

//         if (profileCheck.rows.length > 0) {
//           return res.status(400).json({ 
//             success: false, 
//             error: 'Cannot delete file: currently used as profile picture' 
//           });
//         }

//         // Check if file is being used in messages
//         const messageCheck = await pool.query(
//           'SELECT 1 FROM messages WHERE media_file_id = $1',
//           [fileId]
//         );

//         if (messageCheck.rows.length > 0) {
//           return res.status(400).json({ 
//             success: false, 
//             error: 'Cannot delete file: currently used in messages' 
//           });
//         }

//         // Delete physical file
//         if (fs.existsSync(file.path)) {
//           fs.unlinkSync(file.path);
//         }

//         // Delete from database
//         await pool.query('DELETE FROM files WHERE id = $1', [fileId]);

//         res.json({
//           success: true,
//           message: 'File deleted successfully'
//         });

//       } catch (err) {
//         logger.error('Error deleting file:', err);
//         res.status(500).json({ success: false, error: 'Server error' });
//       }
//     });

//     return router;
// };