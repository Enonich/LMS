"""
Database connection and setup
"""
from pymongo import MongoClient
from src.core.config import settings

class Database:
    """MongoDB database connection"""
    
    def __init__(self):
        self.client = None
        self.db = None
    
    def connect(self):
        """Connect to MongoDB"""
        self.client = MongoClient(settings.MONGO_URL)
        self.db = self.client[settings.DATABASE_NAME]
        return self.db
    
    def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
    
    def get_collection(self, name: str):
        """Get a collection from the database"""
        if self.db is None:
            self.connect()
        return self.db[name]

# Singleton instance
db = Database()

# Collections
def get_users_collection():
    return db.get_collection("users")

def get_questions_collection():
    return db.get_collection("questions")

def get_materials_collection():
    return db.get_collection("materials")

def get_progress_collection():
    return db.get_collection("progress")

def get_schedules_collection():
    return db.get_collection("schedules")
