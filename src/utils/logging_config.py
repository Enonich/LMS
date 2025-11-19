"""
Enhanced logging configuration for the LMS
"""
import logging
import sys
from datetime import datetime
from pathlib import Path

def setup_logging(log_level: str = "INFO"):
    """Configure logging for the application"""
    
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Configure log format
    log_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # File handler - rotating logs
    log_file = log_dir / f"lms_{datetime.now().strftime('%Y%m%d')}.log"
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(getattr(logging, log_level))
    file_handler.setFormatter(log_format)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level))
    console_handler.setFormatter(log_format)
    
    # Root logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, log_level))
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

def log_user_action(user_id: str, action: str, details: dict = None):
    """Log user actions for audit trail"""
    logger = logging.getLogger("user_actions")
    log_entry = {
        "user_id": user_id,
        "action": action,
        "timestamp": datetime.utcnow().isoformat(),
        "details": details or {}
    }
    logger.info(log_entry)

def log_security_event(event_type: str, details: dict):
    """Log security-related events"""
    logger = logging.getLogger("security")
    log_entry = {
        "event_type": event_type,
        "timestamp": datetime.utcnow().isoformat(),
        "details": details
    }
    logger.warning(log_entry)
