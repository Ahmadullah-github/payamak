// File: server/server.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const socketAuth = require('./middleware/socketAuthMiddleware'); 
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const messagesRoutes = require('./routes/messages');
const pool = require('./db');
const { initializeSocket } = require('./socketHandler');

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
app.use('/api/auth', authRoutes(pool));
app.use('/api/users', usersRoutes(pool));
app.use('/api/messages', messagesRoutes(pool));


io.use(socketAuth);
initializeSocket(io, pool);


// --- Start the Server ---
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
  });
}

module.exports = { app, server };