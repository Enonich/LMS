"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional
from datetime import datetime

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
    content_type: str

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
    file_exists: Optional[bool] = None
    pdf_header_valid: Optional[bool] = None
    total_pages: Optional[int] = None

class ProgressUpdate(BaseModel):
    material_id: str
    progress_percentage: float
    completed_sections: List[str] = []
    completed_pages: Optional[List[int]] = None

class ScheduleCreate(BaseModel):
    user_id: str
    question_time: str
    days_of_week: List[int] = []
