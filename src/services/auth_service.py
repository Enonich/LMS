"""
Authentication service
"""
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import timedelta
import uuid
from src.core.database import get_users_collection
from src.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from src.core.models import User, UserCreate, UserLogin, Token
from src.core.config import settings

security = HTTPBearer()

class AuthService:
    """Authentication service"""
    
    def __init__(self):
        self.users_collection = get_users_collection()
    
    def register_user(self, user_data: UserCreate) -> User:
        """Register a new user"""
        # Check if user exists
        if self.users_collection.find_one({"email": user_data.email}):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user_data.password)
        
        from datetime import datetime
        user_doc = {
            "_id": user_id,
            "email": user_data.email,
            "password": hashed_password,
            "full_name": user_data.full_name,
            "department": user_data.department,
            "enrolled_materials": [],
            "created_at": datetime.utcnow()
        }
        
        self.users_collection.insert_one(user_doc)
        return User(**{**user_doc, "id": user_id})
    
    def login_user(self, credentials: UserLogin) -> Token:
        """Login user and return access token"""
        user = self.users_collection.find_one({"email": credentials.email})
        if not user or not verify_password(credentials.password, user["password"]):
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["_id"]}, expires_delta=access_token_expires
        )
        return Token(access_token=access_token, token_type="bearer")
    
    def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
        """Get current authenticated user"""
        payload = decode_access_token(credentials.credentials)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = self.users_collection.find_one({"_id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**{**user, "id": user["_id"]})

# Singleton instance
auth_service = AuthService()
