"""
Script to create an admin user in MongoDB
"""
import os
os.environ["USE_TF"] = "0"

from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime
import uuid

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URL)
db = client["learners_db"]
users_collection = db["users"]

def create_admin_user():
    """Create an admin user"""
    print("=== Create Admin User ===\n")
    
    # Get user input
    email = input("Enter admin email: ").strip()
    password = input("Enter admin password (min 8 chars, 1 uppercase, 1 digit): ").strip()
    full_name = input("Enter admin full name: ").strip()
    department = input("Enter admin department: ").strip()
    
    # Validate
    if len(password) < 8:
        print("❌ Password must be at least 8 characters")
        return
    if not any(c.isupper() for c in password):
        print("❌ Password must contain at least one uppercase letter")
        return
    if not any(c.isdigit() for c in password):
        print("❌ Password must contain at least one digit")
        return
    
    # Check if user already exists
    if users_collection.find_one({"email": email}):
        print(f"❌ User with email {email} already exists")
        update = input("Update existing user to admin role? (y/n): ").strip().lower()
        if update == 'y':
            result = users_collection.update_one(
                {"email": email},
                {"$set": {"role": "admin"}}
            )
            if result.modified_count > 0:
                print(f"✅ User {email} updated to admin role!")
            else:
                print("❌ Update failed")
        return
    
    # Create admin user
    user_id = str(uuid.uuid4())
    hashed_password = pwd_context.hash(password)
    
    admin_doc = {
        "_id": user_id,
        "email": email,
        "password": hashed_password,
        "full_name": full_name,
        "department": department,
        "role": "admin",
        "enrolled_materials": [],
        "created_at": datetime.utcnow()
    }
    
    users_collection.insert_one(admin_doc)
    print(f"\n✅ Admin user created successfully!")
    print(f"   Email: {email}")
    print(f"   Role: admin")
    print(f"   Department: {department}")

if __name__ == "__main__":
    try:
        create_admin_user()
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        client.close()
