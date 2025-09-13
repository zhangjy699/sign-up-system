#!/usr/bin/env python
"""
Development server runner for FINA Tutor Booking System
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

def main():
    """Run the development server"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()
    
    # Check if migrations are needed
    from django.core.management import call_command
    try:
        call_command('migrate', '--check')
    except SystemExit:
        print("Running migrations...")
        call_command('migrate')
    
    # Start the development server
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000'])

if __name__ == '__main__':
    main()
