// File: server/server.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const socketAuth = require('./middleware/socketAuthMiddleware'); 
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const messagesRoutes = require('./routes/messages');
const filesRoutes = require('./routes/files');
const notificationsRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, logger } = require('./middleware/errorHandler');
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
// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// Rate limiting
app.use(generalLimiter);

app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json({ limit: '10mb' })); // Allow the server to parse JSON request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// --- API Routes ---
// Use the authentication routes for any request to /api/auth
app.use('/api/auth', authRoutes(pool));
app.use('/api/users', usersRoutes(pool));
app.use('/api/messages', messagesRoutes(pool));
app.use('/api/files', filesRoutes(pool));
app.use('/api/notifications', notificationsRoutes(pool));
app.use('/api/admin', adminRoutes(pool));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Global error handler (must be last)
app.use(errorHandler);


io.use(socketAuth);
initializeSocket(io, pool);

// --- Start the Server ---
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
    logger.info(`Server started on port ${PORT}`);
    console.log(`pool request from daatabse ${(await pool.query('SELECT NOW()')).fields}`);
    // Test database connection
    try {
      await pool.query('SELECT NOW()');
      console.log('✅ Database connected successfully');
      logger.info('Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      logger.error('Database connection failed:', error);
    }
  });
}

module.exports = { app, server };