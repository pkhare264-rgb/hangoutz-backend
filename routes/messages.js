import express from 'express';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { protect } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { moderateText } from '../services/ai.js';

const router = express.Router();

/**
 * @route   GET /api/messages/:conversationId
 * @desc    Get all messages for a conversation
 * @access  Private
 */
router.get('/:conversationId', protect, async (req, res, next) => {
  try {
    const { limit = 50, before } = req.query;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    const isParticipant = conversation.participants.some(
      p => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      throw new AppError('Not authorized to view these messages', 403);
    }

    // Build query
    let query = { channelId: req.params.conversationId };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Reverse to get chronological order
    messages.reverse();

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/messages
 * @desc    Send a message
 * @access  Private
 */
router.post('/', protect, async (req, res, next) => {
  try {
    const { channelId, message, type = 'text' } = req.body;

    if (!channelId || !message) {
      throw new AppError('Channel ID and message are required', 400);
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(channelId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    const isParticipant = conversation.participants.some(
      p => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      throw new AppError('Not authorized to send messages in this conversation', 403);
    }

    // Moderate message content
    const moderation = await moderateText(message);

    if (moderation.flagged && moderation.severity === 'high') {
      throw new AppError('Message contains inappropriate content', 400);
    }

    // Create message
    const newMessage = await Message.create({
      channelId,
      sender: {
        _id: req.user._id,
        name: req.user.name
      },
      message,
      type,
      isModerated: moderation.flagged,
      moderationFlag: moderation.reason
    });

    // Update conversation
    conversation.lastMessage = message;
    conversation.lastMessageAt = new Date();

    // Increment unread count for other participants
    if (!conversation.unreadCount) {
      conversation.unreadCount = new Map();
    }

    conversation.participants.forEach(participant => {
      if (participant._id.toString() !== req.user._id.toString()) {
        const currentCount = conversation.unreadCount.get(participant._id.toString()) || 0;
        conversation.unreadCount.set(participant._id.toString(), currentCount + 1);
      }
    });

    await conversation.save();

    // Emit socket event to other participants
    const io = req.app.get('io');
    conversation.participants.forEach(participant => {
      if (participant._id.toString() !== req.user._id.toString()) {
        io.to(participant._id.toString()).emit('message:new', {
          conversationId: channelId,
          message: newMessage
        });
      }
    });

    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete a message
 * @access  Private (sender only)
 */
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    // Check if user is the sender
    if (message.sender._id.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to delete this message', 403);
    }

    await message.deleteOne();

    // Emit socket event
    const io = req.app.get('io');
    const conversation = await Conversation.findById(message.channelId);
    
    conversation.participants.forEach(participant => {
      io.to(participant._id.toString()).emit('message:deleted', {
        conversationId: message.channelId,
        messageId: message._id
      });
    });

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/messages/:id/read
 * @desc    Mark message as read
 * @access  Private
 */
router.put('/:id/read', protect, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    // Don't mark own messages as read
    if (message.sender._id.toString() === req.user._id.toString()) {
      return res.status(200).json({
        success: true,
        message: 'Own message, no action needed'
      });
    }

    // Check if already read by this user
    const alreadyRead = message.readBy.some(
      r => r.userId.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({
        userId: req.user._id,
        readAt: new Date()
      });
      message.isRead = true;
      await message.save();

      // Emit socket event to sender
      const io = req.app.get('io');
      io.to(message.sender._id.toString()).emit('message:read', {
        messageId: message._id,
        readBy: req.user._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
