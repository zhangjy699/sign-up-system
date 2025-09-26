from pydantic import BaseModel
from typing import Optional

class UserSignup(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class ProfileCreate(BaseModel):
    login_email: str  # User's registered email (used to find the user)
    name: str
    study_year: str
    major: str
    contact_phone: str
    profile_email: str  # User's profile email (different from login email)

class ProfileUpdate(BaseModel):
    login_email: Optional[str] = None  # User's registered email (used to find the user)
    name: Optional[str] = None
    study_year: Optional[str] = None
    major: Optional[str] = None
    contact_phone: Optional[str] = None
    profile_email: Optional[str] = None  # User's profile email

class ProfileResponse(BaseModel):
    name: str
    study_year: str
    major: str
    contact_phone: str
    email: str  # Keep consistent with database field name

    class Config:
        # Allow extra fields and provide defaults for missing fields
        extra = "ignore"
        # This will help with validation errors if fields are missing
        validate_assignment = True
