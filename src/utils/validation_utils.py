"""
Input validation and sanitization utilities
"""
import re
from typing import Optional
from fastapi import HTTPException

class InputValidator:
    """Centralized input validation"""
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_password(password: str) -> tuple[bool, Optional[str]]:
        """
        Validate password strength
        Returns: (is_valid, error_message)
        """
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"
        if not any(char.isdigit() for char in password):
            return False, "Password must contain at least one digit"
        if not any(char.isupper() for char in password):
            return False, "Password must contain at least one uppercase letter"
        if not any(char.islower() for char in password):
            return False, "Password must contain at least one lowercase letter"
        return True, None
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize filename to prevent directory traversal"""
        # Remove path separators and dangerous characters
        filename = re.sub(r'[^\w\s.-]', '', filename)
        filename = filename.replace('..', '')
        return filename
    
    @staticmethod
    def validate_file_extension(filename: str, allowed_extensions: list) -> bool:
        """Check if file has allowed extension"""
        ext = filename.lower().split('.')[-1]
        return ext in allowed_extensions
    
    @staticmethod
    def validate_file_size(file_size: int, max_size: int = 10485760) -> bool:
        """Validate file size (default 10MB)"""
        return file_size <= max_size

class SQLInjectionPrevention:
    """Prevent SQL/NoSQL injection attacks"""
    
    @staticmethod
    def sanitize_query(query: dict) -> dict:
        """Sanitize MongoDB query to prevent injection"""
        dangerous_operators = ['$where', '$regex', '$function']
        
        def clean_dict(d):
            if isinstance(d, dict):
                return {
                    k: clean_dict(v) 
                    for k, v in d.items() 
                    if k not in dangerous_operators
                }
            elif isinstance(d, list):
                return [clean_dict(item) for item in d]
            return d
        
        return clean_dict(query)
