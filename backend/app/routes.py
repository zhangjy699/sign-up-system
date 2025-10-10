from fastapi import APIRouter, HTTPException, status
from urllib.parse import unquote
from .utils import (
    check_email_exists, create_user, verify_user_credentials, get_all_users,
    create_user_profile, get_user_profile, update_user_profile, delete_user_profile,
    complete_user_profile, update_completed_profile,
    register_student_for_tutor_slot, cancel_student_registration_for_tutor_slot,
    # Tutor availability management functions
    create_tutor_availability, get_tutor_availability, delete_tutor_availability,
    # Student registration function
    get_student_calendar_view, 
    get_student_registrations
)

    
from .schema import (
    UserSignup, UserLogin, ProfileCreate, ProfileUpdate, ProfileResponse, ProfileCompletion,
    CompletedProfileUpdate, CompletedProfileResponse,
    # Tutor availability schemas
    TutorAvailabilityCreate, SessionTypesList,
    # Student registration schemas
    StudentSessionSelection, StudentCalendarView,
)

router = APIRouter()

@router.post("/signup")
def signup(user_data: UserSignup):

    # Check if email already exists
    if check_email_exists(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_id = create_user(user_data.email, user_data.password)
    
    return {
        "message": "User created successfully",
        "email": user_data.email,
        "user_id": user_id
    }

@router.post("/profile/complete")
def complete_profile(profile_data: ProfileCompletion):
    """Complete user profile after signup"""
    
    # Check if user exists
    user = check_email_exists(profile_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if profile already exists
    if "profile" in user and user["profile"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already completed"
        )
    
    # Complete the profile using the existing utility function
    result = complete_user_profile(
        profile_data.email,
        profile_data.full_english_name,
        profile_data.preferred_name,
        profile_data.contact_number,
        profile_data.major,
        profile_data.study_year
    )
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete profile"
        )
    
    return {
        "message": "Profile completed successfully",
        "email": profile_data.email,
        "user_id": str(user["_id"]),
        "success": True
    }

@router.post("/login")
def login(user_data: UserLogin):

    # Verify user credentials
    user = verify_user_credentials(user_data.email, user_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    return {
        "message": "Login successful",
        "email": user_data.email,
        "user_id": str(user["_id"])
    }

@router.get("/users")
def get_users():

    # Get all users for admin purposes
    users = get_all_users()
    return users

# ==================== Personal Profile Endpoints ====================

@router.post("/profile")
def create_profile(profile_data: ProfileCreate):
    """
    Create a new profile for a user
    """
    result = create_user_profile(
        profile_data.login_email,  # Use login_email to find the user
        profile_data.name,
        profile_data.SID,
        profile_data.study_year,
        profile_data.major,
        profile_data.contact_phone,
        profile_data.profile_email  # Use profile_email for the profile data
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if result == "Profile already exists":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists for this user"
        )

    # return successful creation message
    return{
        "success": True,
        "message": "Profile created successfully",
        "user_email": profile_data.login_email
    }

@router.get("/profile/{login_email}")
def get_profile(login_email: str):
    """
    Get a user's profile by login email
    """
    # URL decode the email
    login_email = unquote(login_email)
    profile = get_user_profile(login_email)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if profile == "Profile not found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for this user"
        )

    # Return the profile data as-is, let the frontend handle the structure
    return profile

@router.put("/profile/{login_email}")
def update_profile(login_email: str, profile_update: ProfileUpdate):
    """
    Update a user's profile
    """
    # URL decode the email
    login_email = unquote(login_email)
    result = update_user_profile(
        login_email,  # Use login_email to find the user
        profile_update.name,
        profile_update.SID,
        profile_update.study_year,
        profile_update.major,
        profile_update.contact_phone,
        profile_update.profile_email  # Use profile_email for the update
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if result == "Profile not found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for this user"
        )

    if result == "No fields to update":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    # return successful update message
    return{
        "success": True,
        "message": "Profile updated successfully",
        "user_email": login_email
    }
    

@router.delete("/profile/{login_email}")
def delete_profile(login_email: str):
    """
    Delete a user's profile
    """
    result = delete_user_profile(login_email)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if result == "Profile not found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for this user"
        )

    return {
        "message": "Profile deleted successfully"
    }

