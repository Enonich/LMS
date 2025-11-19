import os
os.environ["USE_TF"] = "0"
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Form

# Load environment variables
load_dotenv()
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, validator
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer, util
from passlib.context import CryptContext
from datetime import datetime, time, timedelta
import jwt
import random
import uuid
from typing import List, Optional, Dict, Any
import shutil
import json
from pathlib import Path
from llm_response import QuizExplainer, LearningVerifier
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    scheduler.start()
    yield
    # Shutdown
    scheduler.shutdown()

# FastAPI setup
app = FastAPI(title="Learners Management System", version="2.0.0", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# MongoDB setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URL)
db = client["learners_db"]

# Collections
users_collection = db["users"]
questions_collection = db["questions"]
materials_collection = db["materials"]
progress_collection = db["progress"]
schedules_collection = db["schedules"]

# SentenceTransformer setup
embedder = SentenceTransformer('all-mpnet-base-v2')
SIMILARITY_THRESHOLD = 0.8

# LLM components
quiz_explainer = QuizExplainer()
learning_verifier = LearningVerifier()

# Scheduler for daily questions
scheduler = AsyncIOScheduler()

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    department: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    full_name: str
    department: str
    enrolled_materials: List[str] = []
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class QuestionResponse(BaseModel):
    question_id: str
    question_text: str
    options: List[str] = []
    department: str
    question_type: str
    material_id: Optional[str] = None

class AnswerRequest(BaseModel):
    question_id: str
    user_answer: str

class MaterialCreate(BaseModel):
    title: str
    description: str
    department: str
    content_type: str  # "pdf", "text", "video", etc.

class Material(BaseModel):
    id: str
    title: str
    description: str
    department: str
    content_type: str
    file_path: Optional[str] = None
    content: Optional[str] = None
    uploaded_by: str
    uploaded_at: datetime

class ProgressUpdate(BaseModel):
    material_id: str
    progress_percentage: float
    completed_sections: List[str] = []

class ScheduleCreate(BaseModel):
    user_id: str
    question_time: str  # HH:MM format
    days_of_week: List[int] = []  # 0-6, Monday=0

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = users_collection.find_one({"_id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Authentication endpoints
@app.post("/auth/register", response_model=User)
async def register(user: UserCreate):
    # Check if user exists
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    user_doc = {
        "_id": user_id,
        "email": user.email,
        "password": hashed_password,
        "full_name": user.full_name,
        "department": user.department,
        "enrolled_materials": [],
        "created_at": datetime.utcnow()
    }
    
    users_collection.insert_one(user_doc)
    return User(**user_doc)

@app.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = users_collection.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["_id"]}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")

# User profile endpoints
@app.get("/users/me", response_model=User)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@app.put("/users/me/materials/{material_id}/enroll")
async def enroll_in_material(material_id: str, current_user: User = Depends(get_current_user)):
    material = materials_collection.find_one({"_id": material_id})
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    if material_id not in current_user.enrolled_materials:
        users_collection.update_one(
            {"_id": current_user.id},
            {"$push": {"enrolled_materials": material_id}}
        )
        # Initialize progress
        progress_collection.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "material_id": material_id,
            "progress_percentage": 0.0,
            "completed_sections": [],
            "started_at": datetime.utcnow(),
            "last_updated": datetime.utcnow()
        })
    
    return {"message": "Successfully enrolled in material"}

