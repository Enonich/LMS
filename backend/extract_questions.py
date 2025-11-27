"""
Question Extraction Module
Extracts questions from PDF documents using PyPDF2 and Pydantic for validation
Supports multiple question formats with auto-detection
"""
import PyPDF2
import re
from pydantic import BaseModel, Field
from typing import List, Literal


# Pydantic models for structured extraction and validation
class Question(BaseModel):
    """Single question model with validation"""
    question_text: str = Field(description="The full text of the question")
    options: List[str] = Field(default=[], description="List of answer options for multiple choice")
    answer: str = Field(description="The correct answer")
    question_type: Literal["MCQ", "true_false", "short_answer", "essay"] = Field(
        description="Type of question"
    )
    
    @property
    def public_text(self) -> str:
        """
        Return public-facing question text with options formatted.
        For MCQ: includes question + formatted options
        For others: just the question text
        """
        if self.options and len(self.options) > 0:
            # Format: "Question text Options: a) option1, b) option2, c) option3"
            options_str = ", ".join(self.options)
            return f"{self.question_text} Options: {options_str}"
        else:
            return self.question_text


class QuestionList(BaseModel):
    """List of questions with validation"""
    questions: List[Question] = Field(description="All questions found in the document")


class QuestionExtractor:
    """Extract questions from PDF documents - auto-detects format"""
    
    def __init__(self):
        """Initialize extractor"""
        pass

    def _extract_text_from_pdf(self, pdf_path):
        """Extract all text from PDF"""
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    
    def _parse_science_bowl_format(self, text):
        """Parse Science Bowl format (PHYS-XX; with wxyz options)"""
        questions = []
        
        # Split by question ID pattern (PHYS-XX;, CHEM-XX;, MATH-XX;, etc.)
        parts = re.split(r'([A-Z]+-\d+;)', text)
        
        for i in range(1, len(parts)-1, 2):
            try:
                question_id = parts[i].strip()
                content = parts[i+1]
                
                # Skip if no ANSWER
                if 'ANSWER:' not in content.upper():
                    continue
                
                # Split by ANSWER to separate question from answer
                split_by_answer = re.split(r'\nANSWER:\s*', content, flags=re.IGNORECASE, maxsplit=1)
                if len(split_by_answer) < 2:
                    continue
                
                question_part = split_by_answer[0].strip()
                answer_part = split_by_answer[1].split('\n')[0].strip()
                
                # Determine question type
                if 'Multiple Choice:' in question_part:
                    question_type = 'MCQ'
                    question_text = question_part.split('Multiple Choice:', 1)[1].strip()
                    
                    # Find where options start
                    option_section_match = re.search(r'w\)', question_text, re.IGNORECASE)
                    if option_section_match:
                        # Split question and options
                        q_text = question_text[:option_section_match.start()].strip()
                        options_text = question_text[option_section_match.start():].strip()
                        
                        # Split by letter) to extract all options properly
                        option_parts = re.split(r'([wxyz]\))', options_text, flags=re.IGNORECASE)
                        
                        # Extract option texts WITH letter prefix (every other part after a letter))
                        options = []
                        for j in range(1, len(option_parts), 2):
                            if j + 1 < len(option_parts):
                                letter_prefix = option_parts[j].strip()  # e.g., "w)"
                                option_text = option_parts[j + 1].strip()
                                # Clean up extra spaces and newlines
                                option_text = ' '.join(option_text.split())
                                if option_text:
                                    options.append(f"{letter_prefix} {option_text}")
                        
                        question_text = q_text
                    else:
                        options = []
                    
                elif 'Short Answer:' in question_part:
                    question_type = 'short_answer'
                    question_text = question_part.split('Short Answer:', 1)[1].strip()
                    options = []
                    
                elif 'True/False:' in question_part or 'True or False:' in question_part:
                    question_type = 'true_false'
                    if 'True/False:' in question_part:
                        question_text = question_part.split('True/False:', 1)[1].strip()
                    else:
                        question_text = question_part.split('True or False:', 1)[1].strip()
                    options = ['True', 'False']
                else:
                    # Default to short answer
                    question_type = 'short_answer'
                    question_text = question_part
                    options = []
                
                # Clean answer but keep letter prefix format like "w) answer"
                answer_match = re.match(r'^([WXYZ])\s*--\s*(.+)', answer_part, flags=re.IGNORECASE)
                if answer_match:
                    letter = answer_match.group(1).lower()
                    answer_text = answer_match.group(2).strip()
                    answer = f"{letter}) {answer_text}"
                else:
                    answer = answer_part.strip()
                
                # Create Pydantic model for validation
                q = Question(
                    question_text=question_text,
                    options=options,
                    answer=answer,
                    question_type=question_type
                )
                questions.append(q)
                
            except Exception as e:
                # Skip problematic questions
                continue
        
        return questions
    
    def _parse_numbered_format(self, text):
        """Parse numbered format (1. 2. 3. with abcd options)"""
        questions = []
        
        # Split by numbered questions
        parts = re.split(r'\n(\d+)\.\s+Multiple Choice:', text)
        
        for i in range(1, len(parts)-1, 2):
            try:
                content = parts[i+1]
                
                if 'ANSWER:' not in content.upper():
                    continue
                
                split_by_answer = re.split(r'\nANSWER:\s*', content, flags=re.IGNORECASE, maxsplit=1)
                if len(split_by_answer) < 2:
                    continue
                
                question_part = split_by_answer[0].strip()
                answer_part = split_by_answer[1].split('\n')[0].strip()
                
                # Find options (a) b) c) d))
                option_match = re.search(r'\n\s*a\)', question_part, re.IGNORECASE)
                if option_match:
                    q_text = question_part[:option_match.start()].strip()
                    
                    # Remove trailing "Is it:" or similar phrases from question
                    q_text = re.sub(r'\s*[Ii]s\s+it\s*[:\?]?\s*$', '', q_text).strip()
                    
                    options_text = question_part[option_match.start():].strip()
                    
                    # Extract options WITH letter prefix
                    option_parts = re.split(r'([abcd]\))', options_text, flags=re.IGNORECASE)
                    options = []
                    for j in range(1, len(option_parts), 2):
                        if j + 1 < len(option_parts):
                            letter_prefix = option_parts[j].strip()  # e.g., "a)"
                            option_text = ' '.join(option_parts[j + 1].strip().split())
                            if option_text:
                                options.append(f"{letter_prefix} {option_text}")
                    question_text = q_text
                else:
                    question_text = question_part
                    options = []
                
                # Clean answer but keep letter prefix format like "b) answer"
                answer_match = re.match(r'^([ABCD])\s*[-–—]\s*(.+)', answer_part, flags=re.IGNORECASE)
                if answer_match:
                    letter = answer_match.group(1).lower()
                    answer_text = answer_match.group(2).strip()
                    # Remove any leading dash/hyphen from the answer text
                    answer_text = re.sub(r'^[-–—]\s*', '', answer_text).strip()
                    answer = f"{letter}) {answer_text}"
                else:
                    answer = answer_part.strip()
                
                # Create Pydantic model
                q = Question(
                    question_text=question_text,
                    options=options,
                    answer=answer,
                    question_type='MCQ'
                )
                questions.append(q)
                
            except Exception as e:
                continue
        
        return questions

    def extract(self, document_path):
        """
        Extract questions from a PDF document - auto-detects format.
        
        Args:
            document_path: Path to the PDF file
        
        Returns:
            List of question dictionaries with structure:
            [
                {
                    "question_text": str,
                    "options": List[str],
                    "answer": str,
                    "question_type": str,
                    "public_text": str
                },
                ...
            ]
        """
        try:
            # Extract text from PDF
            pdf_text = self._extract_text_from_pdf(document_path)
            
            if not pdf_text or len(pdf_text) < 100:
                print(f"Error: PDF appears to be empty or text extraction failed")
                return []
            
            # Try Science Bowl format first
            questions = self._parse_science_bowl_format(pdf_text)
            if len(questions) > 0:
                print(f"✓ Detected Science Bowl format - extracted {len(questions)} questions")
                # Convert Pydantic models to dicts
                return [
                    {
                        'question_text': q.question_text,
                        'options': q.options,
                        'answer': q.answer,
                        'question_type': q.question_type,
                        'public_text': q.public_text
                    }
                    for q in questions
                ]
            
            # Try numbered format
            questions = self._parse_numbered_format(pdf_text)
            if len(questions) > 0:
                print(f"✓ Detected numbered format - extracted {len(questions)} questions")
                # Convert Pydantic models to dicts
                return [
                    {
                        'question_text': q.question_text,
                        'options': q.options,
                        'answer': q.answer,
                        'question_type': q.question_type,
                        'public_text': q.public_text
                    }
                    for q in questions
                ]
            
            print("❌ No questions found - format not recognized")
            return []

        except FileNotFoundError:
            print(f"Error: Document not found at '{document_path}'.")
            return []
        except Exception as e:
            print(f"An error occurred during extraction: {e}")
            import traceback
            traceback.print_exc()
            return []


    def extract_and_upload(self, document_path, department, material_id=None, created_by="admin", 
                          mongodb_uri=None, database_name=None):
        """
        Extract questions from PDF and upload to MongoDB in one operation.
        
        Args:
            document_path: Path to the PDF file
            department: Department/subject for these questions (e.g., "Physics", "Biology")
            material_id: Optional material ID to link questions to
            created_by: User ID who created these questions
            mongodb_uri: MongoDB connection string (defaults to env MONGO_URL)
            database_name: Database name (defaults to env DATABASE_NAME)
        
        Returns:
            Tuple of (extracted_count, uploaded_count)
        """
        # Extract questions
        questions = self.extract(document_path)
        
        if not questions:
            return (0, 0)
        
        # Upload to MongoDB
        from upload_questions import QuestionUploader
        
        uploader = QuestionUploader(mongodb_uri=mongodb_uri, database_name=database_name)
        uploaded_count = uploader.upload(
            questions=questions,
            department=department,
            material_id=material_id,
            created_by=created_by
        )
        uploader.close()
        
        return (len(questions), uploaded_count)


