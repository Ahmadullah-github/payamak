// File: server/routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db'); // Import the database connection pool

const router = express.Router();

// --- User Registration Endpoint ---
// Endpoint: POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Validate input
    if (!username || !password || password.length < 6) {
      return res.status(400).json({ message: 'Invalid input. Password must be at least 6 characters.' });
    }

    // 2. Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Insert the new user into the database
    const newUser = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
      [username, passwordHash]
    );

    // 4. Send success response
    res.status(201).json({ 
        message: 'User registered successfully', 
        user: newUser.rows[0] 
    });

  } catch (err) {
    // Handle potential errors, like a duplicate username
    if (err.code === '23505') { // Unique violation error code
        return res.status(409).json({ message: 'Username already exists.' });
    }
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// --- User Login Endpoint ---
// Endpoint: POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Find user in the database
        const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'username is not valid' });
        }
        const user = userResult.rows[0];

        // 2. Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password is not correct!!' });
        }

        // 3. Create a JWT
        const payload = {
            userId: user.id,
            username: user.username,
        };
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // Token will be valid for 7 days
        );
        
        // 4. Send the token to the client
        res.json({ 
            message: 'Logged in successfully',
            token,
            user: { id: user.id, username: user.username }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;