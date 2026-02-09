import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { calculateTrustScore } from '../services/ai.js';

const router = express.Router();

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (own profile only)
 */
router.put('/:id', protect, async (req, res, next) => {
  try {
    // Check if user is updating their own profile
    if (req.user._id.toString() !== req.params.id) {
      throw new AppError('Not authorized to update this profile', 403);
    }

    const { name, dob, gender, bio, interests, photos, privacySettings } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (dob) updateData.dob = dob;
    if (gender !== undefined) updateData.gender = gender;
    if (bio !== undefined) updateData.bio = bio;
    if (interests) updateData.interests = interests;
    if (photos) {
      updateData.photos = photos;
      updateData.photoURL = photos[0] || req.user.photoURL;
    }
    if (privacySettings) updateData.privacySettings = privacySettings;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user account
 * @access  Private (own account only)
 */
router.delete('/:id', protect, async (req, res, next) => {
  try {
    // Check if user is deleting their own account
    if (req.user._id.toString() !== req.params.id) {
      throw new AppError('Not authorized to delete this account', 403);
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/users/:id/verify
 * @desc    Submit verification photo
 * @access  Private
 */
router.post('/:id/verify', protect, async (req, res, next) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      throw new AppError('Not authorized', 403);
    }

    const { verificationPhotoURL } = req.body;

    if (!verificationPhotoURL) {
      throw new AppError('Verification photo is required', 400);
    }

    // In production, you would:
    // 1. Verify the photo matches the user's profile photos
    // 2. Use AI to detect if it's a real person
    // 3. Store for manual review if needed

    req.user.verificationPhotoURL = verificationPhotoURL;
    req.user.verified = true;
    req.user.trustScore = calculateTrustScore(req.user, {});

    await req.user.save();

    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/users/:id/block/:targetId
 * @desc    Block a user
 * @access  Private
 */
router.post('/:id/block/:targetId', protect, async (req, res, next) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      throw new AppError('Not authorized', 403);
    }

    const targetUser = await User.findById(req.params.targetId);
    if (!targetUser) {
      throw new AppError('User to block not found', 404);
    }

    if (!req.user.blockedUsers.includes(req.params.targetId)) {
      req.user.blockedUsers.push(req.params.targetId);
      await req.user.save();
    }

    res.status(200).json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/users/:id/block/:targetId
 * @desc    Unblock a user
 * @access  Private
 */
router.delete('/:id/block/:targetId', protect, async (req, res, next) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      throw new AppError('Not authorized', 403);
    }

    req.user.blockedUsers = req.user.blockedUsers.filter(
      id => id.toString() !== req.params.targetId
    );
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/users
 * @desc    Search/list users
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, limit = 20, page = 1 } = req.query;

    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { bio: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-blockedUsers')
      .sort({ trustScore: -1, createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