# -------------------------- Example usage --------------------------
if __name__ == "__main__":
    import os
    import sys
    
    # Check command line arguments
    if len(sys.argv) > 1 and sys.argv[1] == '--upload':
        # Upload mode: extract and upload to MongoDB
        document_path = './../data/biolset2.pdf'
        department = "Biology"  # Change as needed
        
        if not os.path.exists(document_path):
            print(f"Error: File not found - {document_path}")
            sys.exit(1)
        
        print(f"\n{'='*60}")
        print("EXTRACT AND UPLOAD MODE")
        print(f"{'='*60}\n")
        
        extractor = QuestionExtractor()
        extracted, uploaded = extractor.extract_and_upload(
            document_path=document_path,
            department=department,
            created_by="admin"
        )
        
        print(f"\n{'='*60}")
        print("UPLOAD COMPLETE")
        print(f"{'='*60}")
        print(f"Extracted: {extracted} questions")
        print(f"Uploaded:  {uploaded} questions")
        print(f"{'='*60}\n")
        
    else:
        # Extract-only mode (default)
        document_path = './../data/biolset2.pdf'
        
        if not os.path.exists(document_path):
            print(f"Error: File not found - {document_path}")
        else:
            extractor = QuestionExtractor()
            questions = extractor.extract(document_path)
            
            print(f"\n{'='*60}")
            print("EXTRACTION RESULTS")
            print(f"{'='*60}\n")
            print(f"Extracted {len(questions)} questions\n")
            
            # Display first 3 questions as examples
            for i, q in enumerate(questions[:3], 1):
                print(f"{i}. {q['question_text']}")
                print(f"   Type: {q['question_type']}")
                print(f"   Answer: {q['answer']}")
                if q.get('options'):
                    print(f"   Options: {q['options']}")
                print()
            
            if len(questions) > 3:
                print(f"... and {len(questions) - 3} more questions")
            
            print(f"\n💡 To upload to MongoDB, run:")
            print(f"   python extract_questions.py --upload")
