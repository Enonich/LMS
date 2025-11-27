# ✅ Questions Loading - Complete Setup Guide

## Current Status

✨ **18 sample questions** have been seeded into the database:
- Biology: 3 questions
- Chemistry: 3 questions
- Computer Science: 3 questions
- Geography: 3 questions
- Mathematics: 3 questions
- Physics: 3 questions

## How Questions Load in the Web App

### Backend Flow:
1. **API Endpoint**: `/api/questions/daily`
2. **Service**: `QuizService.get_daily_question()`
3. **Database**: Queries MongoDB `learners_db.questions` collection
4. **Filtering**: 
   - Regular users: Get questions from their department only
   - Admin users: Get questions from all departments
5. **Selection**: Randomly picks one question from available questions

### Frontend Flow:
1. **Component**: `QuizPage.jsx`
2. **API Call**: `GET /api/questions/daily` with auth token
3. **Display**: Shows question with options or text input
4. **Submit**: `POST /api/questions/answer` to check answer
5. **Feedback**: Shows if correct/incorrect with AI explanation

## Testing the Implementation

### Step 1: Verify Questions in Database
```powershell
python backend\verify_questions.py
```
Expected output:
```
✅ MongoDB connection successful
📊 Total Questions: 18
📚 Questions by Department:
   • Biology: 3 questions
   • Chemistry: 3 questions
   ...
```

### Step 2: Start the Backend Server
```powershell
python start.py
```
This will:
- Check if all dependencies are installed
- Verify MongoDB is running
- Check if Ollama is available (for AI explanations)
- Start the server at http://127.0.0.1:8000

### Step 3: Access the Web App
1. Open browser: `http://127.0.0.1:8000`
2. Login with your credentials
3. Navigate to the **Quiz** page

### Step 4: Test Question Loading

**Expected Behavior:**
- Loading spinner appears briefly
- A question from your department displays
- Multiple choice shows options A, B, C, D
- Text input shows for short answer questions
- Submit button is enabled when you select/type an answer

**Debug Console Logs:**
Open browser DevTools (F12) → Console tab to see:
```
Fetching question from: http://127.0.0.1:8000/api/questions/daily
Question loaded: {question_id: "...", question_text: "...", ...}
```

## Troubleshooting

### ❌ "No questions available for your department"

**Cause**: Your user's department doesn't match question departments

**Solution**:
```powershell
# Option 1: Add questions for your department
python backend\seed_sample_questions.py

# Option 2: Update your user's department in MongoDB
# Use MongoDB Compass to edit user document
```

### ❌ "Loading..." never completes

**Possible causes**:
1. Backend server not running → Check terminal
2. MongoDB not running → Run `mongod`
3. CORS issue → Check browser console for errors
4. Auth token expired → Logout and login again

**Fix**:
```powershell
# Check if backend is running
# Should see: INFO: Application startup complete

# Test API directly
curl http://127.0.0.1:8000/api/health
# Should return: {"status":"healthy"}
```

### ❌ Backend won't start - "Missing required package"

**Solution**:
```powershell
# Install all requirements
pip install -r requirements.txt

# Or install individually
pip install fastapi uvicorn pymongo sentence-transformers
```

### ❌ "MongoDB connection failed"

**Solution**:
```powershell
# Start MongoDB
mongod

# Or if using Windows service
net start MongoDB
```

## Question Format in Database

Each question document has this structure:
```json
{
  "question_id": "uuid",
  "question_text": "What is the speed of light?",
  "options": ["3 × 10^8 m/s", "3 × 10^6 m/s", ...],
  "answer": "3 × 10^8 m/s",
  "department": "Physics",
  "question_type": "multiple_choice",
  "material_id": null,
  "public_text": "What is the speed of light?",
  "created_by": "system",
  "created_at": "2025-11-19T..."
}
```

## Adding More Questions

### Method 1: Extract from PDFs
```powershell
# Extract questions from all PDFs in data/ folder
python backend\question_extractor.py
```

### Method 2: Manual Creation (Admin)
1. Login as admin
2. Go to Admin Dashboard → Questions tab
3. Fill the "Create New Question" form
4. Click "Create Question"

### Method 3: Bulk Upload via API
```python
import requests

questions = [
    {
        "question_text": "Your question here?",
        "options": ["A", "B", "C", "D"],
        "answer": "A",
        "department": "Physics",
        "question_type": "multiple_choice"
    }
]

response = requests.post(
    "http://127.0.0.1:8000/api/admin/questions/bulk-upload",
    json=questions,
    headers={"Authorization": f"Bearer {token}"}
)
```

## Verification Checklist

Before reporting issues, verify:

- [ ] MongoDB is running (`mongod` or service)
- [ ] Questions exist in database (run `verify_questions.py`)
- [ ] Backend server is running (`python start.py`)
- [ ] Frontend is built (`npm run build` in frontend-react/)
- [ ] User is logged in with valid token
- [ ] User's department matches question departments
- [ ] Browser console shows no CORS errors
- [ ] API endpoint responds (`/api/questions/daily`)

## Expected User Experience

### For Students:
1. Login with credentials
2. Click "Quiz" in navigation
3. See stats cards (Total Quizzes, Correct Answers, Accuracy, Streak)
4. Question loads automatically from their department
5. Select/type answer
6. Click "Submit Answer"
7. See result (correct/incorrect) with AI explanation
8. Click "Next Question" for another question

### For Admins:
- Can see questions from ALL departments
- Can manage questions in Admin Dashboard
- Can view all users and their progress
- Can create quiz schedules

## Files Modified for Question Loading

1. `src/services/quiz_service.py` - Fetches questions from MongoDB
2. `src/api/quiz.py` - API endpoints for questions
3. `frontend-react/src/pages/QuizPage.jsx` - UI for displaying questions
4. `backend/question_extractor.py` - Extract questions from PDFs
5. `backend/seed_sample_questions.py` - Add sample questions
6. `backend/verify_questions.py` - Verify database setup

## Success Indicators

✅ Questions load instantly on Quiz page
✅ Options display correctly for multiple choice
✅ Text input appears for short answer
✅ Submit button works
✅ Correct/incorrect feedback shows
✅ AI explanation displays
✅ Stats update after each question
✅ History tracks previous attempts
✅ Next question button loads new question

---

**Your database now has 18 questions ready to be displayed!**

Next steps:
1. Start the backend: `python start.py`
2. Open browser: `http://127.0.0.1:8000`
3. Login and go to Quiz page
4. Questions should load automatically! 🎉
