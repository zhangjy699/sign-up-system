# FINA/QFIN Student Scheduling System

A comprehensive student-focused scheduling system that connects junior and senior students in the FINA and QFIN community for academic support, mentorship, and knowledge sharing.

## Features

### 1. User Registration & Authentication
- Secure user registration with HKUST email validation
- Student ID verification (8-digit format)
- Program selection (FINA/QFIN)
- Profile creation with academic information
- Privacy settings for contact information

### 2. Category Selection
- **Standard Categories:**
  - Course Tutoring
  - Case Competition Preparation
  - Profile Coaching Sessions
  - Market News Sharing
  - FINA Free Chat
  - Course Selection
  - Books Sharing
  - Internship Sharing
- **Custom Categories:** Free text input for future expansion
- Multi-category selection for tutors

### 3. Availability Management
- Calendar interface for tutors to set availability
- Session creation with detailed information
- Time slot management
- Location options (Online, On-campus, Off-campus)
- Capacity management (1-20 participants)
- Recurring session support

### 4. Booking System
- Browse available sessions by category, program, and date
- Session details with tutor information
- Booking requests with student goals and messages
- Confirmation system for tutors
- Booking management and cancellation

### 5. Profile Visibility
- Public profiles for tutors
- Contact information sharing (privacy-controlled)
- Academic background display
- Tutoring categories and expertise
- Student and tutor statistics

### 6. Attendance Verification
Multiple verification methods:
- **QR Code:** Generate unique codes for sessions
- **Photo Verification:** Upload session photos
- **Manual Confirmation:** Tutor/student manual check-in
- **Video Call:** Online session verification
- **Location Check:** GPS-based verification for on-campus sessions

### 7. Privacy & Data Protection
- GDPR-compliant data handling
- Privacy settings for contact information
- Data retention policies
- Secure authentication with JWT tokens
- Encrypted password storage
- User data anonymization options

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **nodemailer** for email notifications

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Hook Form** for form management
- **React Hot Toast** for notifications
- **Lucide React** for icons

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd fina-qfin-scheduling-system
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (root, server, and client)
npm run install-all
```

### 3. Environment Configuration
Create a `.env` file in the `server` directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fina-qfin-scheduling
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

### 4. Database Setup
Make sure MongoDB is running on your system:
```bash
# Start MongoDB (if installed locally)
mongod
```

### 5. Run the Application
```bash
# Development mode (runs both server and client)
npm run dev

# Or run separately:
# Server only
npm run server

# Client only
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password
- `GET /api/auth/logout` - Logout

### Sessions
- `GET /api/sessions` - Get all available sessions
- `GET /api/sessions/:id` - Get single session
- `POST /api/sessions` - Create new session (tutors only)
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `GET /api/sessions/my-sessions` - Get user's sessions

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/tutor-bookings` - Get tutor's bookings
- `GET /api/bookings/:id` - Get single booking
- `PUT /api/bookings/:id/confirm` - Confirm booking
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `PUT /api/bookings/:id/attendance` - Confirm attendance
- `PUT /api/bookings/:id/complete` - Complete session
- `PUT /api/bookings/:id/feedback` - Submit feedback

### Users
- `GET /api/users/tutors` - Get all tutors
- `GET /api/users/:id` - Get user profile
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/search` - Search users
- `GET /api/users/categories` - Get available categories

## Database Schema

### User Model
- Personal information (name, email, student ID)
- Academic information (program, year of study)
- Tutoring preferences and categories
- Privacy settings
- Authentication data

### Session Model
- Session details (title, description, category)
- Scheduling information (start/end time, duration)
- Location and capacity settings
- Tutor information
- Materials and requirements

### Booking Model
- Student and tutor references
- Session details
- Booking status and timeline
- Attendance verification
- Feedback and ratings
- Cancellation information

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting (recommended for production)
- Environment variable protection
- Secure cookie settings

## Deployment

### Production Build
```bash
# Build the client
npm run build

# The built files will be in client/build/
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use a secure MongoDB connection string
- Set a strong JWT secret
- Configure email service credentials
- Set up proper CORS origins

### Recommended Hosting
- **Backend:** Heroku, DigitalOcean, AWS EC2
- **Database:** MongoDB Atlas
- **Frontend:** Netlify, Vercel, or serve from backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

## Future Enhancements

- Real-time notifications
- Video call integration
- Mobile app development
- Advanced analytics dashboard
- Integration with HKUST systems
- Multi-language support
- Advanced search and filtering
- Session recording capabilities
- Payment integration (if needed)
- Advanced reporting features
