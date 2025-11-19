"""
Authentication API routes
"""
from fastapi import APIRouter, Depends
from src.core.models import UserCreate, UserLogin, Token, User
from src.services.auth_service import auth_service

router = APIRouter(tags=["Authentication"])

@router.post("/register", response_model=User)
async def register(user: UserCreate):
    """Register a new user"""
    return auth_service.register_user(user)

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login and get access token"""
    return auth_service.login_user(credentials)

@router.get("/me", response_model=User)
async def get_current_user_profile(current_user: User = Depends(auth_service.get_current_user)):
    """Get current user profile"""
    return current_user
