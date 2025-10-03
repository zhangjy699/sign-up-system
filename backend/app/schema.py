from pydantic import BaseModel
from typing import Optional

class UserSignup(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    email: str
    name: str
    study_year: int
    major: str
    contact_number: str

class UserProfileUpdate(BaseModel):
    name: str
    study_year: int
    major: str
    contact_number: str
