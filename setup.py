#!/usr/bin/env python
"""
Setup script for FINA Tutor Booking System
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

def setup_django():
    """Setup Django environment"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()

def create_superuser():
    """Create a superuser for the application"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    if User.objects.filter(is_superuser=True).exists():
        print("Superuser already exists.")
        return
    
    print("Creating superuser...")
    username = input("Username: ")
    email = input("Email: ")
    password = input("Password: ")
    
    User.objects.create_superuser(
        username=username,
        email=email,
        password=password,
        sid=input("Student ID: "),
        program=input("Program (FINA/QFIN/OTHER): "),
        year=input("Year: "),
        first_name=input("First name: "),
        last_name=input("Last name: ")
    )
    print("Superuser created successfully!")

def main():
    """Main setup function"""
    print("Setting up FINA Tutor Booking System...")
    
    # Setup Django
    setup_django()
    
    # Run migrations
    print("Running migrations...")
    execute_from_command_line(['manage.py', 'migrate'])
    
    # Create superuser
    create_superuser()
    
    print("Setup complete!")
    print("Run 'python manage.py runserver' to start the development server.")

if __name__ == '__main__':
    main()
