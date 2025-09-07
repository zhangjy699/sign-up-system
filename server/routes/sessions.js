const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Session = require('../models/Session');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all available sessions
// @route   GET /api/sessions
// @access  Public
router.get('/', [
  query('category').optional().isString(),
  query('program').optional().isIn(['FINA', 'QFIN']),
  query('date').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {
      status: 'available',
      startTime: { $gte: new Date() } // Only future sessions
    };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      filter.startTime = {
        $gte: date,
        $lt: nextDay
      };
    }

    // Get sessions with tutor information
    const sessions = await Session.find(filter)
      .populate('tutor', 'firstName lastName program yearOfStudy bio tutoringCategories')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Session.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: sessions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: sessions.map(session => ({
        ...session.getSummary(),
        tutor: session.tutor
      }))
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get single session
// @route   GET /api/sessions/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('tutor', 'firstName lastName program yearOfStudy bio tutoringCategories');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...session.toObject(),
        tutor: session.tutor
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Create new session
// @route   POST /api/sessions
// @access  Private (Tutors only)
router.post('/', protect, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must be less than 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .isIn([
      'Course Tutoring',
      'Case Competition Preparation',
      'Profile Coaching Sessions',
      'Market News Sharing',
      'FINA Free Chat',
      'Course Selection',
      'Books Sharing',
      'Internship Sharing',
      'Other'
    ])
    .withMessage('Invalid category'),
  body('customCategory')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Custom category cannot exceed 100 characters'),
  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid date'),
  body('endTime')
    .isISO8601()
    .withMessage('End time must be a valid date'),
  body('location')
    .isIn(['Online', 'On-campus', 'Off-campus'])
    .withMessage('Location must be Online, On-campus, or Off-campus'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Max participants must be between 1 and 20'),
  body('meetingLink')
    .optional()
    .isURL()
    .withMessage('Meeting link must be a valid URL'),
  body('campusLocation')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Campus location cannot exceed 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if user can tutor
    if (!req.user.canTutor) {
      return res.status(403).json({
        success: false,
        message: 'Only tutors can create sessions'
      });
    }

    const {
      title,
      description,
      category,
      customCategory,
      startTime,
      endTime,
      location,
      maxParticipants,
      meetingLink,
      campusLocation,
      requirements,
      materials
    } = req.body;

    // Validate time
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start <= now) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be in the future'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Check for overlapping sessions
    const overlappingSession = await Session.findOne({
      tutor: req.user.id,
      status: { $in: ['available', 'booked'] },
      $or: [
        {
          startTime: { $lt: end },
          endTime: { $gt: start }
        }
      ]
    });

    if (overlappingSession) {
      return res.status(400).json({
        success: false,
        message: 'You have an overlapping session at this time'
      });
    }

    // Create session
    const session = await Session.create({
      tutor: req.user.id,
      title,
      description,
      category,
      customCategory: category === 'Other' ? customCategory : undefined,
      startTime: start,
      endTime: end,
      location,
      maxParticipants: maxParticipants || 1,
      meetingLink: location === 'Online' ? meetingLink : undefined,
      campusLocation: location === 'On-campus' ? campusLocation : undefined,
      requirements,
      materials
    });

    // Populate tutor information
    await session.populate('tutor', 'firstName lastName program yearOfStudy bio');

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private (Session owner only)
router.put('/:id', protect, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be less than 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid date'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid date'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Max participants must be between 1 and 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is the tutor
    if (session.tutor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this session'
      });
    }

    // Check if session can be updated (not completed or cancelled)
    if (['completed', 'cancelled'].includes(session.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed or cancelled sessions'
      });
    }

    // Update session
    const allowedUpdates = [
      'title', 'description', 'startTime', 'endTime', 'location',
      'maxParticipants', 'meetingLink', 'campusLocation', 'requirements', 'materials'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('tutor', 'firstName lastName program yearOfStudy bio');

    res.status(200).json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Delete session
// @route   DELETE /api/sessions/:id
// @access  Private (Session owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is the tutor
    if (session.tutor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this session'
      });
    }

    // Check if session has bookings
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({
      session: session._id,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (bookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete session with active bookings'
      });
    }

    await Session.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get user's sessions (as tutor)
// @route   GET /api/sessions/my-sessions
// @access  Private
router.get('/my-sessions', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { tutor: req.user.id };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const sessions = await Session.find(filter)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Session.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: sessions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: sessions
    });
  } catch (error) {
    console.error('Get my sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
