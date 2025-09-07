const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: [true, 'Session is required']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Tutor is required']
  },
  
  // Booking Details
  bookingTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  
  // Student Information
  studentMessage: {
    type: String,
    maxlength: [300, 'Message cannot exceed 300 characters'],
    default: ''
  },
  studentGoals: {
    type: String,
    maxlength: [500, 'Goals cannot exceed 500 characters'],
    default: ''
  },
  
  // Session Specific Information
  sessionNotes: {
    type: String,
    maxlength: [1000, 'Session notes cannot exceed 1000 characters'],
    default: ''
  },
  
  // Attendance Verification
  attendance: {
    studentAttended: {
      type: Boolean,
      default: null
    },
    tutorConfirmed: {
      type: Boolean,
      default: null
    },
    attendanceMethod: {
      type: String,
      enum: ['qr-code', 'photo', 'manual', 'video-call', 'location-check'],
      default: null
    },
    attendanceTime: {
      type: Date,
      default: null
    },
    attendanceProof: {
      type: String, // URL to proof image or data
      default: null
    }
  },
  
  // Feedback and Rating
  feedback: {
    studentRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: null
    },
    studentComment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default: ''
    },
    tutorRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: null
    },
    tutorComment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default: ''
    },
    feedbackSubmittedAt: {
      type: Date,
      default: null
    }
  },
  
  // Cancellation
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['student', 'tutor', 'system'],
      default: null
    },
    cancellationReason: {
      type: String,
      maxlength: [300, 'Cancellation reason cannot exceed 300 characters'],
      default: ''
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push'],
      required: true
    },
    sentAt: {
      type: Date,
      required: true
    },
    reminderTime: {
      type: Date,
      required: true
    }
  }],
  
  // Privacy and Data Protection
  dataRetention: {
    personalDataExpiry: {
      type: Date,
      default: function() {
        // Personal data expires after 1 year
        return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }
    },
    anonymizedAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ session: 1, student: 1 });
bookingSchema.index({ student: 1, status: 1 });
bookingSchema.index({ tutor: 1, status: 1 });
bookingSchema.index({ bookingTime: 1 });
bookingSchema.index({ 'attendance.attendanceTime': 1 });

// Virtual for checking if booking is active
bookingSchema.virtual('isActive').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

// Virtual for checking if booking is completed
bookingSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Virtual for checking if attendance is verified
bookingSchema.virtual('isAttendanceVerified').get(function() {
  return this.attendance.studentAttended !== null && this.attendance.tutorConfirmed !== null;
});

// Pre-save middleware to validate booking
bookingSchema.pre('save', async function(next) {
  try {
    // Check if student and tutor are different
    if (this.student.toString() === this.tutor.toString()) {
      throw new Error('Student cannot book their own session');
    }
    
    // Check if session exists and is available
    const session = await mongoose.model('Session').findById(this.session);
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (!session.isAvailable()) {
      throw new Error('Session is not available for booking');
    }
    
    // Check if student already has a booking for this session
    const existingBooking = await mongoose.model('Booking').findOne({
      session: this.session,
      student: this.student,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (existingBooking && existingBooking._id.toString() !== this._id.toString()) {
      throw new Error('Student already has a booking for this session');
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware to update session participant count
bookingSchema.post('save', async function(doc) {
  try {
    const session = await mongoose.model('Session').findById(doc.session);
    if (session) {
      const confirmedBookings = await mongoose.model('Booking').countDocuments({
        session: doc.session,
        status: { $in: ['confirmed', 'completed'] }
      });
      
      session.currentParticipants = confirmedBookings;
      await session.save();
    }
  } catch (error) {
    console.error('Error updating session participant count:', error);
  }
});

// Method to confirm attendance
bookingSchema.methods.confirmAttendance = function(method, proof = null) {
  this.attendance.studentAttended = true;
  this.attendance.attendanceMethod = method;
  this.attendance.attendanceTime = new Date();
  if (proof) {
    this.attendance.attendanceProof = proof;
  }
  return this.save();
};

// Method to mark as no-show
bookingSchema.methods.markNoShow = function() {
  this.attendance.studentAttended = false;
  this.attendance.attendanceTime = new Date();
  this.status = 'no-show';
  return this.save();
};

// Method to complete session
bookingSchema.methods.completeSession = function() {
  this.status = 'completed';
  return this.save();
};

// Method to cancel booking
bookingSchema.methods.cancelBooking = function(cancelledBy, reason = '') {
  this.status = 'cancelled';
  this.cancellation.cancelledBy = cancelledBy;
  this.cancellation.cancellationReason = reason;
  this.cancellation.cancelledAt = new Date();
  return this.save();
};

// Method to submit feedback
bookingSchema.methods.submitFeedback = function(rating, comment, submittedBy) {
  if (submittedBy === 'student') {
    this.feedback.studentRating = rating;
    this.feedback.studentComment = comment;
  } else if (submittedBy === 'tutor') {
    this.feedback.tutorRating = rating;
    this.feedback.tutorComment = comment;
  }
  
  this.feedback.feedbackSubmittedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Booking', bookingSchema);
