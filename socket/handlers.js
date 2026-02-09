import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Setup Socket.IO event handlers
 */
export const setupSocketHandlers = (io) => {
  
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-otpSecret -otpExpiry');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // Join user's personal room for notifications
    socket.join(socket.userId);

    // Update user's online status
    updateUserStatus(socket.userId, true);

    // Handle typing indicators
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(conversationId).emit('user:typing', {
        userId: socket.userId,
        userName: socket.user.name,
        conversationId
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(conversationId).emit('user:stopTyping', {
        userId: socket.userId,
        conversationId
      });
    });

    // Handle joining conversation rooms
    socket.on('conversation:join', ({ conversationId }) => {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    socket.on('conversation:leave', ({ conversationId }) => {
      socket.leave(conversationId);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle user presence
    socket.on('user:online', () => {
      socket.broadcast.emit('user:status', {
        userId: socket.userId,
        online: true
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
      updateUserStatus(socket.userId, false);
      
      socket.broadcast.emit('user:status', {
        userId: socket.userId,
        online: false
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Helper function to update user status
  async function updateUserStatus(userId, online) {
    try {
      await User.findByIdAndUpdate(userId, {
        lastActive: new Date(),
        // You can add an 'online' field if you want to track it
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }
};

/**
 * Emit event to specific user
 */
export const emitToUser = (io, userId, event, data) => {
  io.to(userId.toString()).emit(event, data);
};

/**
 * Emit event to conversation participants
 */
export const emitToConversation = (io, conversationId, event, data) => {
  io.to(conversationId.toString()).emit(event, data);
};

/**
 * Emit event to all users except sender
 */
export const broadcastToOthers = (io, senderId, event, data) => {
  io.except(senderId.toString()).emit(event, data);
};
