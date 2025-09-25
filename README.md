# Payamak Chat App - Direct Messaging Feature

## Overview

This is a real-time messaging application built with React Native (Expo) and Node.js with Socket.IO for real-time communication. This is com

## Features

### ✅ Implemented Features

1. **Real-time Direct Messaging**
   - Send and receive messages instantly
   - Message status indicators (sent, delivered, read)
   - Persian/Farsi text support
   - Auto-scroll to new messages

2. **User Authentication**
   - JWT-based authentication
   - Secure token storage
   - Auto-login functionality

3. **Online Status Tracking**
   - Real-time online/offline status
   - Socket.IO presence management

4. **Message Persistence**
   - Messages saved to PostgreSQL database
   - Chat history retrieval
   - Message status updates

5. **Modern UI/UX**
   - WhatsApp-like interface
   - NativeWind (Tailwind CSS) styling
   - Persian/RTL text support
   - Responsive design

## File Structure

### Client (React Native)
```
client/
├── app/
│   ├── (app)/
│   │   ├── chat/[id].tsx       # Chat screen for direct messaging
│   │   ├── index.tsx           # Chat list screen
│   │   └── groups.tsx          # Groups screen (placeholder)
│   └── _layout.tsx             # Root layout with auth guard
├── components/
│   └── ChatItem.tsx            # Chat list item component
├── store/
│   ├── authStore.ts            # Authentication state management
│   ├── socketStore.ts          # Socket.IO state management
│   └── messageStore.ts         # Message state management
└── constants/
    └── colors.ts               # App color scheme
```

### Server (Node.js)
```
server/
├── routes/
│   ├── auth.js                 # Authentication endpoints
│   ├── users.js                # User management endpoints
│   └── messages.js             # Message CRUD endpoints
├── middleware/
│   ├── authMiddleware.js       # JWT verification middleware
│   └── socketAuthMiddleware.js # Socket.IO auth middleware
├── database/
│   └── init.sql                # Database schema
├── socketHandler.js            # Socket.IO event handlers
└── server.js                   # Main server file
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id),
    receiver_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Users
- `GET /api/users` - Get all users except current user
- `GET /api/users/:id` - Get specific user info

### Messages
- `GET /api/messages/chat/:userId` - Get chat messages between users
- `POST /api/messages` - Save new message
- `PATCH /api/messages/:messageId/status` - Update message status

## Socket.IO Events

### Client to Server
- `send_message` - Send a new message
- `join_chat_room` - Join a chat room
- `mark_message_read` - Mark message as read

### Server to Client
- `new_message` - Receive new message
- `message_status_update` - Message status changed
- `user_online` - User came online
- `user_offline` - User went offline
- `current_online_users` - List of online users

## Setup Instructions

### 1. Database Setup
Run the SQL commands in `server/database/init.sql` to create the necessary tables:

```bash
psql -d your_database -f server/database/init.sql
```

### 2. Install Dependencies

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

### 3. Environment Configuration

Create `.env` file in server directory:
```env
JWT_SECRET=your_jwt_secret_here
DB_USER=your_db_user
DB_HOST=localhost
DB_DATABASE=payamak_db
DB_PASSWORD=your_db_password
DB_PORT=5432
PORT=3000
```

### 4. Update Network Configuration

Update `client/config.js` with your server IP:
```javascript
const SERVER_IP = '192.168.1.100'; // Your actual server IP
```

### 5. Start the Application

**Server:**
```bash
cd server
npm start
```

**Client:**
```bash
cd client
npx expo start
```

## How to Use the Chat Feature

### 1. Access Chat Screen
- Tap on any chat item in the main chat list
- This will navigate to `/chat/[userId]` route
- The chat screen will load with the selected user's information

### 2. Send Messages
- Type your message in the input field at the bottom
- Press the send button (blue circle with arrow)
- Message will appear immediately with "sent" status
- Status will update to "delivered" when received
- Status will update to "read" when the recipient opens the chat

### 3. Real-time Features
- Messages appear instantly when received
- Online/offline status is shown in the header
- Auto-scroll to latest messages
- Persian/Farsi text support with RTL layout

### 4. Message Status Indicators
- ✓ Single checkmark: Sent
- ✓✓ Double checkmark (gray): Delivered
- ✓✓ Double checkmark (blue): Read

## State Management

### Message Store (Zustand)
- Manages local message cache
- Organized by chat ID
- Handles status updates
- Provides helper functions

### Socket Store (Zustand)
- Manages Socket.IO connection
- Tracks online users
- Provides messaging functions
- Handles reconnection

### Auth Store (Zustand)
- User authentication state
- JWT token management
- Auto-login functionality
- Logout handling

## Technical Highlights

1. **Real-time Communication**: Socket.IO for instant messaging
2. **State Management**: Zustand for lightweight, type-safe state
3. **Modern React**: Hooks, TypeScript, functional components
4. **Responsive Design**: NativeWind for consistent styling
5. **Database Integration**: PostgreSQL with connection pooling
6. **Security**: JWT authentication, input validation
7. **Performance**: Message caching, efficient re-renders

## Future Enhancements

- [ ] Group messaging
- [ ] File/image sharing
- [ ] Push notifications
- [ ] Message reactions
- [ ] Message search
- [ ] User profiles
- [ ] Voice messages
- [ ] Video call

## Troubleshooting

### Common Issues

1. **Socket connection fails**
   - Check server IP in `config.js`
   - Ensure server is running
   - Check firewall settings

2. **Messages not appearing**
   - Verify database connection
   - Check console logs for errors
   - Ensure proper authentication

3. **Styling issues**
   - Make sure NativeWind is properly configured
   - Check `metro.config.js` setup
   - Verify Tailwind classes are valid

4. **Database errors**
   - Verify PostgreSQL is running
   - Check database credentials
   - Run database migration script