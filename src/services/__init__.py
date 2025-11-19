"""
Init file for services package
"""
from src.services.auth_service import auth_service
from src.services.material_service import material_service
from src.services.quiz_service import quiz_service
from src.services.progress_service import progress_service
from src.services.ai_service import ai_service

__all__ = [
    'auth_service',
    'material_service',
    'quiz_service',
    'progress_service',
    'ai_service'
]
