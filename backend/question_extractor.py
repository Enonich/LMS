from docstrange import DocumentExtractor
import json
import re
from pymongo import MongoClient
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ------------------------------------------------------------------
#  Multi-Page JSON Parser
# ------------------------------------------------------------------

def merge_question_json_objects(json_objects):
    """
    Merge multiple JSON objects from different pages into a single complete question set.
    
    Strategy:
    - Concatenate all questions arrays from different pages
    - Remove duplicate questions (by question_text)
    """
    merged_questions = []
    seen_questions = set()
    
    for obj in json_objects:
        questions = obj.get("questions", [])
        
        for question in questions:
            # Use question_text as unique identifier
            q_text = question.get("question_text", "").strip()
            
            if q_text and q_text not in seen_questions:
                seen_questions.add(q_text)
                merged_questions.append(question)
    
    return {"questions": merged_questions}


def parse_multi_object_json(raw_text):
    """
    Parse output that may contain multiple JSON objects separated by page breaks.
    Returns a single merged JSON object with all questions.
    
    Handles the case where docstrange returns multiple JSON objects (one per page)
    separated by page break markers.
    """
    # Split by page break markers
    page_break_patterns = [
        r'<!-- Page Break.*?-->',
        r'\n\n\n+',  # Multiple newlines
    ]
    
    # Combine patterns into one regex
    split_pattern = '|'.join(f'(?:{p})' for p in page_break_patterns)
    chunks = re.split(split_pattern, raw_text, flags=re.IGNORECASE)
    
    json_objects = []
    
    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk:
            continue
        
        # Find JSON object in chunk
        json_start = chunk.find('{')
        if json_start == -1:
            continue
        
        json_string = chunk[json_start:]
        
        # Try to find the end of the JSON object
        try:
            # Use json.JSONDecoder to find where the JSON ends
            decoder = json.JSONDecoder()
            obj, end_idx = decoder.raw_decode(json_string)
            json_objects.append(obj)
        except json.JSONDecodeError as e:
            print(f"Warning: Could not parse JSON chunk: {e}")
            continue
    
    if not json_objects:
        raise ValueError("No valid JSON objects found in the output")
    
    # If only one object, return it directly
    if len(json_objects) == 1:
        return json_objects[0]
    
    # Otherwise, merge multiple objects
    print(f"Found {len(json_objects)} JSON objects across pages. Merging...")
    return merge_question_json_objects(json_objects)


# ------------------------------------------------------------------
#  Structured Question Schema
# ------------------------------------------------------------------
question_schema = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question_text": {
                        "type": "string",
                        "description": "The full text of the question"
                    },
                    "options": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Array of answer options (for multiple choice questions)",
                        "default": []
                    },
                    "answer": {
                        "type": "string",
                        "description": "The correct answer to the question"
                    },
                    "question_type": {
                        "type": "string",
                        "description": "Type of question: 'multiple_choice', 'true_false', 'short_answer', or 'essay'",
                        "enum": ["multiple_choice", "true_false", "short_answer", "essay"]
                    },
                    "public_text": {
                        "type": "string",
                        "description": "Public-facing version of the question (without answer)",
                        "default": ""
                    }
                },
                "required": ["question_text", "answer", "question_type"]
            }
        }
    },
    "required": ["questions"]
}


