from .mongo import user_collection, session_collection, registration_collection
from datetime import datetime
from bson import ObjectId

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

def create_user_profile(email, SID, name, study_year, major, contact_phone, profile_email):
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
        "SID": SID,
        "study_year": study_year,
        "major": major,
        "contact_phone": contact_phone,
        "personal_email": profile_email
    }

    # Update user with profile
    result = user_collection.update_one(
        {"email": email},
        {"$set": {"profile": profile_data}}
    )

    return str(result.modified_count) if result.modified_count > 0 else None

def complete_user_profile(email, full_english_name, preferred_name, contact_number, major, study_year):
    """Complete user profile after signup with the required fields"""
    # First check if user exists
    user = user_collection.find_one({"email": email})
    if not user:
        return None

    # Check if profile already exists
    if "profile" in user and user["profile"]:
        return None  # Profile already completed

    # Create profile with the completion data
    profile_data = {
        "full_english_name": full_english_name,
        "preferred_name": preferred_name,
        "contact_number": contact_number,
        "major": major,
        "study_year": study_year,
        "personal_email": email,  # Use login email as personal email by default
        "completed_at": datetime.utcnow()
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

def update_user_profile(email, SID=None, name=None, study_year=None, major=None, contact_phone=None, profile_email=None):
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
    if SID is not None:
        update_data["profile.SID"] = SID
    if study_year is not None:
        update_data["profile.study_year"] = study_year
    if major is not None:
        update_data["profile.major"] = major
    if contact_phone is not None:
        update_data["profile.contact_phone"] = contact_phone
    if profile_email is not None:
        update_data["profile.personal_email"] = profile_email  # Note: this is profile_email, not login email

    if not update_data:
        return "No fields to update"

    # Update user profile
    result = user_collection.update_one(
        {"email": email},
        {"$set": update_data}
    )

    return str(result.modified_count) if result.modified_count > 0 else None

def update_completed_profile(email, full_english_name=None, preferred_name=None, study_year=None, major=None, contact_number=None, profile_picture=None):
    """Update a user's completed profile (using completion field names)"""
    # First check if user exists
    user = user_collection.find_one({"email": email})
    if not user:
        return None

    # Check if profile exists
    if "profile" not in user:
        return "Profile not found"

    # Build update data with only provided fields
    update_data = {}
    if full_english_name is not None:
        update_data["profile.full_english_name"] = full_english_name
    if preferred_name is not None:
        update_data["profile.preferred_name"] = preferred_name
    if study_year is not None:
        update_data["profile.study_year"] = study_year
    if major is not None:
        update_data["profile.major"] = major
    if contact_number is not None:
        update_data["profile.contact_number"] = contact_number
    if profile_picture is not None:
        update_data["profile.profile_picture"] = profile_picture

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

# ==================== Tutor Availability Management Functions ====================
# create tutor availability
def create_tutor_availability(tutor_email, tutor_name, session_type, date, time_slot, location, description=None):
    """Create a new tutor availability slot"""
    availability_data = {
        "tutor_email": tutor_email,
        "tutor_name": tutor_name,
        "session_type": session_type,
        "date": date,
        "time_slot": time_slot,
        "location": location,
        "description": description,
        "is_registered": False,  # Track if a student registered for this slot
        "registered_student": None,  # Email of registered student
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = session_collection.insert_one(availability_data)
    return str(result.inserted_id)

def get_tutor_availability(tutor_email=None, date=None, session_type=None, status="active"):
    """Get tutor availability slots with optional filters"""
    query = {"status": status}
    
    if tutor_email:
        query["tutor_email"] = tutor_email
    if date:
        query["date"] = date
    if session_type:
        query["session_type"] = session_type
    
    availabilities = list(session_collection.find(query))
    for availability in availabilities:
        availability["_id"] = str(availability["_id"])
        availability["id"] = availability["_id"]
        availability["is_available"] = not availability.get("is_registered", False)
        availability["student_registered"] = availability.get("registered_student")
    
    if len(availabilities) == 0:
        return None
    
    return availabilities

def delete_tutor_availability(availability_id, tutor_email):
    """Delete a tutor's availability slot (only if it's their own)"""
    try:
        # Check if the slot belongs to the tutor
        availability = session_collection.find_one({
            "_id": ObjectId(availability_id),
            "tutor_email": tutor_email
        })
        
        if not availability:
            return "Availability slot not found or not owned by this tutor"
        
        # Check if someone is registered
        if availability.get("is_registered", False):
            return "Cannot delete slot with registered student"
        
        # Delete the availability slot
        result = session_collection.delete_one({"_id": ObjectId(availability_id)})
        return str(result.deleted_count) if result.deleted_count > 0 else None
    except:
        return None

# ==================== Student register sessions Functions ====================
    
def get_student_calendar_view(session_type=None, date=None):
    """Get calendar view for students - grouped by date/time with multiple tutor options"""
    query = {"status": "active", "is_registered": False}  # Only show available slots
    
    if session_type:
        query["session_type"] = session_type
    if date:
        query["date"] = date
    
    availabilities = list(session_collection.find(query))
    
    # Group by date, time_slot, and session_type
    calendar_slots = {}
    
    for availability in availabilities:
        availability["_id"] = str(availability["_id"])
        availability["id"] = availability["_id"]
        availability["is_available"] = True  # All in this query are available
        availability["student_registered"] = None
        
        # Create a key for grouping
        key = f"{availability['date']}_{availability['time_slot']}_{availability['session_type']}"
        
        if key not in calendar_slots:
            calendar_slots[key] = {
                "date": availability["date"],
                "time_slot": availability["time_slot"],
                "session_type": availability["session_type"],
                "available_tutors": []
            }
        
        calendar_slots[key]["available_tutors"].append(availability)
    
    return list(calendar_slots.values())

def register_student_for_tutor_slot(student_email, availability_id):
    """Register a student for a specific tutor's availability slot"""
    try:
        # Check if availability slot exists and is active
        availability = session_collection.find_one({"_id": ObjectId(availability_id)})
        if not availability:
            return "Availability slot not found"
        
        if availability["status"] != "active":
            return "Availability slot is not active"
        
        # Check if slot is already registered (one-on-one)
        if availability.get("is_registered", False):
            return "This tutor slot is already taken"
        
        # Check if student is already registered for this specific slot
        existing_registration = registration_collection.find_one({
            "student_email": student_email,
            "session_id": ObjectId(availability_id),
            "status": "registered"
        })
        
        if existing_registration:
            return "Already registered for this tutor slot"
        
        # Check for time conflicts (same student can't book multiple sessions at same time)
        if check_time_conflict(student_email, availability["date"], availability["time_slot"]):
            return "Time conflict with existing registration"
        
        # Create registration
        registration_data = {
            "student_email": student_email,
            "session_id": ObjectId(availability_id),
            "registration_time": datetime.utcnow(),
            "status": "registered",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = registration_collection.insert_one(registration_data)
        
        # Update availability slot registration status
        session_collection.update_one(
            {"_id": ObjectId(availability_id)},
            {"$set": {
                "is_registered": True,
                "registered_student": student_email
            }}
        )
        
        return str(result.inserted_id)
    
    except Exception as e:
        return None

def cancel_student_registration_for_tutor_slot(student_email, availability_id):
    """Cancel a student's registration for a specific tutor slot"""
    try:
        # Find and update the registration
        result = registration_collection.update_one(
            {
                "student_email": student_email,
                "session_id": ObjectId(availability_id),
                "status": "registered"
            },
            {
                "$set": {
                    "status": "cancelled",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            # Free up the tutor slot (make it available again)
            session_collection.update_one(
                {"_id": ObjectId(availability_id)},
                {"$set": {
                    "is_registered": False,
                    "registered_student": None
                }}
            )
            return str(result.modified_count)
        
        return None
    except:
        return None


# ==================== Session Registration Helper Functions ====================

def check_time_conflict(student_email, date, time_slot):
    """Check if student has a time conflict with existing registrations"""
    # Get all active registrations for the student
    registrations = list(registration_collection.find({
        "student_email": student_email,
        "status": "registered"
    }))
    
    for reg in registrations:
        # Get session details for each registration
        session = session_collection.find_one({"_id": reg["session_id"]})
        if session and session["date"] == date and session["time_slot"] == time_slot:
            return True  # Conflict found
    
    return False  # No conflict

def get_student_registrations(student_email):
    """Get active registrations for a student"""
    # Only get registrations with "registered" status
    registrations = list(registration_collection.find({
        "student_email": student_email,
        "status": "registered"
    }))
    
    result = []
    for reg in registrations:
        # Get session details (tutor availability)
        session = session_collection.find_one({"_id": reg["session_id"]})
        if session:
            reg_data = {
                "registration_id": str(reg["_id"]),
                "availability_id": str(reg["session_id"]),  # This is actually availability_id in the new system
                "student_email": reg["student_email"],
                "registration_time": reg["registration_time"].isoformat() if isinstance(reg["registration_time"], datetime) else str(reg["registration_time"]),
                "status": reg["status"],
                "session_details": {
                    "session_type": session["session_type"],
                    "tutor_name": session["tutor_name"],
                    "date": session["date"],
                    "time_slot": session["time_slot"],
                    "location": session["location"],
                    "description": session.get("description", "")
                }
            }
            result.append(reg_data)
    
    return result
