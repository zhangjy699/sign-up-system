const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Booking = require('../models/Booking');
const Session = require('../models/Session');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
router.post('/', protect, [
  body('sessionId')
    .isMongoId()
    .withMessage('Valid session ID is required'),
  body('studentMessage')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Message cannot exceed 300 characters'),
  body('studentGoals')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Goals cannot exceed 500 characters')
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

    const { sessionId, studentMessage, studentGoals } = req.body;

    // Get session details
    const session = await Session.findById(sessionId).populate('tutor');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if session is available
    if (!session.isAvailable()) {
      return res.status(400).json({
        success: false,
        message: 'Session is not available for booking'
      });
    }

    // Check if user is trying to book their own session
    if (session.tutor._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own session'
      });
    }

    // Check if user already has a booking for this session
    const existingBooking = await Booking.findOne({
      session: sessionId,
      student: req.user.id,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have a booking for this session'
      });
    }

    // Create booking
    const booking = await Booking.create({
      session: sessionId,
      student: req.user.id,
      tutor: session.tutor._id,
      studentMessage,
      studentGoals
    });

    // Populate booking details
    await booking.populate([
      {
        path: 'session',
        select: 'title category startTime endTime location meetingLink campusLocation'
      },
      {
        path: 'tutor',
        select: 'firstName lastName program yearOfStudy email phoneNumber wechatId'
      }
    ]);

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
router.get('/my-bookings', protect, [
  query('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled', 'no-show']),
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

    const filter = { student: req.user.id };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter)
      .populate([
        {
          path: 'session',
          select: 'title category startTime endTime location meetingLink campusLocation'
        },
        {
          path: 'tutor',
          select: 'firstName lastName program yearOfStudy email phoneNumber wechatId'
        }
      ])
      .sort({ bookingTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: bookings
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get bookings for tutor's sessions
// @route   GET /api/bookings/tutor-bookings
// @access  Private
router.get('/tutor-bookings', protect, [
  query('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled', 'no-show']),
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

    const filter = { tutor: req.user.id };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter)
      .populate([
        {
          path: 'session',
          select: 'title category startTime endTime location meetingLink campusLocation'
        },
        {
          path: 'student',
          select: 'firstName lastName program yearOfStudy email phoneNumber wechatId'
        }
      ])
      .sort({ bookingTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: bookings
    });
  } catch (error) {
    console.error('Get tutor bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate([
        {
          path: 'session',
          select: 'title category startTime endTime location meetingLink campusLocation requirements materials'
        },
        {
          path: 'tutor',
          select: 'firstName lastName program yearOfStudy email phoneNumber wechatId bio'
        },
        {
          path: 'student',
          select: 'firstName lastName program yearOfStudy email phoneNumber wechatId bio'
        }
      ]);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is authorized to view this booking
    if (booking.student._id.toString() !== req.user.id && 
        booking.tutor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Confirm booking (tutor only)
// @route   PUT /api/bookings/:id/confirm
// @access  Private
router.put('/:id/confirm', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('tutor');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is the tutor
    if (booking.tutor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the tutor can confirm bookings'
      });
    }

    // Check if booking can be confirmed
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be confirmed'
      });
    }

    booking.status = 'confirmed';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, [
  body('reason')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Cancellation reason cannot exceed 300 characters')
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

    const booking = await Booking.findById(req.params.id).populate('tutor');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is authorized to cancel
    if (booking.student.toString() !== req.user.id && 
        booking.tutor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only pending or confirmed bookings can be cancelled'
      });
    }

    const cancelledBy = booking.student.toString() === req.user.id ? 'student' : 'tutor';
    
    await booking.cancelBooking(cancelledBy, req.body.reason);

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Confirm attendance
// @route   PUT /api/bookings/:id/attendance
// @access  Private
router.put('/:id/attendance', protect, [
  body('attended')
    .isBoolean()
    .withMessage('Attendance status is required'),
  body('method')
    .optional()
    .isIn(['qr-code', 'photo', 'manual', 'video-call', 'location-check'])
    .withMessage('Invalid attendance method'),
  body('proof')
    .optional()
    .isString()
    .withMessage('Proof must be a string')
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

    const booking = await Booking.findById(req.params.id).populate('session');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is authorized to confirm attendance
    if (booking.student.toString() !== req.user.id && 
        booking.tutor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm attendance for this booking'
      });
    }

    // Check if session has started
    if (new Date() < booking.session.startTime) {
      return res.status(400).json({
        success: false,
        message: 'Cannot confirm attendance before session starts'
      });
    }

    const { attended, method, proof } = req.body;

    if (attended) {
      await booking.confirmAttendance(method, proof);
    } else {
      await booking.markNoShow();
    }

    res.status(200).json({
      success: true,
      message: `Attendance ${attended ? 'confirmed' : 'marked as no-show'}`,
      data: booking
    });
  } catch (error) {
    console.error('Confirm attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Complete session
// @route   PUT /api/bookings/:id/complete
// @access  Private
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('session');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is the tutor
    if (booking.tutor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the tutor can complete sessions'
      });
    }

    // Check if booking can be completed
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed bookings can be completed'
      });
    }

    await booking.completeSession();

    res.status(200).json({
      success: true,
      message: 'Session completed successfully',
      data: booking
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Submit feedback
// @route   PUT /api/bookings/:id/feedback
// @access  Private
router.put('/:id/feedback', protect, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
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

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is authorized to submit feedback
    if (booking.student.toString() !== req.user.id && 
        booking.tutor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit feedback for this booking'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for completed sessions'
      });
    }

    const { rating, comment } = req.body;
    const submittedBy = booking.student.toString() === req.user.id ? 'student' : 'tutor';

    await booking.submitFeedback(rating, comment, submittedBy);

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: booking
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
