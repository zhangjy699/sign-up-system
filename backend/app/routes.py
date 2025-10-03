from fastapi import APIRouter, HTTPException, status
from .utils import check_email_exists, create_user, verify_user_credentials, get_all_users, update_user_profile
from .schema import UserSignup, UserLogin, UserProfileUpdate

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

@router.get("/profile/{email}")
def get_profile(email: str):
    # Get user profile
    user = check_email_exists(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Remove sensitive data
    profile = {k: v for k, v in user.items() if k not in ['password', '_id']}
    return profile

@router.put("/profile/{email}")
def update_profile(email: str, profile_data: UserProfileUpdate):
    # Update user profile
    success = update_user_profile(email, profile_data.model_dump())
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "message": "Profile updated successfully",
        "email": email
    }
