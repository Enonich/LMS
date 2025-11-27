"""
Question MongoDB Upload Module
Handles uploading questions to MongoDB database
"""
from pymongo import MongoClient
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class QuestionUploader:
    """Upload questions to MongoDB database"""
    
    def __init__(self, mongodb_uri=None, database_name=None):
        """
        Initialize MongoDB connection
        
        Args:
            mongodb_uri: MongoDB connection string (defaults to env MONGO_URL)
            database_name: Database name (defaults to env DATABASE_NAME or learners_db)
        """
        mongo_uri = mongodb_uri or os.getenv("MONGO_URL", "mongodb://localhost:27017/")
        db_name = database_name or os.getenv("DATABASE_NAME", "learners_db")
        
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.questions_collection = self.db["questions"]
        
        print(f"Connected to MongoDB: {mongo_uri}")
        print(f"Using database: {db_name}")

    def upload(self, questions, department, material_id=None, created_by="admin"):
        """
        Upload extracted questions to MongoDB.
        
        Args:
            questions: List of question dictionaries with structure:
                {
                    "question_text": str,
                    "options": List[str],
                    "answer": str,
                    "question_type": str,
                    "public_text": str (optional)
                }
            department: Department/subject for these questions
            material_id: Optional material ID to link questions to
            created_by: User ID who created these questions
        
        Returns:
            Number of questions successfully uploaded
        """
        if not questions:
            print("No questions to upload")
            return 0
        
        question_docs = []
        
        for q in questions:
            # Ensure required fields exist
            if not q.get("question_text") or not q.get("answer"):
                print(f"Skipping invalid question: {q}")
                continue
            
            question_doc = {
                "question_id": str(uuid.uuid4()),
                "question_text": q["question_text"],
                "options": q.get("options", []),
                "answer": q["answer"],
                "department": department,
                "question_type": q.get("question_type", "short_answer"),
                "material_id": material_id,
                "public_text": q.get("public_text") or q["question_text"],
                "created_by": created_by,
                "created_at": datetime.utcnow()
            }
            
            question_docs.append(question_doc)
        
        if question_docs:
            self.questions_collection.insert_many(question_docs)
            print(f"Successfully uploaded {len(question_docs)} questions to MongoDB")
            return len(question_docs)
        
        return 0

    def get_question_count(self, department=None):
        """
        Get count of questions in database
        
        Args:
            department: Optional filter by department
        
        Returns:
            Number of questions
        """
        query = {"department": department} if department else {}
        return self.questions_collection.count_documents(query)

    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()


# -------------------------- Example usage --------------------------
if __name__ == "__main__":
    # Example questions
    sample_questions = [
        {
            "question_text": "What is the speed of light in vacuum?",
            "options": ["3 × 10^8 m/s", "3 × 10^6 m/s", "3 × 10^10 m/s"],
            "answer": "3 × 10^8 m/s",
            "question_type": "multiple_choice"
        },
        {
            "question_text": "What is Newton's first law also known as?",
            "options": [],
            "answer": "Law of Inertia",
            "question_type": "short_answer"
        }
    ]
    
    uploader = QuestionUploader()
    
    print(f"\n{'='*60}")
    print("MONGODB UPLOAD TEST")
    print(f"{'='*60}\n")
    
    # Upload test questions
    uploaded = uploader.upload(
        questions=sample_questions,
        department="Physics",
        created_by="test_user"
    )
    
    print(f"\nTotal questions in database: {uploader.get_question_count()}")
    print(f"Physics questions in database: {uploader.get_question_count('Physics')}")
    
    uploader.close()
