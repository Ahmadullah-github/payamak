# Payamak Backend API Guide for Frontend Developers

## 📋 Overview

This document provides a comprehensive guide to the Payamak backend API for frontend developers. The backend is a fully-featured, production-ready WhatsApp-like messaging system with real-time communication, media sharing, and notification capabilities.

## 🚀 Key Features

### Core Messaging
- Real-time messaging with Socket.IO
- Private and group chats
- Message delivery and read receipts
- Online/offline user presence
- Typing indicators

### Media & Files
- Profile picture upload and management
- Media message support (images, videos, audio, documents)
- File compression and optimization
- Secure file serving with access control

### Authentication & Security
- JWT-based authentication with 7-day expiration
- Password hashing with bcrypt
- Rate limiting on all endpoints
- Input validation and sanitization
- Security headers with helmet

### Notifications
- Real-time notifications for online users
- Offline notification storage
- Notification management API

## 🏗 Architecture

### Technology Stack
- **Node.js** with Express.js framework
- **PostgreSQL** database with optimized schema
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Multer** and **Sharp** for file handling

### Database Schema
The database includes tables for:
- Users (with profile pictures)
- Chats (private and group)
- Messages (text and media)
- Files (media storage metadata)
- Notifications (offline storage)
- Message tracking (delivery/read receipts)

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
GET  /api/auth/profile      # Get authenticated user profile
```

### Users
```
GET    /api/users              # Get all users (with search)
GET    /api/users/:id          # Get specific user info
PUT    /api/users/profile      # Update user profile
PUT    /api/users/password     # Change password
POST   /api/users/profile-picture  # Upload profile picture
DELETE /api/users/profile-picture  # Delete profile picture
GET    /api/users/me/profile   # Get current user's full profile
```

### Messages & Chats
```
GET  /api/messages/chats              # Get user's chats
GET  /api/messages/chat/:chatId       # Get chat messages
POST /api/messages                    # Send text message
POST /api/messages/media              # Send media message
POST /api/messages/chats              # Create new chat
PATCH /api/messages/:messageId/status # Update message status
POST /api/messages/chats/:chatId/read # Mark all messages as read
```

### Files
```
GET  /api/files/profiles/:filename     # Serve profile pictures
GET  /api/files/media/:type/:filename  # Serve media files
GET  /api/files/info/:fileId           # Get file information
DELETE /api/files/:fileId              # Delete file
```

### Notifications
```
GET    /api/notifications           # Get all notifications
GET    /api/notifications/unread    # Get unread notifications
PATCH  /api/notifications/:id/read   # Mark as read
PATCH  /api/notifications/read-all   # Mark all as read
DELETE /api/notifications/:id        # Delete notification
```

### Admin (Requires admin privileges)
```
GET  /api/admin/stats      # System statistics
GET  /api/admin/users      # Manage users
GET  /api/admin/messages   # View messages
GET  /api/admin/health     # System health check
```

## 🔄 Socket.IO Events

### Client → Server
```
send_message        # Send a message
join_chat_room      # Join chat room
leave_chat_room     # Leave chat room
mark_message_read   # Mark message as read
typing_start        # User started typing
typing_stop         # User stopped typing
```

### Server → Client
```
new_message              # Receive new message
message_sent             # Message send confirmation
message_status_update    # Message status update
user_online              # User came online
user_offline             # User went offline
notification             # Real-time notification
user_typing              # User is typing
user_stopped_typing      # User stopped typing
```

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

To obtain a token:
1. Register a new user: `POST /api/auth/register`
2. Login: `POST /api/auth/login`
3. Use the returned token in subsequent requests

## 📁 File Handling

### Upload Limits
- Profile pictures: 5MB max
- Media files: 100MB max
- Supported formats:
  - Images: jpg, png, gif, webp
  - Videos: mp4, mov, avi
  - Audio: mp3, wav, ogg
  - Documents: pdf, doc, docx, txt

### File URLs
- Profile pictures: `/api/files/profiles/:filename`
- Media files: `/api/files/media/:type/:filename`

## 🛡 Rate Limiting

- General API: 100 requests/15min
- Authentication: 5 requests/15min
- Messages: 60 messages/minute
- File uploads: 10 uploads/15min

## 📱 Real-time Features Implementation Guide

### Connecting to Socket.IO
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Listening for Events
```javascript
// New message
socket.on('new_message', (message) => {
  // Handle new message
});

// User status changes
socket.on('user_online', (data) => {
  // Handle user coming online
});

socket.on('user_offline', (data) => {
  // Handle user going offline
});

// Notifications
socket.on('notification', (notification) => {
  // Handle notification
});
```

### Sending Events
```javascript
// Send a message
socket.emit('send_message', {
  chatId: '123',
  content: 'Hello world',
  type: 'text'
});

// Join a chat room
socket.emit('join_chat_room', {
  chatId: '123'
});
```

## 📊 Performance Optimizations

### Database
- Composite indexes on frequently queried columns
- Materialized views for chat lists
- Connection pooling
- Optimized queries with proper JOINs

### File Handling
- Image compression with Sharp
- Streaming file responses
- Efficient file storage structure
- Cache headers for static files

### Real-time Features
- Efficient Socket.IO event handling
- Online user tracking with Map data structure
- Connection cleanup on disconnect

## 🐛 Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 400: Bad request (validation errors)
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 429: Too many requests (rate limiting)
- 500: Internal server error

Error responses follow this format:
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🧪 Testing

The backend includes comprehensive tests:
```bash
npm test          # Run all tests
npm run test:coverage  # Run tests with coverage report
```

## 📈 Monitoring

- Application logs in `logs/` directory
- Health check endpoint: `/api/admin/health`
- System stats: `/api/admin/stats`

## 🎯 Best Practices for Frontend Integration

1. **Authentication Flow**
   - Store JWT token securely (HttpOnly cookie or secure storage)
   - Handle token expiration gracefully
   - Implement automatic token refresh if needed

2. **Real-time Updates**
   - Connect to Socket.IO on app initialization
   - Reconnect on connection loss
   - Handle presence updates properly

3. **File Uploads**
   - Show upload progress to users
   - Handle file validation errors
   - Implement retry mechanisms for failed uploads

4. **Error Handling**
   - Implement global error handling
   - Show user-friendly error messages
   - Log errors for debugging

5. **Performance**
   - Implement pagination for lists
   - Cache frequently accessed data
   - Use efficient rendering techniques

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see .env.example)
4. Initialize database: `npm run db:init`
5. Start development server: `npm run dev`

The server will start on `http://localhost:3000`

## 📄 License

This project is licensed under the MIT License.