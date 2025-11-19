"""
Quiz API routes
"""
from fastapi import APIRouter, Depends
from src.core.models import QuestionResponse, AnswerRequest, User
from src.services.auth_service import auth_service
from src.services.quiz_service import quiz_service

router = APIRouter(tags=["Quiz"])

@router.get("/daily", response_model=QuestionResponse)
async def get_daily_question(current_user: User = Depends(auth_service.get_current_user)):
    """Get a daily question for the user"""
    return quiz_service.get_daily_question(current_user)

@router.post("/answer")
async def check_answer(
    answer_request: AnswerRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Submit an answer and get feedback"""
    return quiz_service.check_answer(answer_request, current_user)
