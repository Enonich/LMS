"""
Quick verification script to test if questions can be loaded
"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "learners_db")

print("="*60)
print("Question Database Verification")
print("="*60)

try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    db = client[DATABASE_NAME]
    questions_collection = db["questions"]
    
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB connection successful")
    print(f"   Database: {DATABASE_NAME}")
    
    # Count total questions
    total = questions_collection.count_documents({})
    print(f"\n📊 Total Questions: {total}")
    
    if total == 0:
        print("\n⚠️  No questions in database!")
        print("   Run: python backend\\seed_sample_questions.py")
    else:
        # Show breakdown by department
        print("\n📚 Questions by Department:")
        pipeline = [
            {"$group": {"_id": "$department", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        
        for dept in questions_collection.aggregate(pipeline):
            print(f"   • {dept['_id']}: {dept['count']} questions")
        
        # Show sample questions
        print("\n📝 Sample Questions:")
        for i, q in enumerate(questions_collection.find().limit(3), 1):
            print(f"\n   {i}. [{q['department']}] {q['question_text'][:60]}...")
            print(f"      Type: {q['question_type']}")
            print(f"      Answer: {q['answer']}")
            if q.get('options'):
                print(f"      Options: {len(q['options'])} choices")
        
        print("\n✅ Questions are ready to be loaded in the web app!")
        print("\n💡 To test:")
        print("   1. Start the server: python start.py")
        print("   2. Login to the web app")
        print("   3. Navigate to Quiz page")
        print("   4. Questions should load automatically")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\n💡 Troubleshooting:")
    print("   • Ensure MongoDB is running")
    print("   • Check MONGO_URL in .env file")
    print("   • Run: mongod (to start MongoDB)")

finally:
    if 'client' in locals():
        client.close()

print("\n" + "="*60)
