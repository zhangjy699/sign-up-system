#!/bin/bash

# FINA/QFIN Student Scheduling System Setup Script
echo "🚀 Setting up FINA/QFIN Student Scheduling System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16 or higher) first."
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed locally. Make sure you have MongoDB running or use MongoDB Atlas."
fi

echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..

echo "✅ Dependencies installed successfully!"

# Create environment file if it doesn't exist
if [ ! -f "server/.env" ]; then
    echo "📝 Creating environment configuration..."
    cp server/config.env server/.env
    echo "⚠️  Please update server/.env with your actual configuration values:"
    echo "   - MONGODB_URI: Your MongoDB connection string"
    echo "   - JWT_SECRET: A secure random string"
    echo "   - EMAIL_USER and EMAIL_PASS: Your email credentials (optional)"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. Update server/.env with your configuration:"
echo "   - Set MONGODB_URI to your MongoDB connection string"
echo "   - Set JWT_SECRET to a secure random string"
echo "   - Configure email settings if needed"
echo ""
echo "2. Start MongoDB (if using local installation):"
echo "   mongod"
echo ""
echo "3. Run the application:"
echo "   npm run dev"
echo ""
echo "4. Open your browser to:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo ""
echo "📚 For more information, see README.md"
echo ""
echo "Happy coding! 🎓"
