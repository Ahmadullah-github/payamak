// File: server/routes/users.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

module.exports = function(pool) {
    const router = express.Router();

    // Get all users (for chat list)
    router.get('/', authMiddleware, async (req, res) => {
      try {
        const currentUserId = req.user.userId;
        
        // Get all users except the current user
        const usersResult = await pool.query(
          "SELECT id, username, full_name FROM users WHERE id != $1 ORDER BY full_name",
          [currentUserId]
        );
        
        const users = usersResult.rows.map(user => ({
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          avatarUrl: `https://i.pravatar.cc/150?u=${user.id}`,
          // In a real app, you'd have online status tracking
          isOnline: false
        }));
        
        res.json(users);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
    });

    // Get specific user info
    router.get('/:id', authMiddleware, async (req, res) => {
      try {
        const userId = req.params.id;
        
        const userResult = await pool.query(
          "SELECT id, username, full_name FROM users WHERE id = $1",
          [userId]
        );
        
        if (userResult.rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        const user = userResult.rows[0];
        res.json({
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          avatarUrl: `https://i.pravatar.cc/150?u=${user.id}`,
          isOnline: false // This would be determined by socket connection status
        });
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
    });

    // Update user profile
    router.put('/', authMiddleware, async (req, res) => {
      try {
        const { fullName } = req.body;
        const currentUserId = req.user.userId;

        if (!fullName || fullName.trim() === '') {
          return res.status(400).json({ message: 'Full name cannot be empty' });
        }

        const updateResult = await pool.query(
          "UPDATE users SET full_name = $1 WHERE id = $2 RETURNING id, username, full_name",
          [fullName, currentUserId]
        );

        if (updateResult.rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        const updatedUser = {
          id: updateResult.rows[0].id,
          username: updateResult.rows[0].username,
          fullName: updateResult.rows[0].full_name,
        };

        res.json(updatedUser);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
    });

    return router;
};