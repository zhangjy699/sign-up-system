from .mongo import user_collection

def check_email_exists(email):
    """Check if email already exists in database"""
    return user_collection.find_one({"email": email})

def create_user(email, password):
    """Create a new user in database"""
    user = {
        "email": email,
        "password": password
    }
    result = user_collection.insert_one(user)
    return str(result.inserted_id)

def verify_user_credentials(email, password):
    """Verify if email and password match exactly"""
    user = user_collection.find_one({"email": email})
    if not user:
        return None
    if user["password"] != password:
        return None
    return user

def get_all_users():
    """Get all users from database (without passwords)"""
    users = list(user_collection.find({}, {"password": 0}))
    for user in users:
        user["_id"] = str(user["_id"])
    return users

def create_user_profile(email, name, study_year, major, contact_phone, profile_email):
    """Create a profile for a user"""
    # First check if user exists
    user = user_collection.find_one({"email": email})
    if not user:
        return None

    # Check if profile already exists
    if "profile" in user and user["profile"]:
        return "Profile already exists"

    # Create profile
    profile_data = {
        "name": name,
        "study_year": study_year,
        "major": major,
        "contact_phone": contact_phone,
        "email": profile_email
    }

    # Update user with profile
    result = user_collection.update_one(
        {"email": email},
        {"$set": {"profile": profile_data}}
    )

    return str(result.modified_count) if result.modified_count > 0 else None

def get_user_profile(email):
    """Get a user's profile"""
    user = user_collection.find_one({"email": email}, {"password": 0})
    if not user:
        return None

    if "profile" not in user:
        return "Profile not found"

    # Convert ObjectId to string for JSON serialization
    user["_id"] = str(user["_id"])
    return user["profile"]

def update_user_profile(email, name=None, study_year=None, major=None, contact_phone=None, profile_email=None):
    """Update a user's profile"""
    # First check if user exists
    user = user_collection.find_one({"email": email})
    if not user:
        return None

    # Check if profile exists
    if "profile" not in user:
        return "Profile not found"

    # Build update data with only provided fields
    update_data = {}
    if name is not None:
        update_data["profile.name"] = name
    if study_year is not None:
        update_data["profile.study_year"] = study_year
    if major is not None:
        update_data["profile.major"] = major
    if contact_phone is not None:
        update_data["profile.contact_phone"] = contact_phone
    if profile_email is not None:
        update_data["profile.email"] = profile_email  # Note: this is profile_email, not login email

    if not update_data:
        return "No fields to update"

    # Update user profile
    result = user_collection.update_one(
        {"email": email},
        {"$set": update_data}
    )

    return str(result.modified_count) if result.modified_count > 0 else None

def delete_user_profile(email):
    """Delete a user's profile"""
    # Check if user exists
    user = user_collection.find_one({"email": email})
    if not user:
        return None

    # Check if profile exists
    if "profile" not in user:
        return "Profile not found"

    # Remove profile from user
    result = user_collection.update_one(
        {"email": email},
        {"$unset": {"profile": 1}}
    )

    return str(result.modified_count) if result.modified_count > 0 else None