import express from 'express';
import Event from '../models/Event.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   GET /api/events
 * @desc    Get all events with filters
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      category,
      status = 'upcoming',
      search,
      limit = 20,
      page = 1,
      sortBy = '-createdAt',
      lat,
      lng,
      maxDistance = 50000 // 50km default
    } = req.query;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Geo-spatial search if coordinates provided
    if (lat && lng) {
      query.coordinates = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      };
    }

    const events = await Event.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort(sortBy)
      .lean();

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      events,
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

/**
 * @route   GET /api/events/:id
 * @desc    Get single event by ID
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('participants', 'name photoURL verified trustScore');

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/events
 * @desc    Create new event
 * @access  Private
 */
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, description, location, dateTime, category, coordinates, maxParticipants, tags } = req.body;

    // Validate required fields
    if (!title || !description || !location || !dateTime || !category) {
      throw new AppError('Please provide all required fields', 400);
    }

    // Validate coordinates
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      throw new AppError('Event coordinates are required', 400);
    }

    // Generate image URL (you can replace with actual upload)
    const imageURL = `https://picsum.photos/seed/${Date.now()}/800/400`;

    const event = await Event.create({
      title,
      description,
      location,
      dateTime: new Date(dateTime),
      category,
      imageURL,
      host: {
        _id: req.user._id,
        name: req.user.name,
        photoURL: req.user.photoURL
      },
      participants: [req.user._id],
      coordinates,
      maxParticipants,
      tags: tags || [],
      status: 'upcoming'
    });

    res.status(201).json({
      success: true,
      event
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/events/:id
 * @desc    Update event
 * @access  Private (host only)
 */
router.put('/:id', protect, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Check if user is the host
    if (event.host._id.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to update this event', 403);
    }

    const { title, description, location, dateTime, category, coordinates, maxParticipants, tags, status } = req.body;

    // Update fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (location) event.location = location;
    if (dateTime) event.dateTime = new Date(dateTime);
    if (category) event.category = category;
    if (coordinates) event.coordinates = coordinates;
    if (maxParticipants !== undefined) event.maxParticipants = maxParticipants;
    if (tags) event.tags = tags;
    if (status) event.status = status;

    await event.save();

    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event
 * @access  Private (host only)
 */
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Check if user is the host
    if (event.host._id.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to delete this event', 403);
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/events/:id/join
 * @desc    Join an event
 * @access  Private
 */
router.post('/:id/join', protect, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Check if event is full
    if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
      throw new AppError('Event is full', 400);
    }

    // Check if already joined
    if (event.participants.includes(req.user._id)) {
      throw new AppError('Already joined this event', 400);
    }

    event.participants.push(req.user._id);
    await event.save();

    // Emit socket event to notify host
    const io = req.app.get('io');
    io.to(event.host._id.toString()).emit('event:newParticipant', {
      eventId: event._id,
      participant: {
        _id: req.user._id,
        name: req.user.name,
        photoURL: req.user.photoURL
      }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully joined event',
      event
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/events/:id/leave
 * @desc    Leave an event
 * @access  Private
 */
router.post('/:id/leave', protect, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Check if host is trying to leave
    if (event.host._id.toString() === req.user._id.toString()) {
      throw new AppError('Host cannot leave their own event', 400);
    }

    // Check if user is a participant
    if (!event.participants.includes(req.user._id)) {
      throw new AppError('Not a participant of this event', 400);
    }

    event.participants = event.participants.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Successfully left event',
      event
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/events/user/:userId
 * @desc    Get events by user (hosted or joined)
 * @access  Public
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { type = 'all' } = req.query; // 'hosted', 'joined', or 'all'

    let query = {};

    if (type === 'hosted') {
      query['host._id'] = req.params.userId;
    } else if (type === 'joined') {
      query.participants = req.params.userId;
    } else {
      query.$or = [
        { 'host._id': req.params.userId },
        { participants: req.params.userId }
      ];
    }

    const events = await Event.find(query)
      .sort({ dateTime: 1 })
      .lean();

    res.status(200).json({
      success: true,
      events
    });
  } catch (error) {
    next(error);
  }
});

export default router;
