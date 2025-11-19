"""
Quiz service for managing questions and answers
"""
from fastapi import HTTPException
from sentence_transformers import SentenceTransformer, util
import random
from typing import List
from src.core.database import get_questions_collection, get_progress_collection
from src.core.models import QuestionResponse, AnswerRequest, User
from src.services.ai_service import ai_service
from src.core.config import settings
from datetime import datetime

class QuizService:
    """Service for quiz functionality"""
    
    def __init__(self):
        self.questions_collection = get_questions_collection()
        self.progress_collection = get_progress_collection()
        self.embedder = SentenceTransformer('all-mpnet-base-v2')
        self.similarity_threshold = settings.SIMILARITY_THRESHOLD
    
    def get_daily_question(self, user: User) -> QuestionResponse:
        """Get a daily question for the user"""
        query = {"department": user.department}
        if user.enrolled_materials:
            query["$or"] = [
                {"material_id": {"$in": user.enrolled_materials}},
                {"material_id": {"$exists": False}}
            ]
        
        questions = list(self.questions_collection.find(query))
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
    
    def check_answer(self, answer_request: AnswerRequest, user: User) -> dict:
        """Check user's answer and provide explanation"""
        q = self.questions_collection.find_one({"question_id": answer_request.question_id})
        if not q:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Check correctness
        correct = False
        if q["question_type"].lower().startswith("fill"):
            correct_answers = [a.strip() for a in q["answer"].replace(' or ', ',').split(',')]
            user_emb = self.embedder.encode(answer_request.user_answer, convert_to_tensor=True)
            for ans in correct_answers:
                ans_emb = self.embedder.encode(ans, convert_to_tensor=True)
                sim = float(util.pytorch_cos_sim(user_emb, ans_emb))
                if sim >= self.similarity_threshold:
                    correct = True
                    break
        else:
            correct = answer_request.user_answer.strip().lower() == q["answer"].strip().lower()
        
        # Get AI explanation
        explanation_result = ai_service.explain_answer(
            q["public_text"], 
            answer_request.user_answer, 
            q["answer"]
        )
        
        # Update progress if from material
        if q.get("material_id"):
            self.progress_collection.update_one(
                {"user_id": user.id, "material_id": q["material_id"]},
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

# Singleton instance
quiz_service = QuizService()
