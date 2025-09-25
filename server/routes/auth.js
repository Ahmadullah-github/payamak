// File: server/routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { logger } = require('../middleware/errorHandler');

module.exports = function(pool) {
    const router = express.Router();

    // --- User Registration Endpoint ---
    router.post('/register', authLimiter, validateRegistration, async (req, res) => {
      try {
        const { username, password, fullName } = req.body; 

        // Check if user already exists
        const existingUser = await pool.query(
          "SELECT id FROM users WHERE username = $1",
          [username]
        );

        if (existingUser.rows.length > 0) {
          return res.status(400).json({ 
            success: false, 
            error: 'Username already exists' 
          });
        }

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUser = await pool.query(
          "INSERT INTO users (username, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, username, full_name",
          [username, passwordHash, fullName]
        );
        
        const user = newUser.rows[0];
        
        logger.info(`New user registered: ${username} (ID: ${user.id})`);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
              id: user.id,
              username: user.username,
              fullName: user.full_name
            }
        });

      } catch (err) {
        // Handle duplicate username error
        if (err.code === '23505' && err.constraint === 'users_username_key') {
          return res.status(400).json({ 
            success: false, 
            error: 'Username already exists' 
          });
        }
        
        logger.error('Registration error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });


    // --- User Login Endpoint ---
    router.post('/login', authLimiter, validateLogin, async (req, res) => {
        try {
            const { username, password } = req.body;

            const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
            if (userResult.rows.length === 0) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }
            const user = userResult.rows[0];

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }

            // Update user online status
            await pool.query(
              'UPDATE users SET is_online = true, last_seen = CURRENT_TIMESTAMP WHERE id = $1',
              [user.id]
            );

            const payload = {
                userId: user.id,
                username: user.username,
                fullName: user.full_name,
            };
            const token = jwt.sign(
                payload, 
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            logger.info(`User logged in: ${username} (ID: ${user.id})`);
            
            res.json({ 
                success: true,
                message: 'Logged in successfully',
                token,
                user: { 
                  id: user.id, 
                  username: user.username, 
                  fullName: user.full_name
                }
            });

        } catch (err) {
            logger.error('Login error:', err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });


    // --- Get User Profile Endpoint (Protected) ---
    router.get('/profile', authMiddleware, async (req, res) => {
      try {
        // The user ID is added to req.user by the authMiddleware
        const userId = req.user.userId;

        // Fetch the user's data from the database, excluding the password hash
        const userResult = await pool.query(
          `SELECT u.id, u.username, u.full_name, u.status, u.created_at,
                  f.filename as profile_picture_filename
           FROM users u
           LEFT JOIN files f ON u.profile_picture_id = f.id
           WHERE u.id = $1`,
          [userId]
        );

        if (userResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        const user = userResult.rows[0];
        // Send back the user profile, mapping to camelCase for consistency
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
        logger.error('Profile fetch error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
      }
    });


    return router;
};