from fastapi import APIRouter, HTTPException, status
from .utils import (
    check_email_exists, create_user, verify_user_credentials, get_all_users,
    create_user_profile, get_user_profile, update_user_profile, delete_user_profile
)
from .schema import UserSignup, UserLogin, ProfileCreate, ProfileUpdate, ProfileResponse

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

@router.post("/profile", response_model=ProfileResponse)
def create_profile(profile_data: ProfileCreate):
    """
    Create a new profile for a user
    """
    result = create_user_profile(
        profile_data.login_email,  # Use login_email to find the user
        profile_data.name,
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

    # Get the created profile to return
    profile = get_user_profile(profile_data.login_email)
    if profile == "Profile not found":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve created profile"
        )

    return ProfileResponse(**profile)

@router.get("/profile/{login_email}", response_model=ProfileResponse)
def get_profile(login_email: str):
    """
    Get a user's profile by login email
    """
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

    return ProfileResponse(**profile)

@router.put("/profile/{login_email}", response_model=ProfileResponse)
def update_profile(login_email: str, profile_update: ProfileUpdate):
    """
    Update a user's profile
    """
    result = update_user_profile(
        login_email,  # Use login_email to find the user
        profile_update.name,
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

    # Get the updated profile to return
    profile = get_user_profile(login_email)
    if profile == "Profile not found":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve updated profile"
        )

    return ProfileResponse(**profile)

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
