import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/notifications/register
 * @desc    Register or update FCM token for push notifications
 * @access  Private
 */
router.post('/register', protect, async (req, res, next) => {
    try {
        const { fcmToken } = req.body;

        if (!fcmToken) {
            throw new AppError('FCM token is required', 400);
        }

        req.user.fcmToken = fcmToken;
        await req.user.save();

        res.status(200).json({
            success: true,
            message: 'FCM token registered successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   DELETE /api/notifications/unregister
 * @desc    Remove FCM token (disable push notifications)
 * @access  Private
 */
router.delete('/unregister', protect, async (req, res, next) => {
    try {
        req.user.fcmToken = '';
        await req.user.save();

        res.status(200).json({
            success: true,
            message: 'FCM token removed successfully'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
