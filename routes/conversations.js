import express from 'express';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   GET /api/conversations
 * @desc    Get all conversations for current user
 * @access  Private
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      'participants._id': req.user._id
    })
      .sort({ lastMessageAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/conversations/:id
 * @desc    Get single conversation
 * @access  Private
 */
router.get('/:id', protect, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      throw new AppError('Not authorized to view this conversation', 403);
    }

    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/conversations
 * @desc    Create or get existing conversation
 * @access  Private
 */
router.post('/', protect, async (req, res, next) => {
  try {
    const { otherUserId, type = 'direct' } = req.body;

    if (!otherUserId) {
      throw new AppError('Other user ID is required', 400);
    }

    // Get other user
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      throw new AppError('User not found', 404);
    }

    // Check for existing conversation
    const existing = await Conversation.findOne({
      type: 'direct',
      'participants._id': { $all: [req.user._id, otherUserId] }
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        conversation: existing,
        isNew: false
      });
    }

    // Create new conversation
    const conversation = await Conversation.create({
      participants: [
        {
          _id: req.user._id,
          name: req.user.name,
          photoURL: req.user.photoURL
        },
        {
          _id: otherUser._id,
          name: otherUser.name,
          photoURL: otherUser.photoURL
        }
      ],
      type,
      lastMessage: '',
      lastMessageAt: new Date()
    });

    res.status(201).json({
      success: true,
      conversation,
      isNew: true
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/conversations/:id
 * @desc    Delete conversation
 * @access  Private
 */
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      throw new AppError('Not authorized to delete this conversation', 403);
    }

    await conversation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/conversations/:id/read
 * @desc    Mark conversation as read
 * @access  Private
 */
router.put('/:id/read', protect, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Reset unread count for this user
    if (!conversation.unreadCount) {
      conversation.unreadCount = new Map();
    }
    conversation.unreadCount.set(req.user._id.toString(), 0);
    
    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
