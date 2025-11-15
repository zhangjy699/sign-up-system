from pydantic import BaseModel
from typing import Optional, List

# User Signup and Login
class UserSignup(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# Profile Management
class ProfileCreate(BaseModel):
    login_email: str  # User's registered email (used to find the user)
    full_name: str
    preferred_name: str
    SID: str
    study_year: str
    major: str
    contact_phone: str
    profile_email: str  # User's profile email (may different from login email)
    profile_picture: Optional[str] = None  # Base64 encoded image or file path

class ProfileUpdate(BaseModel):
    login_email: Optional[str] = None  # User's registered email (used to find the user)
    full_name: Optional[str] = None
    preferred_name: Optional[str] = None
    SID: Optional[str] = None
    study_year: Optional[str] = None
    major: Optional[str] = None
    contact_phone: Optional[str] = None
    profile_email: Optional[str] = None  # User's profile email
    profile_picture: Optional[str] = None  # Base64 encoded image or file path

class ProfileResponse(BaseModel):
    full_name: str
    preferred_name: str
    SID: str    
    study_year: str
    major: str
    contact_phone: str
    personal_email: str  # Keep consistent with database field name
    profile_picture: Optional[str] = None  # Base64 encoded image or file path

    class Config:
        # Allow extra fields and provide defaults for missing fields
        extra = "ignore"
        # This will help with validation errors if fields are missing
        validate_assignment = True


class SessionTypesList(BaseModel):
    session_types: List[str] = [
        "Course Tutoring",
        "Study Plan advice", 
        "Profile Coaching Sessions",
        "Market News sharing",
        "Casual Chat",
        "Internship sharing",
        "Lunch Meet",
        "Others"
    ]

# Tutor Availability Schemas
class TutorAvailabilityCreate(BaseModel):
    tutor_email: str
    tutor_name: str
    session_type: str  # Which category they want to teach
    date: str  # Format: "YYYY-MM-DD"
    time_slot: str  # Format: "HH:MM-HH:MM"
    location: str
    description: Optional[str] = None

class TutorAvailabilityResponse(BaseModel):
    id: str
    tutor_email: str
    tutor_name: str
    session_type: str
    date: str
    time_slot: str
    location: str
    description: Optional[str] = None
    is_available: bool  # True if no student registered yet
    student_registered: Optional[str] = None
    status: str

# Student Session Selection
class StudentSessionSelection(BaseModel):
    student_email: str
    availability_id: str  # The specific tutor's availability slot

# Calendar View for Students
class CalendarSlot(BaseModel):
    date: str
    time_slot: str
    session_type: str
    available_tutors: List[TutorAvailabilityResponse]  # Multiple tutors available at same time

class StudentCalendarView(BaseModel):
    calendar_slots: List[CalendarSlot]
