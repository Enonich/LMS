"""
Migrate questions from quiz_db to learners_db
"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")

print("="*60)
print("Question Migration Script")
print("="*60)

try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    
    # Source and destination databases
    source_db = client["quiz_db"]
    dest_db = client["learners_db"]
    
    source_collection = source_db["questions"]
    dest_collection = dest_db["questions"]
    
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB connection successful\n")
    
    # Count questions in source
    source_count = source_collection.count_documents({})
    print(f"📊 Questions in quiz_db: {source_count}")
    
    if source_count == 0:
        print("\n⚠️  No questions to migrate!")
    else:
        # Ask for confirmation
        response = input(f"\nMigrate {source_count} questions from quiz_db to learners_db? (yes/no): ")
        
        if response.lower() == 'yes':
            # Check if destination has questions
            dest_count = dest_collection.count_documents({})
            should_migrate = True
            
            if dest_count > 0:
                print(f"\n⚠️  learners_db already has {dest_count} questions!")
                clear_response = input("Delete existing questions first? (yes/no): ")
                if clear_response.lower() != 'yes':
                    print("❌ Migration cancelled")
                    should_migrate = False
                else:
                    result = dest_collection.delete_many({})
                    print(f"🗑️  Deleted {result.deleted_count} questions from learners_db")
            
            if should_migrate:
                # Get all questions
                questions = list(source_collection.find())
                
                # Remove _id to let MongoDB generate new ones
                for q in questions:
                    if '_id' in q:
                        del q['_id']
                
                # Insert into destination
                if questions:
                    dest_collection.insert_many(questions)
                    print(f"\n✅ Successfully migrated {len(questions)} questions to learners_db")
                
                # Show breakdown
                print("\n📚 Questions by Department:")
                pipeline = [
                    {"$group": {"_id": "$department", "count": {"$sum": 1}}},
                    {"$sort": {"_id": 1}}
                ]
                
                for dept in dest_collection.aggregate(pipeline):
                    print(f"   • {dept['_id']}: {dept['count']} questions")
                
                # Ask if should delete from source
                delete_response = input("\nDelete questions from quiz_db? (yes/no): ")
                if delete_response.lower() == 'yes':
                    source_collection.delete_many({})
                    print("✅ Questions deleted from quiz_db")
            else:
                print("\n❌ No questions found to migrate")
        else:
            print("\n❌ Migration cancelled")
    
    print(f"\n📊 Total questions in learners_db: {dest_collection.count_documents({})}")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()

finally:
    if 'client' in locals():
        client.close()

print("\n" + "="*60)
