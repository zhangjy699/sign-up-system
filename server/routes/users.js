const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all tutors
// @route   GET /api/users/tutors
// @access  Public
router.get('/tutors', [
  query('program').optional().isIn(['FINA', 'QFIN']),
  query('category').optional().isString(),
  query('yearOfStudy').optional().isInt({ min: 1, max: 5 }),
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
      canTutor: true,
      isActive: true
    };

    if (req.query.program) {
      filter.program = req.query.program;
    }

    if (req.query.yearOfStudy) {
      filter.yearOfStudy = req.query.yearOfStudy;
    }

    if (req.query.category) {
      filter.tutoringCategories = { $in: [req.query.category] };
    }

    const tutors = await User.find(filter)
      .select('firstName lastName program yearOfStudy bio tutoringCategories customCategories')
      .sort({ yearOfStudy: -1, firstName: 1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: tutors.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: tutors
    });
  } catch (error) {
    console.error('Get tutors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get single user profile
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const Session = require('../models/Session');

    // Get user's booking statistics
    const totalBookings = await Booking.countDocuments({ student: req.user.id });
    const completedBookings = await Booking.countDocuments({ 
      student: req.user.id, 
      status: 'completed' 
    });
    const upcomingBookings = await Booking.countDocuments({ 
      student: req.user.id, 
      status: { $in: ['pending', 'confirmed'] },
      'session.startTime': { $gte: new Date() }
    });

    // Get user's tutoring statistics (if they're a tutor)
    let tutoringStats = null;
    if (req.user.canTutor) {
      const totalSessions = await Session.countDocuments({ tutor: req.user.id });
      const completedSessions = await Session.countDocuments({ 
        tutor: req.user.id, 
        status: 'completed' 
      });
      const upcomingSessions = await Session.countDocuments({ 
        tutor: req.user.id, 
        status: { $in: ['available', 'booked'] },
        startTime: { $gte: new Date() }
      });

      const totalStudents = await Booking.distinct('student', { 
        tutor: req.user.id, 
        status: 'completed' 
      });

      tutoringStats = {
        totalSessions,
        completedSessions,
        upcomingSessions,
        totalStudents: totalStudents.length
      };
    }

    res.status(200).json({
      success: true,
      data: {
        student: {
          totalBookings,
          completedBookings,
          upcomingBookings
        },
        tutor: tutoringStats
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
router.get('/search', [
  query('q').notEmpty().withMessage('Search query is required'),
  query('type').optional().isIn(['all', 'tutors', 'students']),
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
    const searchQuery = req.query.q;
    const type = req.query.type || 'all';

    // Build search filter
    const filter = {
      isActive: true,
      $or: [
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { bio: { $regex: searchQuery, $options: 'i' } },
        { tutoringCategories: { $regex: searchQuery, $options: 'i' } },
        { customCategories: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    if (type === 'tutors') {
      filter.canTutor = true;
    } else if (type === 'students') {
      filter.canTutor = false;
    }

    const users = await User.find(filter)
      .select('firstName lastName program yearOfStudy bio tutoringCategories customCategories canTutor')
      .sort({ firstName: 1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get available categories
// @route   GET /api/users/categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      'Course Tutoring',
      'Case Competition Preparation',
      'Profile Coaching Sessions',
      'Market News Sharing',
      'FINA Free Chat',
      'Course Selection',
      'Books Sharing',
      'Internship Sharing',
      'Other'
    ];

    // Get custom categories from users
    const customCategories = await User.distinct('customCategories', {
      customCategories: { $exists: true, $ne: [] }
    });

    res.status(200).json({
      success: true,
      data: {
        standard: categories,
        custom: customCategories.filter(cat => cat && cat.trim() !== '')
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Deactivate account
// @route   PUT /api/users/deactivate
// @access  Private
router.put('/deactivate', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isActive: false },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
