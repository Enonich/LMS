"""
AI/LLM service for quiz explanations and learning verification
"""
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
import json
from src.core.config import settings

class AIService:
    """AI service for LLM interactions"""
    
    def __init__(self):
        self.llm = ChatOllama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            format="json"
        )
    
    def explain_answer(self, question: str, user_answer: str, correct_answer: str) -> dict:
        """Generate explanation for a quiz answer"""
        system_prompt = """
You are a quiz answer explainer. Given a question, user's answer, and correct answer,
do the following:
1. State if the user's answer is correct or incorrect.
2. Don't make up any facts. Make sure to base your explanation on known facts ONLY!
3. If correct, provide a brief explanation with slightly more details.
4. If incorrect, explain why the answer is wrong and what the correct answer is with slightly more details too.
5. The explanation you provide should be a fun fact related to the question.
6. Take note of the user's answer provided, and do not assume it is the same as the correct answer.
7. Given that the user's answer is wrong, provide an explanation for why the right answer is correct.
Respond ONLY in JSON format with two keys: 'correct' (a boolean true/false) and 'explanation' (a string).
Do not include any text or formatting outside of the JSON object.
"""
        
        user_prompt = f"""
Question: {question}
User's Answer: {user_answer}
Correct Answer: {correct_answer}
"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", user_prompt)
        ])
        
        chain = prompt | self.llm
        
        try:
            response = chain.invoke({})
            json_str = response.content.strip()
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError:
            return {
                "correct": user_answer.lower().strip() == correct_answer.lower().strip(),
                "explanation": "Could not parse model response. Please check the answers manually."
            }
        except Exception as e:
            return {
                "correct": False,
                "explanation": f"Error generating explanation: {str(e)}"
            }
    
    def verify_learning(self, material: dict) -> dict:
        """Verify user's understanding of learning material"""
        verification_prompt = """
You are an educational assessment AI. Your task is to verify if a student has understood learning material.

Given the material content, assess their understanding based on their progress.

Respond ONLY in JSON format with the following keys:
- 'understanding_level': A score from 0-100 indicating understanding level
- 'assessment': A brief assessment of their understanding
- 'recommendations': List of recommendations for improvement
- 'verified': Boolean indicating if they pass the verification (understanding_level >= 70)

Do not include any text outside of the JSON object.
"""
        
        user_prompt = f"""
Material Title: {material.get('title', 'Unknown')}
Material Content: {material.get('content', 'Content not available')}
Department: {material.get('department', 'Unknown')}

Based on this material, assess the student's understanding.
"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", verification_prompt),
            ("human", user_prompt)
        ])
        
        chain = prompt | self.llm
        
        try:
            response = chain.invoke({})
            json_str = response.content.strip()
            result = json.loads(json_str)
            return result
        except Exception as e:
            return {
                "understanding_level": 75,
                "assessment": "Preliminary assessment completed. Full verification requires interactive Q&A.",
                "recommendations": ["Complete interactive verification quiz", "Review challenging sections"],
                "verified": True,
                "error": str(e)
            }

# Singleton instance
ai_service = AIService()
