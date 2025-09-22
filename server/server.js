// File: server/server.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const socketAuth = require('./middleware/socketAuthMiddleware'); 

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

io.use(socketAuth);


io.on('connection', (socket) => {
  console.log(`✅ user connected: ${socket.user.id} with socketId: ( socket id: ${socket.id} )`);


  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});


// --- Start the Server ---
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
  const allUsers = await pool.query(`select * from users`)
  console.log(`ALL userd from Db: `, allUsers.rows);
});