@router.put("/profile/completed/{login_email}")
def update_completed_profile_endpoint(login_email: str, profile_update: CompletedProfileUpdate):
    """
    Update a user's completed profile (using completion field names)
    """
    # URL decode the email
    login_email = unquote(login_email)
    result = update_completed_profile(
        login_email,
        profile_update.full_english_name,
        profile_update.preferred_name,
        profile_update.study_year,
        profile_update.major,
        profile_update.contact_number,
        profile_update.profile_picture
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if result == "Profile not found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for this user"
        )

    if result == "No fields to update":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    return {
        "success": True,
        "message": "Profile updated successfully",
        "user_email": login_email
    }

# ==================== Tutor Availability Management Endpoints ====================

@router.post("/tutor/availability")
def create_tutor_availability_endpoint(availability_data: TutorAvailabilityCreate):
    """Create a new tutor availability slot"""
    availability_id = create_tutor_availability(
        availability_data.tutor_email,
        availability_data.tutor_name,
        availability_data.session_type,
        availability_data.date,
        availability_data.time_slot,
        availability_data.location,
        availability_data.description
    )
    
    return {
        "success": True,
        "message": "Tutor availability created successfully",
        "availability_id": availability_id
    }

@router.get("/tutor/availability/{tutor_email}")
def get_tutor_availability_endpoint(tutor_email: str, date: str = None, session_type: str = None):
    """Get a tutor's availability slots"""
    availabilities = get_tutor_availability(tutor_email, date, session_type)
    
    if availabilities is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No existing time slots found"
        )
    
    return {
        "tutor_email": tutor_email,
        "availabilities": availabilities,
        "total_slots": len(availabilities)
    }

@router.delete("/tutor/availability/{availability_id}")
def delete_tutor_availability_endpoint(availability_id: str, tutor_email: str):
    """Delete a tutor's availability slot"""
    result = delete_tutor_availability(availability_id, tutor_email)
    
    if result == "Availability slot not found or not owned by this tutor":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability slot not found or not owned by this tutor"
        )
    
    if result == "Cannot delete slot with registered student":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete slot with registered student"
        )
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete availability slot"
        )
    
    return {
        "success": True,
        "message": "Availability slot deleted successfully"
    }

# # ==================== Student Calendar and Registration Endpoints ====================

@router.get("/student/calendar", response_model=StudentCalendarView)
def get_student_calendar(session_type: str = None, date: str = None):
    """Get calendar view for students - shows available tutors grouped by time slots"""
    calendar_slots = get_student_calendar_view(session_type, date)
    
    return StudentCalendarView(calendar_slots=calendar_slots)

@router.post("/student/register")
def register_student_for_session(selection_data: StudentSessionSelection):
    """Register a student for a specific tutor's availability slot"""
    result = register_student_for_tutor_slot(
        selection_data.student_email,
        selection_data.availability_id
    )
    
    # Handle different error cases
    if result == "Availability slot not found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability slot not found"
        )
    
    if result == "Availability slot is not active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Availability slot is not active"
        )
    
    if result == "This tutor slot is already taken":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This tutor slot is already taken"
        )
    
    if result == "Already registered for this tutor slot":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already registered for this tutor slot"
        )
    
    if result == "Time conflict with existing registration":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Time conflict with existing registration"
        )
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )
    
    return {
        "success": True,
        "message": "Successfully registered for tutor session",
        "registration_id": result
    }

@router.delete("/student/register")
def cancel_student_registration(selection_data: StudentSessionSelection):
    """Cancel a student's registration for a specific tutor slot"""
    result = cancel_student_registration_for_tutor_slot(
        selection_data.student_email,
        selection_data.availability_id
    )
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found or already cancelled"
        )
    
    return {
        "success": True,
        "message": "Registration cancelled successfully"
    }

# ==================== Session Types Endpoint ====================

@router.get("/session-types", response_model=SessionTypesList)
def get_session_types():
    """Get available session types"""
    return SessionTypesList()

# ==================== Student My Sessions Endpoint ====================

@router.get("/my-sessions/{student_email}")
def get_my_sessions(student_email: str):
    """Get active sessions registered by a student"""
    registrations = get_student_registrations(student_email)
    
    return {
        "student_email": student_email,
        "registrations": registrations,
        "total_registrations": len(registrations)
    }
