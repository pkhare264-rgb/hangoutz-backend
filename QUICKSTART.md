# Hangoutz Backend - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Setup Environment
```bash
cp .env.example .env
```

Edit `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/hangoutz
JWT_SECRET=change-this-to-a-random-secret-key
```

### Step 3: Start MongoDB

**Option A - Local MongoDB:**
```bash
mongod
```

**Option B - Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option C - MongoDB Atlas (Cloud):**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update MONGODB_URI in .env

### Step 4: Seed Database (Optional)
```bash
npm run seed
```

This creates 3 test users and 6 sample events.

### Step 5: Start Server
```bash
npm run dev
```

Server will start at http://localhost:5000

### Step 6: Test API
```bash
# Health check
curl http://localhost:5000/health

# Get events
curl http://localhost:5000/api/events

# Send OTP (development - any 6 digits work)
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}'
```

## 📱 Connecting Frontend

Update your frontend API URL to:
```javascript
const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';
```

## 🧪 Test Accounts (After Seeding)

| Name | Phone | Description |
|------|-------|-------------|
| Rahul Verma | +919876543210 | Music enthusiast |
| Priya Sharma | +919876543211 | Yoga instructor |
| Amit Patel | +919876543212 | Tech founder |

**OTP in Development:** Any 6 digits (e.g., 123456)

## 🔧 Common Issues

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running:
```bash
mongod
# or
docker ps | grep mongodb
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Kill process on port 5000:
```bash
# Mac/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### JWT Secret Missing
```
Error: JWT_SECRET is not defined
```
**Solution:** Add JWT_SECRET to .env file:
```env
JWT_SECRET=my-super-secret-key-123
```

## 📚 Next Steps

1. **Enable SMS OTP** - Add Twilio credentials to .env
2. **Cloud Storage** - Configure S3 or Cloudinary for file uploads
3. **Production Deploy** - Deploy to Heroku, Railway, or Render
4. **Monitoring** - Add logging and error tracking
5. **Rate Limiting** - Add express-rate-limit middleware

## 📖 Full Documentation

See [README.md](./README.md) for complete API documentation.

## 🆘 Need Help?

- Check the [README.md](./README.md)
- Review the code comments
- Open an issue on GitHub

---

Happy coding! 🎉
