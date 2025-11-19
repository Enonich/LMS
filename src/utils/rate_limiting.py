"""
Rate limiting middleware for API endpoints
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Custom rate limit exceeded handler
def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded"""
    return {
        "error": "rate_limit_exceeded",
        "message": f"Too many requests. Please try again in {exc.detail}",
        "retry_after": exc.detail
    }

# Rate limit decorators for different endpoint types
AUTH_RATE_LIMIT = "5/minute"  # Login/Register
QUIZ_RATE_LIMIT = "30/minute"  # Quiz questions
UPLOAD_RATE_LIMIT = "10/hour"  # File uploads
API_RATE_LIMIT = "60/minute"   # General API calls
