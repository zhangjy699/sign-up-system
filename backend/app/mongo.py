import os
import pymongo
from dotenv import load_dotenv


# For production (Render) vs development (local)
if os.getenv("RENDER"):  # Render sets this environment variable
    MONGO_URI = os.getenv("MONGO_URI")
else:
    from dotenv import load_dotenv
    load_dotenv()
    MONGO_URI = os.getenv("MONGO_URI")

# Initialize MongoDB database connection
MONGODB_URL = os.getenv("MONGODB_URL")

try:
    client = pymongo.MongoClient(MONGODB_URL)
    db = client.get_database("sign_up_system")  # Use the exact database name from Atlas
    user_collection = db["user_collection"]
    print("MongoDB connection successful")
    print("Connected to database:", db.name)
    print("Available collections:", db.list_collection_names())

except Exception as e:
    print("MongoDB connection failed:", e)
