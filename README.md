# Hangoutz Backend API

Complete backend for the Hangoutz social events platform built with Node.js, Express, MongoDB, and Socket.IO.

## 🚀 Features

- **Authentication**
  - Phone number + OTP authentication
  - JWT token-based sessions
  - Secure OTP generation and verification
  - Optional Twilio SMS integration

- **User Management**
  - Profile creation and updates
  - Photo uploads
  - User verification system
  - Trust score calculation
  - Block/unblock users
  - Privacy settings

- **Events**
  - Create, read, update, delete events
  - Join/leave events
  - Geo-spatial search
  - Category filtering
  - Event status tracking
  - Participant management

- **Real-time Chat**
  - Direct messaging
  - Socket.IO for real-time updates
  - Typing indicators
  - Read receipts
  - Message moderation

- **AI Features**
  - Content moderation
  - AI chatbot for city information
  - Trust score calculation

- **File Uploads**
  - Image upload support
  - Multer integration
  - Cloud storage ready (S3/Cloudinary)

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm or yarn

## 🛠️ Installation

1. **Clone and navigate to backend**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/hangoutz
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CLIENT_URL=http://localhost:5173
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone": "+919876543210"
}
```

Response:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456"  // Only in development
}
```

#### Verify OTP & Login
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "phone": "+919876543210",
    "name": "John Doe",
    "verified": false,
    "trustScore": 50
  },
  "needsProfileCompletion": false
}
```

#### Complete Profile
```http
POST /api/auth/complete-profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "dob": "1990-01-01",
  "gender": "Male",
  "bio": "Love exploring new places!",
  "interests": ["🎵 Music", "🍔 Food"],
  "photos": ["https://..."],
  "verificationPhotoURL": "https://..."
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Events Endpoints

#### Get All Events
```http
GET /api/events?category=🎵 Music&status=upcoming&limit=20&page=1
```

Query Parameters:
- `category` - Filter by event category
- `status` - upcoming, ongoing, completed, cancelled
- `search` - Search in title, description, location
- `lat`, `lng` - Geo-spatial search coordinates
- `maxDistance` - Max distance in meters (default: 50000)
- `limit` - Results per page (default: 20)
- `page` - Page number (default: 1)
- `sortBy` - Sort field (default: -createdAt)

#### Create Event
```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Music Fest 2025",
  "description": "Amazing music festival...",
  "location": "Marine Drive, Raipur",
  "dateTime": "2025-03-15T18:00:00Z",
  "category": "🎵 Music",
  "coordinates": {
    "lat": 21.2362,
    "lng": 81.6350
  },
  "maxParticipants": 100,
  "tags": ["music", "festival"]
}
```

#### Join Event
```http
POST /api/events/:eventId/join
Authorization: Bearer <token>
```

#### Leave Event
```http
POST /api/events/:eventId/leave
Authorization: Bearer <token>
```

### User Endpoints

#### Get User Profile
```http
GET /api/users/:userId
```

#### Update Profile
```http
PUT /api/users/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Name",
  "bio": "Updated bio",
  "interests": ["🎵 Music"],
  "photos": ["https://..."]
}
```

#### Submit Verification
```http
POST /api/users/:userId/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "verificationPhotoURL": "https://..."
}
```

#### Block User
```http
POST /api/users/:userId/block/:targetUserId
Authorization: Bearer <token>
```

### Messaging Endpoints

#### Get Messages
```http
GET /api/messages/:conversationId?limit=50
Authorization: Bearer <token>
```

#### Send Message
```http
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "channelId": "conversation_id",
  "message": "Hello!",
  "type": "text"
}
```

### Conversation Endpoints

#### Get Conversations
```http
GET /api/conversations
Authorization: Bearer <token>
```

#### Create/Get Conversation
```http
POST /api/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "otherUserId": "user_id",
  "type": "direct"
}
```

### File Upload Endpoints

#### Upload Single Image
```http
POST /api/upload/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: <file>
```

#### Upload Multiple Images
```http
POST /api/upload/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

images: <file1>, <file2>, ...
```

### AI Endpoints

#### Moderate Text
```http
POST /api/ai/moderate
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Content to moderate"
}
```

#### AI Chat
```http
POST /api/ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What events are happening?",
  "history": []
}
```

## 🔌 Socket.IO Events

