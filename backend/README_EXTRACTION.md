# Question Extraction from PDFs

This module extracts structured questions from PDF documents and uploads them to MongoDB.

## Overview

The `question_extractor.py` script uses the `docstrange` library to extract questions from PDFs in the `data/` folder and automatically uploads them to the MongoDB `quiz_db.questions` collection.

## Features

- ✅ Multi-page PDF support
- ✅ Automatic department mapping
- ✅ MongoDB integration
- ✅ Question deduplication
- ✅ Multiple question types (multiple choice, true/false, short answer, essay)
- ✅ Batch processing of multiple PDFs

## Question Schema

Each question extracted follows this structure:

```python
{
    "question_id": str,           # UUID
    "question_text": str,         # The question
    "options": List[str],         # Answer options (for multiple choice)
    "answer": str,                # Correct answer
    "department": str,            # Department/subject
    "question_type": str,         # Type of question
    "public_text": str,           # Public-facing text
    "material_id": Optional[str], # Link to material
    "created_by": str,            # Creator ID
    "created_at": datetime        # Creation timestamp
}
```

## Available PDFs

The script automatically processes these PDFs from the `data/` folder:

| PDF File | Department |
|----------|------------|
| `97_phys.pdf` | Physics |
| `biolset2.pdf` | Biology |
| `chemistry-6-53.pdf` | Chemistry |
| `chemistry.pdf` | Chemistry |
| `CS_Questions.pdf` | Computer Science |
| `geography.pdf` | Geography |

## Usage

### 1. Make sure MongoDB is running

The script connects to MongoDB using the `MONGODB_URI` environment variable or defaults to `mongodb://localhost:27017/`.

### 2. Run the extraction script

```powershell
python backend\question_extractor.py
```

### 3. View results

The script will:
- Extract questions from each PDF
- Display progress for each file
- Upload questions to MongoDB
- Show a summary with statistics

Example output:
```
============================================================
Processing: ./data/97_phys.pdf
Department: Physics
============================================================

Extracted 25 questions from document
Successfully uploaded 25 questions to MongoDB

============================================================
EXTRACTION SUMMARY
============================================================

✓ 97_phys.pdf: Extracted 25, Uploaded 25
✓ biolset2.pdf: Extracted 30, Uploaded 30
✓ chemistry.pdf: Extracted 20, Uploaded 20
...

Total Questions Extracted: 150
Total Questions Uploaded: 150
Success Rate: 6/6
```

## Class: QuestionExtractor

### Methods

#### `__init__(mongodb_uri=None)`
Initialize the extractor with optional MongoDB connection string.

#### `extract(document_path) -> List[dict]`
Extract questions from a PDF document.

**Parameters:**
- `document_path`: Path to the PDF file

**Returns:**
- List of question dictionaries

#### `upload_to_mongodb(questions, department, material_id=None, created_by="admin") -> int`
Upload extracted questions to MongoDB.

**Parameters:**
- `questions`: List of question dictionaries
- `department`: Department/subject for the questions
- `material_id`: Optional material ID to link questions
- `created_by`: User ID who created the questions

**Returns:**
- Number of questions successfully uploaded

#### `extract_and_upload(document_path, department, material_id=None, created_by="admin") -> dict`
Combined extraction and upload in one call.

**Returns:**
- Dictionary with extraction results:
  ```python
  {
      "document": str,
      "extracted_count": int,
      "uploaded_count": int,
      "success": bool
  }
  ```

## Custom Usage

You can also use the extractor programmatically:

```python
from question_extractor import QuestionExtractor

# Initialize
extractor = QuestionExtractor()

# Extract from a single PDF
questions = extractor.extract("./data/custom_questions.pdf")

# Upload to MongoDB
count = extractor.upload_to_mongodb(
    questions=questions,
    department="Mathematics",
    created_by="admin_user_id"
)

print(f"Uploaded {count} questions")

# Or do both in one call
result = extractor.extract_and_upload(
    document_path="./data/custom_questions.pdf",
    department="Mathematics",
    created_by="admin_user_id"
)
```

## Viewing Questions in Web App

After extraction, questions are immediately available in the web application:

1. **Students**: Questions appear in the Quiz page based on their department
2. **Admins**: Can view all questions in Admin Dashboard → Questions tab

The questions tab shows:
- Total questions by department
- Question type breakdown
- Full question list with edit/delete options

## Troubleshooting

### No questions extracted
- Ensure the PDF contains properly formatted questions
- Check that the PDF is readable and not corrupted
- Verify the docstrange library is installed: `pip install docstrange`

### MongoDB connection error
- Verify MongoDB is running
- Check the `MONGODB_URI` in your `.env` file
- Ensure you have write permissions to the database

### Questions not appearing in web app
- Verify the department name matches user departments
- Check that questions were actually inserted (use MongoDB Compass or shell)
- Ensure the backend API is running

## Dependencies

```txt
docstrange
pymongo
python-dotenv
```

Install all dependencies:
```powershell
pip install docstrange pymongo python-dotenv
```

## Notes

- Questions are deduplicated by `question_text` during multi-page parsing
- The script handles various question formats automatically
- Each question gets a unique UUID as `question_id`
- Failed extractions are logged but don't stop the batch process
