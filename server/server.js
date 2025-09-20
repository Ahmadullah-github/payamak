// File: server/server.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const pool = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For development, allow all origins.
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allow the server to parse JSON request bodies

// --- API Routes ---
// Use the authentication routes for any request to /api/auth
app.use('/api/auth', authRoutes);

// Simple test route
app.get('/', (req, res) => {
  res.send('<h1>Chat Server is running</h1>');
});

// --- Socket.IO Connection Logic (we will build this next) ---
io.on('connection', (socket) => {
  console.log('✅ A user connected');
  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});


// --- Start the Server ---
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});