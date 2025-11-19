"""
Progress tracking API routes
"""
from fastapi import APIRouter, Depends
from src.core.models import ProgressUpdate, User
from src.services.auth_service import auth_service
from src.services.progress_service import progress_service

router = APIRouter(tags=["Progress"])

@router.get("/{material_id}")
async def get_progress(
    material_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get progress for a material"""
    return progress_service.get_progress(material_id, current_user)

@router.put("/{material_id}")
async def update_progress(
    material_id: str,
    progress_update: ProgressUpdate,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Update progress for a material"""
    return progress_service.update_progress(material_id, progress_update, current_user)

@router.put("/{material_id}/page/{page_number}")
async def mark_page_complete(
    material_id: str,
    page_number: int,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Mark a single page as completed for the current user"""
    return progress_service.mark_page_complete(material_id, page_number, current_user)

@router.put("/{material_id}/complete")
async def complete_material(
    material_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Mark entire material as completed"""
    return progress_service.complete_material(material_id, current_user)
