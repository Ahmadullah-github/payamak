# Payamak Backend - WhatsApp-like Messaging API

A comprehensive Node.js backend for a WhatsApp-like messaging application with real-time communication, media sharing, and notification system.

## 🚀 Features

### Core Messaging
- ✅ Real-time messaging with Socket.IO
- ✅ Private and group chats
- ✅ Message delivery and read receipts
- ✅ Message status tracking (sent, delivered, read)
- ✅ Online/offline user presence

### Media & Files
- ✅ Profile picture upload and management
- ✅ Media message support (images, videos, audio, documents)
- ✅ File compression and optimization
- ✅ Secure file serving with access control
- ✅ File size and type validation

### Authentication & Security
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on API endpoints
- ✅ Input validation and sanitization
- ✅ Security headers with helmet
- ✅ Error handling and logging

### Notifications
- ✅ Real-time notifications for online users
- ✅ Offline notification storage
- ✅ Notification management API
- ✅ Push notification system ready

### Admin Features
- ✅ User management dashboard
- ✅ System statistics and monitoring
- ✅ Health check endpoints
- ✅ User activation/deactivation

## 🏗 Architecture

### Database Schema
- **PostgreSQL** with optimized indexes
- **Users** - User accounts and profiles
- **Chats** - Private and group conversations
- **Messages** - Text and media messages
- **Files** - Media file metadata
- **Notifications** - Offline notification system
- **Message Tracking** - Delivery and read receipts

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

#### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get specific user
- `PUT /api/users` - Update user profile
- `POST /api/users/profile-picture` - Upload profile picture
- `GET /api/users/me/profile` - Get current user profile

#### Messages & Chats
- `GET /api/messages/chats` - Get user's chats
- `GET /api/messages/chat/:chatId` - Get chat messages
- `POST /api/messages` - Send text message
- `POST /api/messages/media` - Send media message
- `POST /api/messages/chats` - Create new chat
- `PATCH /api/messages/:messageId/status` - Update message status

#### Files
- `GET /api/files/profiles/:filename` - Serve profile pictures
- `GET /api/files/media/:type/:filename` - Serve media files
- `GET /api/files/info/:fileId` - Get file information
- `DELETE /api/files/:fileId` - Delete file

#### Notifications
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread` - Get unread notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

#### Admin
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - Manage users
- `GET /api/admin/messages` - View messages
- `GET /api/admin/health` - System health check

### Socket.IO Events

#### Client → Server
- `send_message` - Send a message
- `join_chat_room` - Join chat room
- `leave_chat_room` - Leave chat room
- `mark_message_read` - Mark message as read

#### Server → Client
- `new_message` - Receive new message
- `message_sent` - Message send confirmation
- `message_status_update` - Message status update
- `user_online` - User came online
- `user_offline` - User went offline
- `notification` - Real-time notification

## 🛠 Installation & Setup

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### 1. Clone and Install
```bash
cd server
npm install
```

### 2. Environment Setup
Create `.env` file:
```env
DB_USER=payamak
DB_HOST=localhost
DB_DATABASE=payamak
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret_key
PORT=3000
NODE_ENV=development
```

### 3. Database Setup
```bash
# Connect to PostgreSQL and run the schema
psql -h localhost -U payamak -d payamak -f database/payamk-db\ schema.sql
psql -h localhost -U payamak -d payamak -f database/add-notifications.sql
```

### 4. Initialize Database (Optional)
```bash
npm run db:init
```

### 5. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📁 Project Structure

```
server/
├── database/           # Database schemas and migrations
├── logs/              # Application logs
├── middleware/        # Express middleware
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   ├── rateLimiter.js
│   ├── upload.js
│   └── validation.js
├── routes/            # API route handlers
│   ├── admin.js
│   ├── auth.js
│   ├── files.js
│   ├── messages.js
│   ├── notifications.js
│   └── users.js
├── scripts/           # Utility scripts
├── uploads/           # File uploads
│   ├── profiles/      # Profile pictures
│   └── media/         # Media files
├── utils/             # Utility functions
│   ├── dbUtils.js
│   ├── jwt.js
│   └── notifications.js
├── __tests__/         # Test files
├── server.js          # Main application file
├── socketHandler.js   # Socket.IO logic
└── db.js             # Database connection
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 🔧 Configuration

### File Upload Limits
- Profile pictures: 5MB max
- Media files: 100MB max
- Supported formats: Images (jpg, png, gif, webp), Videos (mp4, mov, avi), Audio (mp3, wav, ogg), Documents (pdf, doc, docx, txt)

### Rate Limiting
- General API: 100 requests/15min
- Authentication: 5 requests/15min
- Messages: 60 messages/minute
- File uploads: 10 uploads/15min

### Security Features
- Helmet.js security headers
- CORS configuration
- Input sanitization
- SQL injection prevention
- File type validation
- JWT token expiration

## 📊 Performance Optimization

### Database Optimizations
- Composite indexes on frequently queried columns
- Materialized views for chat lists
- Partial indexes for performance
- Connection pooling

### File Handling
- Image compression with Sharp
- Streaming file responses
- Efficient file storage structure
- Cache headers for static files

### Real-time Features
- Socket.IO with connection management
- Online user tracking
- Efficient message broadcasting
- Connection cleanup on disconnect

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **File Upload Issues**
   - Check upload directory permissions
   - Verify file size limits
   - Check available disk space

3. **Socket Connection Problems**
   - Check JWT token validity
   - Verify CORS settings
   - Check firewall settings

### Monitoring & Logs
- Application logs in `logs/` directory
- Error tracking with Winston
- Health check endpoint: `/api/admin/health`
- System stats: `/api/admin/stats`

## 🔮 Future Enhancements

- [ ] Message encryption
- [ ] Voice/video calling
- [ ] Message forwarding
- [ ] User blocking/reporting
- [ ] Message search
- [ ] Chat themes
- [ ] Message scheduling
- [ ] Advanced admin dashboard
- [ ] Analytics and metrics
- [ ] Multi-language support

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

**Note**: This is a development setup. For production deployment, ensure proper security configurations, environment variables, SSL certificates, and monitoring solutions.