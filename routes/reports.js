import express from 'express';
import Report from '../models/Report.js';
import { protect } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/reports
 * @desc    Create a report for a user or event
 * @access  Private
 */
router.post('/', protect, async (req, res, next) => {
    try {
        const { targetId, targetType, reason, details } = req.body;

        if (!targetId || !targetType || !reason) {
            throw new AppError('targetId, targetType, and reason are required', 400);
        }

        if (!['user', 'event'].includes(targetType)) {
            throw new AppError('targetType must be "user" or "event"', 400);
        }

        // Prevent self-reporting
        if (targetType === 'user' && targetId === req.user._id.toString()) {
            throw new AppError('Cannot report yourself', 400);
        }

        // Check for duplicate report
        const existingReport = await Report.findOne({
            reporterId: req.user._id,
            targetId,
            targetType,
            status: 'pending'
        });

        if (existingReport) {
            throw new AppError('You have already reported this', 400);
        }

        const report = await Report.create({
            reporterId: req.user._id,
            targetId,
            targetType,
            reason,
            details: details || ''
        });

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
            report
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/reports
 * @desc    Get reports (admin)
 * @access  Private
 */
router.get('/', protect, async (req, res, next) => {
    try {
        const { status, limit = 20, page = 1 } = req.query;

        const query = {};
        if (status) query.status = status;

        const reports = await Report.find(query)
            .populate('reporterId', 'name phone photoURL')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Report.countDocuments(query);

        res.status(200).json({
            success: true,
            reports,
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
