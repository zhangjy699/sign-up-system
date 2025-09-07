const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Tutor is required']
  },
  
  // Session Details
  title: {
    type: String,
    required: [true, 'Session title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Course Tutoring',
      'Case Competition Preparation', 
      'Profile Coaching Sessions',
      'Market News Sharing',
      'FINA Free Chat',
      'Course Selection',
      'Books Sharing',
      'Internship Sharing',
      'Other'
    ]
  },
  customCategory: {
    type: String,
    maxlength: [100, 'Custom category cannot exceed 100 characters']
  },
  
  // Scheduling
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [15, 'Minimum session duration is 15 minutes'],
    max: [480, 'Maximum session duration is 8 hours']
  },
  
  // Location/Format
  location: {
    type: String,
    enum: ['Online', 'On-campus', 'Off-campus'],
    required: [true, 'Location type is required']
  },
  meetingLink: {
    type: String,
    validate: {
      validator: function(v) {
        if (this.location === 'Online' && !v) {
          return false;
        }
        return true;
      },
      message: 'Meeting link is required for online sessions'
    }
  },
  campusLocation: {
    type: String,
    maxlength: [200, 'Campus location cannot exceed 200 characters']
  },
  
  // Capacity and Booking
  maxParticipants: {
    type: Number,
    default: 1,
    min: [1, 'Maximum participants must be at least 1'],
    max: [20, 'Maximum participants cannot exceed 20']
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['available', 'booked', 'completed', 'cancelled'],
    default: 'available'
  },
  
  // Recurring Sessions
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
    required: function() {
      return this.isRecurring;
    }
  },
  recurringEndDate: {
    type: Date,
    required: function() {
      return this.isRecurring;
    }
  },
  parentSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  
  // Requirements
  requirements: {
    type: String,
    maxlength: [300, 'Requirements cannot exceed 300 characters'],
    default: ''
  },
  
  // Materials
  materials: [{
    name: {
      type: String,
      required: true,
      maxlength: [100, 'Material name cannot exceed 100 characters']
    },
    url: {
      type: String,
      required: true
    },
    description: {
      type: String,
      maxlength: [200, 'Material description cannot exceed 200 characters']
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
sessionSchema.index({ tutor: 1, startTime: 1 });
sessionSchema.index({ category: 1, status: 1 });
sessionSchema.index({ startTime: 1, endTime: 1 });
sessionSchema.index({ status: 1, startTime: 1 });

// Virtual for checking if session is full
sessionSchema.virtual('isFull').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

// Virtual for checking if session is in the past
sessionSchema.virtual('isPast').get(function() {
  return this.endTime < new Date();
});

// Virtual for checking if session is upcoming (within 24 hours)
sessionSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return this.startTime > now && this.startTime <= twentyFourHoursFromNow;
});

// Pre-save middleware to calculate duration
sessionSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  next();
});

// Method to check availability
sessionSchema.methods.isAvailable = function() {
  return this.status === 'available' && !this.isFull && !this.isPast;
};

// Method to get session summary
sessionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    category: this.category,
    startTime: this.startTime,
    endTime: this.endTime,
    duration: this.duration,
    location: this.location,
    maxParticipants: this.maxParticipants,
    currentParticipants: this.currentParticipants,
    isAvailable: this.isAvailable()
  };
};

module.exports = mongoose.model('Session', sessionSchema);