class QuestionExtractor:
    def __init__(self, mongodb_uri=None, database_name=None):
        self.extractor = DocumentExtractor()
        
        # MongoDB connection
        mongo_uri = mongodb_uri or os.getenv("MONGO_URL", "mongodb://localhost:27017/")
        db_name = database_name or os.getenv("DATABASE_NAME", "learners_db")
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.questions_collection = self.db["questions"]
        
        print(f"Connected to MongoDB: {mongo_uri}")
        print(f"Using database: {db_name}")

    def extract(self, document_path):
        """
        Extract questions from a PDF document.
        Returns a list of question dictionaries.
        """
        try:
            result = self.extractor.extract(document_path)
            structured_data = result.extract_data(json_schema=question_schema)

            # Handle different output formats from docstrange
            text_to_parse = None
            
            if isinstance(structured_data, dict):
                # Check if it's a wrapped response with raw_content
                if 'document' in structured_data and 'raw_content' in structured_data['document']:
                    text_to_parse = structured_data['document']['raw_content']
                else:
                    # It's already a proper dict, return it
                    return structured_data.get("questions", [])
            elif isinstance(structured_data, str):
                text_to_parse = structured_data
            else:
                # Unknown format, convert to string for parsing attempt
                text_to_parse = json.dumps(structured_data)
            
            # If we have text to parse, try multi-object JSON parser
            if text_to_parse:
                try:
                    # First try standard JSON parsing
                    parsed_data = json.loads(text_to_parse)
                    return parsed_data.get("questions", [])
                except json.JSONDecodeError:
                    # If standard parsing fails, use multi-object parser
                    print("Standard JSON parsing failed, attempting multi-page parser...")
                    try:
                        parsed_data = parse_multi_object_json(text_to_parse)
                        return parsed_data.get("questions", [])
                    except Exception as e:
                        print(f"Multi-page JSON parsing error: {e}")
                        return []

            return []

        except FileNotFoundError:
            print(f"Error: Document not found at '{document_path}'.")
            return []
        except Exception as e:
            print(f"An error occurred during extraction: {e}")
            import traceback
            traceback.print_exc()
            return []

    def upload_to_mongodb(self, questions, department, material_id=None, created_by="admin"):
        """
        Upload extracted questions to MongoDB.
        
        Args:
            questions: List of question dictionaries
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

    def extract_and_upload(self, document_path, department, material_id=None, created_by="admin"):
        """
        Extract questions from PDF and upload directly to MongoDB.
        
        Args:
            document_path: Path to the PDF file
            department: Department/subject for these questions
            material_id: Optional material ID to link questions to
            created_by: User ID who created these questions
        
        Returns:
            Dict with extraction results and upload count
        """
        print(f"\n{'='*60}")
        print(f"Processing: {document_path}")
        print(f"Department: {department}")
        print(f"{'='*60}\n")
        
        # Extract questions
        questions = self.extract(document_path)
        
        if not questions:
            print("No questions extracted from document")
            return {
                "document": document_path,
                "extracted_count": 0,
                "uploaded_count": 0,
                "success": False
            }
        
        print(f"\nExtracted {len(questions)} questions from document")
        
        # Upload to MongoDB
        uploaded_count = self.upload_to_mongodb(
            questions=questions,
            department=department,
            material_id=material_id,
            created_by=created_by
        )
        
        return {
            "document": document_path,
            "extracted_count": len(questions),
            "uploaded_count": uploaded_count,
            "success": uploaded_count > 0
        }


# -------------------------- Example usage --------------------------
if __name__ == "__main__":
    # Map PDF files to departments
    pdf_department_map = {
        "97_phys.pdf": "Physics",
        "biolset2.pdf": "Biology",
        "chemistry-6-53.pdf": "Chemistry",
        "chemistry.pdf": "Chemistry",
        "CS_Questions.pdf": "Computer Science",
        "geography.pdf": "Geography"
    }
    
    data_folder = "./data"
    extractor = QuestionExtractor()
    
    results = []
    
    # Process each PDF
    for pdf_file, department in pdf_department_map.items():
        document_path = os.path.join(data_folder, pdf_file)
        
        if not os.path.exists(document_path):
            print(f"Warning: File not found - {document_path}")
            continue
        
        result = extractor.extract_and_upload(
            document_path=document_path,
            department=department,
            created_by="system"
        )
        
        results.append(result)
    
    # Print summary
    print(f"\n{'='*60}")
    print("EXTRACTION SUMMARY")
    print(f"{'='*60}\n")
    
    total_extracted = sum(r["extracted_count"] for r in results)
    total_uploaded = sum(r["uploaded_count"] for r in results)
    
    for result in results:
        status = "✓" if result["success"] else "✗"
        print(f"{status} {os.path.basename(result['document'])}: "
              f"Extracted {result['extracted_count']}, "
              f"Uploaded {result['uploaded_count']}")
    
    print(f"\nTotal Questions Extracted: {total_extracted}")
    print(f"Total Questions Uploaded: {total_uploaded}")
    print(f"Success Rate: {len([r for r in results if r['success']])}/{len(results)}")
