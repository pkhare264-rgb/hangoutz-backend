import express from 'express';
import { moderateText, getAIChatResponse } from '../services/ai.js';
import { protect } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/ai/moderate
 * @desc    Moderate text content
 * @access  Private
 */
router.post('/moderate', protect, async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      throw new AppError('Text is required', 400);
    }

    const result = await moderateText(text);

    res.status(200).json({
      success: true,
      moderation: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/ai/chat
 * @desc    Get AI chat response
 * @access  Private
 */
router.post('/chat', protect, async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      throw new AppError('Message is required', 400);
    }

    // Moderate the message first
    const moderation = await moderateText(message);
    if (moderation.flagged && moderation.severity === 'high') {
      throw new AppError('Message contains inappropriate content', 400);
    }

    // Get AI response
    const response = await getAIChatResponse(history, message);

    res.status(200).json({
      success: true,
      response,
      moderation
    });
  } catch (error) {
    next(error);
  }
});

export default router;
