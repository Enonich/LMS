"""
Core configuration settings for the LMS application
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    """Application settings"""
    
    # Application
    APP_NAME = "Learners Management System"
    APP_VERSION = "2.0.0"
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    # Server
    HOST = os.getenv("API_HOST", "127.0.0.1")
    PORT = int(os.getenv("API_PORT", "8000"))
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Database
    MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
    DATABASE_NAME = "learners_db"
    
    # AI/LLM
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
    SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.8"))
    
    # File Upload
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads/materials")
    ALLOWED_EXTENSIONS = ["pdf", "txt", "mp4", "mov", "avi"]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_DIR = "logs"

settings = Settings()
