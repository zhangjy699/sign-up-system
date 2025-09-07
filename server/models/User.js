const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@connect.ust.hk$/, 'Please enter a valid HKUST email']
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    match: [/^\d{8}$/, 'Student ID must be 8 digits']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  // Academic Information
  program: {
    type: String,
    required: [true, 'Program selection is required'],
    enum: ['FINA', 'QFIN']
  },
  yearOfStudy: {
    type: Number,
    required: [true, 'Year of study is required'],
    min: [1, 'Year of study must be at least 1'],
    max: [5, 'Year of study cannot exceed 5']
  },
  
  // Profile Information
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  
  // Tutoring Preferences
  canTutor: {
    type: Boolean,
    default: false
  },
  tutoringCategories: [{
    type: String,
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
  }],
  customCategories: [{
    type: String,
    maxlength: [100, 'Custom category cannot exceed 100 characters']
  }],
  
  // Contact Information (only visible after booking)
  phoneNumber: {
    type: String,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  wechatId: {
    type: String,
    maxlength: [50, 'WeChat ID cannot exceed 50 characters']
  },
  
  // System Information
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  // Privacy Settings
  privacySettings: {
    showEmail: {
      type: Boolean,
      default: false
    },
    showPhone: {
      type: Boolean,
      default: false
    },
    showWeChat: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ program: 1, yearOfStudy: 1 });
userSchema.index({ canTutor: 1, tutoringCategories: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  
  // Apply privacy settings
  if (!this.privacySettings.showEmail) delete userObject.email;
  if (!this.privacySettings.showPhone) delete userObject.phoneNumber;
  if (!this.privacySettings.showWeChat) delete userObject.wechatId;
  
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
