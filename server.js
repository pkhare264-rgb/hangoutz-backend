import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { initializeFirebase } from './config/firebase-admin.js';
import logger from './config/logger.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSocketHandlers } from './socket/handlers.js';

// Routes
import firebaseAuthRoutes from './routes/firebase-auth.js';
import userRoutes from './routes/users.js';
import eventRoutes from './routes/events.js';
import conversationRoutes from './routes/conversations.js';
import messageRoutes from './routes/messages.js';
import uploadRoutes from './routes/upload.js';
import reportRoutes from './routes/reports.js';
import notificationRoutes from './routes/notifications.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const optionalEnvVars = ['CLIENT_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}
for (const envVar of optionalEnvVars) {
  if (!process.env[envVar]) {
    logger.warn(`Missing optional environment variable: ${envVar} — using defaults`);
  }
}

const app = express();
const httpServer = createServer(app);

// Connect to MongoDB
await connectDB();

// Initialize Firebase Admin SDK
try {
  initializeFirebase();
  logger.info('Firebase Admin SDK initialized');
} catch (error) {
  logger.error({ err: error }, 'Firebase initialization failed');
  process.exit(1);
}

// ============================================
// CORS Configuration
// ============================================
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8081',
  'https://hangoutz-frontend.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// Socket.io
// ============================================
const io = new SocketIO(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);
setupSocketHandlers(io);
logger.info('Socket.io initialized');

// ============================================
// Middleware
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

// Request ID for tracing
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    logger.debug(`[${req.id}] ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// Health check
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      mongodb: 'connected',
      firebase: 'initialized',
      socketio: 'active'
    }
  });
});

// ============================================
// API Routes
// ============================================
app.use('/api/firebase-auth', authLimiter, firebaseAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// ============================================
// Error handling
// ============================================

// CORS errors (must be before 404 handler)
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Origin not allowed'
    });
  }
  next(err);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use(errorHandler);

// ============================================
// Start server
// ============================================
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info('='.repeat(50));
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Firebase Auth: Enabled`);
  logger.info(`Socket.io: Active`);
  logger.info('='.repeat(50));
  logger.info('');
  logger.info('Available endpoints:');
  logger.info('  GET  /health');
  logger.info('  POST /api/firebase-auth/verify');
  logger.info('  POST /api/firebase-auth/refresh');
  logger.info('  POST /api/firebase-auth/logout');
  logger.info('  GET  /api/users');
  logger.info('  GET  /api/users/:id');
  logger.info('  PUT  /api/users/:id');
  logger.info('  GET  /api/events');
  logger.info('  POST /api/events');
  logger.info('  POST /api/events/:id/join');
  logger.info('  POST /api/events/:id/leave');
  logger.info('  GET  /api/conversations');
  logger.info('  POST /api/messages');
  logger.info('  POST /api/upload');
  logger.info('  POST /api/reports');
  logger.info('  POST /api/notifications/register');
  logger.info('');
});

// ============================================
// Graceful shutdown
// ============================================
process.on('SIGTERM', () => {
  logger.warn('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  logger.warn('SIGINT received, shutting down gracefully...');
  httpServer.close(() => process.exit(0));
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});
