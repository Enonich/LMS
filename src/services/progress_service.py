"""
Progress tracking service
"""
from fastapi import HTTPException
from src.core.database import get_progress_collection, get_materials_collection
from src.core.models import ProgressUpdate, User
from datetime import datetime

class ProgressService:
    """Service for tracking user progress"""
    
    def __init__(self):
        self.progress_collection = get_progress_collection()
        self.materials_collection = get_materials_collection()
    
    def get_progress(self, material_id: str, user: User) -> dict:
        """Get user's progress for a material"""
        progress = self.progress_collection.find_one({
            "user_id": user.id, 
            "material_id": material_id
        })
        if not progress:
            raise HTTPException(status_code=404, detail="Progress not found")
        return progress
    
    def update_progress(self, material_id: str, progress_update: ProgressUpdate, user: User) -> dict:
        """Update user's progress for a material"""
        update_fields = {
            "progress_percentage": progress_update.progress_percentage,
            "completed_sections": progress_update.completed_sections,
            "last_updated": datetime.utcnow()
        }
        if progress_update.completed_pages is not None:
            update_fields["completed_pages"] = progress_update.completed_pages
        result = self.progress_collection.update_one(
            {"user_id": user.id, "material_id": material_id},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Progress record not found")
        
        return {"message": "Progress updated successfully"}

    def mark_page_complete(self, material_id: str, page_number: int, user: User) -> dict:
        material = self.materials_collection.find_one({"_id": material_id})
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        total_pages = material.get("total_pages")
        if not total_pages or page_number < 1 or page_number > total_pages:
            raise HTTPException(status_code=400, detail="Invalid page number")
        progress = self.progress_collection.find_one({"user_id": user.id, "material_id": material_id})
        if not progress:
            raise HTTPException(status_code=404, detail="Progress record not found")
        completed_pages = progress.get("completed_pages", [])
        if page_number not in completed_pages:
            completed_pages.append(page_number)
            completed_pages.sort()
        percentage = round((len(completed_pages) / total_pages) * 100, 2)
        self.progress_collection.update_one(
            {"_id": progress["_id"]},
            {"$set": {"completed_pages": completed_pages, "progress_percentage": percentage, "last_updated": datetime.utcnow()}}
        )
        return {"progress_percentage": percentage, "completed_pages": completed_pages, "total_pages": total_pages}

    def complete_material(self, material_id: str, user: User) -> dict:
        material = self.materials_collection.find_one({"_id": material_id})
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        total_pages = material.get("total_pages")
        progress = self.progress_collection.find_one({"user_id": user.id, "material_id": material_id})
        if not progress:
            raise HTTPException(status_code=404, detail="Progress record not found")
        if total_pages and total_pages > 0:
            completed_pages = list(range(1, total_pages + 1))
            percentage = 100.0
            self.progress_collection.update_one(
                {"_id": progress["_id"]},
                {"$set": {"completed_pages": completed_pages, "progress_percentage": percentage, "last_updated": datetime.utcnow()}}
            )
            return {"progress_percentage": percentage, "completed_pages": completed_pages, "total_pages": total_pages}
        else:
            self.progress_collection.update_one(
                {"_id": progress["_id"]},
                {"$set": {"progress_percentage": 100.0, "last_updated": datetime.utcnow()}}
            )
            return {"progress_percentage": 100.0, "completed_pages": [], "total_pages": total_pages}

# Singleton instance
progress_service = ProgressService()