### Client → Server

- `typing:start` - User started typing
  ```javascript
  socket.emit('typing:start', { conversationId: 'conv_id' });
  ```

- `typing:stop` - User stopped typing
  ```javascript
  socket.emit('typing:stop', { conversationId: 'conv_id' });
  ```

- `conversation:join` - Join conversation room
  ```javascript
  socket.emit('conversation:join', { conversationId: 'conv_id' });
  ```

- `conversation:leave` - Leave conversation room
  ```javascript
  socket.emit('conversation:leave', { conversationId: 'conv_id' });
  ```

### Server → Client

- `message:new` - New message received
  ```javascript
  socket.on('message:new', (data) => {
    console.log('New message:', data.message);
  });
  ```

- `user:typing` - User is typing
  ```javascript
  socket.on('user:typing', (data) => {
    console.log(`${data.userName} is typing...`);
  });
  ```

- `event:newParticipant` - New participant joined event
  ```javascript
  socket.on('event:newParticipant', (data) => {
    console.log('New participant:', data.participant);
  });
  ```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Token Flow
1. Send OTP to phone number
2. Verify OTP to get JWT token
3. Use token for all authenticated requests
4. Token expires in 30 days (configurable)

## 🗄️ Database Models

### User
- Phone number (unique)
- Name, DOB, Gender
- Bio, Interests
- Photos, Verification
- Trust Score
- Privacy Settings
- Blocked Users

### Event
- Title, Description, Location
- Date/Time, Category
- Host Information
- Participants
- Coordinates (geo-spatial)
- Status, Max Participants

### Message
- Channel ID (Conversation)
- Sender Information
- Message Content
- Type (text/image/system)
- Read Status
- Moderation Flags

### Conversation
- Participants
- Last Message
- Unread Counts
- Type (direct/group)

## 🧪 Testing

### Test Users (After Seeding)
```
Rahul Verma: +919876543210
Priya Sharma: +919876543211
Amit Patel: +919876543212
```

In development, any 6-digit OTP will work.

### Using cURL
```bash
# Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}'

# Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","otp":"123456"}'

# Get Events
curl http://localhost:5000/api/events
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hangoutz
JWT_SECRET=your-production-secret-key
CLIENT_URL=https://yourdomain.com
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

### Deployment Platforms
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **Render**: Connect GitHub repo
- **DigitalOcean**: Docker deployment
- **AWS EC2**: PM2 process manager

### Production Checklist
- [ ] Set strong JWT_SECRET
- [ ] Configure MongoDB Atlas
- [ ] Set up Twilio for SMS
- [ ] Configure cloud storage (S3/Cloudinary)
- [ ] Enable rate limiting
- [ ] Set up logging (Winston/Morgan)
- [ ] Configure monitoring (New Relic/DataDog)
- [ ] Set up SSL/HTTPS
- [ ] Enable CORS for frontend domain
- [ ] Set up backup strategy

## 📦 Project Structure

```
backend/
├── config/
│   └── db.js              # Database connection
├── middleware/
│   ├── auth.js            # JWT authentication
│   └── errorHandler.js    # Error handling
├── models/
│   ├── User.js            # User model
│   ├── Event.js           # Event model
│   ├── Message.js         # Message model
│   └── Conversation.js    # Conversation model
├── routes/
│   ├── auth.js            # Auth routes
│   ├── users.js           # User routes
│   ├── events.js          # Event routes
│   ├── messages.js        # Message routes
│   ├── conversations.js   # Conversation routes
│   ├── ai.js              # AI routes
│   └── upload.js          # Upload routes
├── services/
│   ├── otp.js             # OTP generation/verification
│   └── ai.js              # AI moderation & chat
├── socket/
│   └── handlers.js        # Socket.IO handlers
├── scripts/
│   └── seed.js            # Database seeding
├── .env.example           # Environment variables template
├── package.json           # Dependencies
└── server.js              # Entry point
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🆘 Support

For issues or questions:
- Check existing GitHub issues
- Create new issue with detailed description
- Include error logs and steps to reproduce

## 🔄 Version History

- **1.0.0** - Initial release with core features
  - Authentication with OTP
  - Event management
  - Real-time messaging
  - File uploads
  - AI moderation

---

Built with ❤️ for the Hangoutz community
