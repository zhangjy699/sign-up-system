import os
import pymongo
from dotenv import load_dotenv

load_dotenv()

# Initialize MongoDB database connection
MONGODB_URL = os.getenv("MONGODB_URL")

try:
    client = pymongo.MongoClient(MONGODB_URL)
    db = client["sign_up_system"]
    user_collection = db["user_collection"]
    print("MongoDB connection successful")
    print("Databases:", client.list_database_names())

except Exception as e:
    print("MongoDB connection failed:", e)
