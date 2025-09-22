// File: server/routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware'); // <-- ADD THIS LINE

const router = express.Router();

// --- User Registration Endpoint ---
router.post('/register', async (req, res) => {
  try {
    // Note: your client sends 'fullName', but your code here used 'fullname'. Let's standardize on fullName.
    const { username, password, fullName } = req.body; 

    if (!username || !password || !fullName || password.length < 6) {
      return res.status(400).json({ message: 'All fields are required. Password must be at least 6 characters.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      "INSERT INTO users (username, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, username, full_name",
      [username, passwordHash, fullName]
    );
    
    const user = newUser.rows[0];
    res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name // Map database snake_case to API camelCase
        }
    });

  } catch (err) {
    if (err.code === '23505') {
        return res.status(409).json({ message: 'Username already exists.' });
    }
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// --- User Login Endpoint ---
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

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
        
        res.json({ 
            message: 'Logged in successfully',
            token,
            user: { 
              id: user.id, 
              username: user.username, 
              fullName: user.full_name // Map database snake_case to API camelCase
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// --- Get User Profile Endpoint (Protected) ---
// THIS IS THE NEW ROUTE YOU NEED TO ADD
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // The user ID is added to req.user by the authMiddleware
    const userId = req.user.userId;

    // Fetch the user's data from the database, excluding the password hash
    const userResult = await pool.query(
      "SELECT id, username, full_name FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    // Send back the user profile, mapping to camelCase for consistency
    res.json({
      id: user.id,
      username: user.username,
      fullName: user.full_name
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


module.exports = router;