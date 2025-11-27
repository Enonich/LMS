# Extract Questions from PDFs - Quick Guide

## Current Status
You currently have only 3 sample questions per department (18 total).

## Available PDFs in data/ folder:
- `97_phys.pdf` → Physics
- `biolset2.pdf` → Biology
- `chemistry-6-53.pdf` → Chemistry
- `chemistry.pdf` → Chemistry
- `CS_Questions.pdf` → Computer Science
- `geography.pdf` → Geography

## To Extract ALL Questions:

### Step 1: Run the extraction script
```powershell
python backend\question_extractor.py
```

This will:
- Process all PDFs in the `data/` folder
- Extract all questions from each PDF
- Automatically map them to the correct departments
- Upload them to MongoDB
- Show you a progress report

### Expected Output:
```
============================================================
Processing: ./data/97_phys.pdf
Department: Physics
============================================================

Extracted X questions from document
Successfully uploaded X questions to MongoDB

[... repeats for each PDF ...]

============================================================
EXTRACTION SUMMARY
============================================================

✓ 97_phys.pdf: Extracted X, Uploaded X
✓ biolset2.pdf: Extracted X, Uploaded X
✓ chemistry.pdf: Extracted X, Uploaded X
...

Total Questions Extracted: XXX
Total Questions Uploaded: XXX
Success Rate: 6/6
```

### Step 2: Verify extraction
```powershell
python backend\verify_questions.py
```

This will show you:
- Total questions in database
- Questions per department
- Sample questions

### Step 3: Use in the app
- Login to your web app
- Go to Quiz page
- You'll now have access to ALL questions from the PDFs!

## Note:
The extraction uses AI (docstrange) to intelligently extract:
- Question text
- Multiple choice options
- Correct answers
- Question types

The more questions in your PDFs, the more variety you'll have in the quiz!
