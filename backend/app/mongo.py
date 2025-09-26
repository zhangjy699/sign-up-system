import os
import pymongo

# For production (Render) vs development (local)
if os.getenv("RENDER"):  # Render sets this environment variable
    MONGODB_URL = os.getenv("MONGODB_URL")
else:
    from dotenv import load_dotenv
    load_dotenv()
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
