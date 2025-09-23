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