#!/bin/bash

echo "🚀 Starting FINA Tutor Booking System Backend..."

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Start development server
echo "🌐 Starting development server..."
echo "Backend will be available at: http://127.0.0.1:8000"
echo "Admin panel: http://127.0.0.1:8000/admin"
echo "API documentation: http://127.0.0.1:8000/api/"
echo ""
echo "Press Ctrl+C to stop the server"
python manage.py runserver
