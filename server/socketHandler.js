// server/socketHandler.js

import db from './db.js'; // Assuming your db connection is exported from db.js

// This map will store online users.
// Key: userId, Value: socket.id
const onlineUsers = new Map();

export function initializeSocket(io) {
  // Your Socket.IO authentication middleware
  io.use((socket, next) => {
    // ... JWT verification logic ...
    // Attach userId to socket
    // socket.userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // --- Presence Logic ---
    onlineUsers.set(socket.userId, socket.id);
    socket.broadcast.emit('user_online', { userId: socket.userId });
    socket.emit('current_online_users', Array.from(onlineUsers.keys()));
    
    // --- Smart Delivery: Fetch Pending Messages ---
    (async () => {
      const pendingMessages = await db.getPendingMessages(socket.userId);
      // ... loop and send pending messages ...
    })();
    
    // --- Message Listener ---
    socket.on('private_message', async ({ to, content }) => {
      // ... logic to save message and forward if recipient is online ...
    });
    
    // --- Disconnect Logic ---
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
      onlineUsers.delete(socket.userId);
      socket.broadcast.emit('user_offline', { userId: socket.userId });
    });
  });
}