# Material management endpoints
@app.post("/materials", response_model=Material)
async def upload_material(
    title: str = Form(...),
    description: str = Form(...),
    department: str = Form(...),
    content_type: str = Form(...),
    file: Optional[UploadFile] = File(None),
    content: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    material_id = str(uuid.uuid4())
    file_path = None
    
    if file:
        # Save uploaded file
        upload_dir = Path("uploads/materials")
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = upload_dir / f"{material_id}_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    
    material_doc = {
        "_id": material_id,
        "title": title,
        "description": description,
        "department": department,
        "content_type": content_type,
        "file_path": str(file_path) if file_path else None,
        "content": content,
        "uploaded_by": current_user.id,
        "uploaded_at": datetime.utcnow()
    }
    
    materials_collection.insert_one(material_doc)
    return Material(**material_doc)

@app.get("/materials", response_model=List[Material])
async def get_materials(department: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if department:
        query["department"] = department
    
    materials = list(materials_collection.find(query))
    return [Material(**mat) for mat in materials]

@app.get("/materials/enrolled", response_model=List[Material])
async def get_enrolled_materials(current_user: User = Depends(get_current_user)):
    if not current_user.enrolled_materials:
        return []
    
    materials = list(materials_collection.find({"_id": {"$in": current_user.enrolled_materials}}))
    return [Material(**mat) for mat in materials]

# Progress tracking endpoints
@app.get("/progress/{material_id}")
async def get_progress(material_id: str, current_user: User = Depends(get_current_user)):
    progress = progress_collection.find_one({"user_id": current_user.id, "material_id": material_id})
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")
    return progress

@app.put("/progress/{material_id}")
async def update_progress(material_id: str, progress_update: ProgressUpdate, current_user: User = Depends(get_current_user)):
    result = progress_collection.update_one(
        {"user_id": current_user.id, "material_id": material_id},
        {
            "$set": {
                "progress_percentage": progress_update.progress_percentage,
                "completed_sections": progress_update.completed_sections,
                "last_updated": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Progress record not found")
    
    return {"message": "Progress updated successfully"}

# Learning verification endpoint
@app.post("/materials/{material_id}/verify-learning")
async def verify_learning(material_id: str, current_user: User = Depends(get_current_user)):
    material = materials_collection.find_one({"_id": material_id})
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    # Get user's progress
    progress = progress_collection.find_one({"user_id": current_user.id, "material_id": material_id})
    if not progress or progress["progress_percentage"] < 80:
        raise HTTPException(status_code=400, detail="Complete at least 80% of the material before verification")
    
    # Generate verification questions based on material content
    verification_result = learning_verifier.verify_understanding(material, current_user.id)
    
    return verification_result

# Quiz endpoints (enhanced)
@app.get("/questions/daily", response_model=QuestionResponse)
async def get_daily_question(current_user: User = Depends(get_current_user)):
    # Get questions for user's department and enrolled materials
    query = {"department": current_user.department}
    if current_user.enrolled_materials:
        query["$or"] = [
            {"material_id": {"$in": current_user.enrolled_materials}},
            {"material_id": {"$exists": False}}
        ]
    
    questions = list(questions_collection.find(query))
    if not questions:
        raise HTTPException(status_code=404, detail="No questions available for your department")
    
    q = random.choice(questions)
    return QuestionResponse(
        question_id=q["question_id"],
        question_text=q["question_text"],
        options=q.get("options", []),
        department=q["department"],
        question_type=q["question_type"],
        material_id=q.get("material_id")
    )

@app.post("/questions/answer")
async def check_answer(req: AnswerRequest, current_user: User = Depends(get_current_user)):
    q = questions_collection.find_one({"question_id": req.question_id})
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
        
    # Check the user's answer for correctness
    correct = False
    if q["question_type"].lower().startswith("fill"):
        correct_answers = [a.strip() for a in q["answer"].replace(' or ', ',').split(',')]
        user_emb = embedder.encode(req.user_answer, convert_to_tensor=True)
        for ans in correct_answers:
            ans_emb = embedder.encode(ans, convert_to_tensor=True)
            sim = float(util.pytorch_cos_sim(user_emb, ans_emb))
            if sim >= SIMILARITY_THRESHOLD:
                correct = True
                break
    else:
        correct = req.user_answer.strip().lower() == q["answer"].strip().lower()

    # Get explanation from the QuizExplainer
    explanation_result = quiz_explainer.explain_answer(q["public_text"], req.user_answer, q["answer"])
    
    # Record answer in progress if it's from a material
    if q.get("material_id"):
        progress_collection.update_one(
            {"user_id": current_user.id, "material_id": q["material_id"]},
            {
                "$inc": {"questions_answered": 1, "correct_answers": 1 if correct else 0},
                "$set": {"last_updated": datetime.utcnow()}
            },
            upsert=True
        )
    
    return {
        "correct": correct,
        "correct_answer": q["answer"],
        "explanation": explanation_result.get("explanation", "No explanation available.")
    }

# Scheduling endpoints
@app.post("/schedule")
async def create_schedule(schedule: ScheduleCreate, current_user: User = Depends(get_current_user)):
    if current_user.id != schedule.user_id:
        raise HTTPException(status_code=403, detail="Cannot create schedule for other users")
    
    schedule_doc = {
        "_id": str(uuid.uuid4()),
        "user_id": schedule.user_id,
        "question_time": schedule.question_time,
        "days_of_week": schedule.days_of_week,
        "created_at": datetime.utcnow()
    }
    
    schedules_collection.insert_one(schedule_doc)
    
    # Schedule the job
    await schedule_daily_questions(schedule.user_id, schedule.question_time, schedule.days_of_week)
    
    return {"message": "Schedule created successfully"}

async def schedule_daily_questions(user_id: str, question_time: str, days_of_week: List[int]):
    hour, minute = map(int, question_time.split(':'))
    
    # Remove existing jobs for this user
    scheduler.remove_job(f"daily_question_{user_id}")
    
    # Add new job
    if days_of_week:
        trigger = CronTrigger(day_of_week=','.join(map(str, days_of_week)), hour=hour, minute=minute)
    else:
        trigger = CronTrigger(hour=hour, minute=minute)
    
    scheduler.add_job(
        send_daily_question,
        trigger=trigger,
        args=[user_id],
        id=f"daily_question_{user_id}",
        name=f"Daily question for user {user_id}"
    )

async def send_daily_question(user_id: str):
    # This would integrate with a notification system
    # For now, we'll just log it
    print(f"Sending daily question to user {user_id} at {datetime.utcnow()}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
