"""
Seed sample questions to test the quiz functionality
"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from datetime import datetime
import uuid

load_dotenv()

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "learners_db")

client = MongoClient(MONGO_URL)
db = client[DATABASE_NAME]
questions_collection = db["questions"]

# Sample questions for different departments
sample_questions = [
    # Physics
    {
        "question_text": "What is the speed of light in vacuum?",
        "options": ["3 × 10^8 m/s", "3 × 10^6 m/s", "3 × 10^10 m/s", "3 × 10^5 m/s"],
        "answer": "3 × 10^8 m/s",
        "department": "Physics",
        "question_type": "multiple_choice"
    },
    {
        "question_text": "Newton's first law is also known as the law of ______.",
        "options": [],
        "answer": "inertia",
        "department": "Physics",
        "question_type": "short_answer"
    },
    {
        "question_text": "Energy can be created or destroyed. True or False?",
        "options": ["True", "False"],
        "answer": "False",
        "department": "Physics",
        "question_type": "true_false"
    },
    
    # Chemistry
    {
        "question_text": "What is the chemical symbol for Gold?",
        "options": ["Go", "Gd", "Au", "Ag"],
        "answer": "Au",
        "department": "Chemistry",
        "question_type": "multiple_choice"
    },
    {
        "question_text": "What is the pH of pure water at 25°C?",
        "options": [],
        "answer": "7",
        "department": "Chemistry",
        "question_type": "short_answer"
    },
    {
        "question_text": "An atom is the smallest unit of matter. True or False?",
        "options": ["True", "False"],
        "answer": "True",
        "department": "Chemistry",
        "question_type": "true_false"
    },
    
    # Biology
    {
        "question_text": "What is the powerhouse of the cell?",
        "options": ["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"],
        "answer": "Mitochondria",
        "department": "Biology",
        "question_type": "multiple_choice"
    },
    {
        "question_text": "What is the process by which plants make their food?",
        "options": [],
        "answer": "photosynthesis",
        "department": "Biology",
        "question_type": "short_answer"
    },
    {
        "question_text": "DNA stands for Deoxyribonucleic Acid. True or False?",
        "options": ["True", "False"],
        "answer": "True",
        "department": "Biology",
        "question_type": "true_false"
    },
    
    # Mathematics
    {
        "question_text": "What is the value of π (pi) approximately?",
        "options": ["3.14", "2.71", "1.41", "1.73"],
        "answer": "3.14",
        "department": "Mathematics",
        "question_type": "multiple_choice"
    },
    {
        "question_text": "What is the square root of 144?",
        "options": [],
        "answer": "12",
        "department": "Mathematics",
        "question_type": "short_answer"
    },
    {
        "question_text": "The sum of angles in a triangle is 180 degrees. True or False?",
        "options": ["True", "False"],
        "answer": "True",
        "department": "Mathematics",
        "question_type": "true_false"
    },
    
    # Computer Science
    {
        "question_text": "Which programming language is known as the 'language of the web'?",
        "options": ["Python", "JavaScript", "C++", "Java"],
        "answer": "JavaScript",
        "department": "Computer Science",
        "question_type": "multiple_choice"
    },
    {
        "question_text": "What does HTML stand for?",
        "options": [],
        "answer": "HyperText Markup Language",
        "department": "Computer Science",
        "question_type": "short_answer"
    },
    {
        "question_text": "Python is a compiled language. True or False?",
        "options": ["True", "False"],
        "answer": "False",
        "department": "Computer Science",
        "question_type": "true_false"
    },
    
    # Geography
    {
        "question_text": "What is the largest continent by area?",
        "options": ["Africa", "Asia", "North America", "Europe"],
        "answer": "Asia",
        "department": "Geography",
        "question_type": "multiple_choice"
    },
    {
        "question_text": "What is the capital city of France?",
        "options": [],
        "answer": "Paris",
        "department": "Geography",
        "question_type": "short_answer"
    },
    {
        "question_text": "The Amazon River is the longest river in the world. True or False?",
        "options": ["True", "False"],
        "answer": "False",
        "department": "Geography",
        "question_type": "true_false"
    }
]

def seed_questions():
    """Seed sample questions into the database"""
    print(f"Connecting to MongoDB: {MONGO_URL}")
    print(f"Database: {DATABASE_NAME}")
    print(f"Collection: questions")
    
    # Check if questions already exist
    existing_count = questions_collection.count_documents({})
    print(f"\nExisting questions in database: {existing_count}")
    
    if existing_count > 0:
        response = input("\nQuestions already exist. Do you want to:\n1. Add sample questions anyway\n2. Clear existing and add samples\n3. Skip seeding\nChoice (1/2/3): ")
        
        if response == "2":
            questions_collection.delete_many({})
            print("✓ Cleared existing questions")
        elif response == "3":
            print("Skipping seed operation")
            return
    
    # Prepare question documents
    question_docs = []
    for q in sample_questions:
        question_doc = {
            "question_id": str(uuid.uuid4()),
            "question_text": q["question_text"],
            "options": q.get("options", []),
            "answer": q["answer"],
            "department": q["department"],
            "question_type": q.get("question_type", "short_answer"),
            "material_id": None,
            "public_text": q["question_text"],
            "created_by": "system",
            "created_at": datetime.utcnow()
        }
        question_docs.append(question_doc)
    
    # Insert questions
    if question_docs:
        result = questions_collection.insert_many(question_docs)
        print(f"\n✅ Successfully inserted {len(result.inserted_ids)} sample questions")
        
        # Show breakdown by department
        print("\n📊 Questions by Department:")
        departments = {}
        for q in sample_questions:
            dept = q["department"]
            departments[dept] = departments.get(dept, 0) + 1
        
        for dept, count in sorted(departments.items()):
            print(f"   • {dept}: {count} questions")
        
        print(f"\n✨ Total questions in database: {questions_collection.count_documents({})}")
    else:
        print("No questions to insert")

if __name__ == "__main__":
    print("="*60)
    print("Sample Questions Seeder")
    print("="*60)
    
    try:
        seed_questions()
        print("\n✅ Seeding completed successfully!")
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

