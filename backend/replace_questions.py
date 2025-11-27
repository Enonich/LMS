"""
Script to replace all questions in the database with newly extracted ones
that have the correct public_text format.
"""

from pymongo import MongoClient
from extract_questions import QuestionExtractor
import os
from dotenv import load_dotenv

def replace_questions_in_db(pdf_path: str):
    """
    Delete all existing questions and upload new ones with correct format.
    """
    # Load environment variables
    load_dotenv()
    
    # Connect to MongoDB (use same env var as upload_questions.py)
    mongo_uri = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
    
    client = MongoClient(mongo_uri)
    db = client['learners_db']
    collection = db['questions']
    
    # Check current count
    current_count = collection.count_documents({})
    print(f"📊 Current questions in database: {current_count}")
    
    if current_count > 0:
        # Show sample of old format
        sample = collection.find_one()
        if sample:
            print(f"📄 Old public_text format: {sample.get('public_text', 'N/A')[:100]}...")
        
        # Delete all existing questions
        result = collection.delete_many({})
        print(f"🗑️  Deleted {result.deleted_count} old questions")
    
    # Extract questions from PDF with new format
    print(f"\n📖 Extracting questions from {pdf_path}...")
    extractor = QuestionExtractor()
    questions = extractor.extract(pdf_path)
    
    if not questions:
        print("❌ No questions extracted!")
        return
    
    print(f"✅ Extracted {len(questions)} questions")
    
    # Show sample of new format
    print(f"📄 New public_text format: {questions[0]['public_text'][:100]}...")
    
    # Upload to database
    print(f"\n📤 Uploading questions to database...")
    
    # Detect department from filename
    filename = os.path.basename(pdf_path).lower()
    if 'bio' in filename:
        department = 'Biology'
    elif 'phys' in filename:
        department = 'Physics'
    elif 'chem' in filename:
        department = 'Chemistry'
    else:
        department = 'General'
    
    print(f"📋 Department: {department}")
    extractor.extract_and_upload(pdf_path, department=department)
    
    # Verify upload
    new_count = collection.count_documents({})
    print(f"✅ Database now contains {new_count} questions with correct public_text format!")
    
    client.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python replace_questions.py <path_to_pdf>")
        print("Example: python replace_questions.py ../data/biolset2.pdf")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"❌ File not found: {pdf_path}")
        sys.exit(1)
    
    # Confirm before proceeding
    print("⚠️  WARNING: This will DELETE all existing questions and replace them!")
    response = input("Are you sure you want to continue? (yes/no): ")
    
    if response.lower() != 'yes':
        print("❌ Operation cancelled")
        sys.exit(0)
    
    replace_questions_in_db(pdf_path)
