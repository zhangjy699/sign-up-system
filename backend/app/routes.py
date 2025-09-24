from fastapi import APIRouter, HTTPException, status
from .utils import check_email_exists, create_user, verify_user_credentials, get_all_users
from .schema import UserSignup, UserLogin

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
