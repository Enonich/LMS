"""
Materials management service
"""
from fastapi import HTTPException, UploadFile, File
from typing import List, Optional
import uuid
import shutil
from pathlib import Path
from src.core.database import get_materials_collection, get_users_collection, get_progress_collection
from src.core.models import Material, MaterialCreate, User
from src.core.config import settings
from datetime import datetime

class MaterialService:
    """Service for managing learning materials"""
    
    def __init__(self):
        self.materials_collection = get_materials_collection()
        self.users_collection = get_users_collection()
        self.progress_collection = get_progress_collection()
    
    def create_material(
        self, 
        title: str, 
        description: str, 
        department: str,
        content_type: str,
        user_id: str,
        file: Optional[UploadFile] = None,
        content: Optional[str] = None
    ) -> Material:
        """Create a new learning material"""
        material_id = str(uuid.uuid4())
        file_path = None
        
        if file:
            # Save uploaded file
            upload_dir = Path(settings.UPLOAD_DIR)
            upload_dir.mkdir(parents=True, exist_ok=True)
            filename = f"{material_id}_{file.filename}"
            file_path = upload_dir / filename
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Basic PDF validation if content_type is pdf or filename endswith .pdf
            total_pages = None
            if (content_type.lower() == "pdf" or (file.filename.lower().endswith(".pdf"))):
                try:
                    with open(file_path, "rb") as f:
                        header = f.read(8)
                    if not header.startswith(b"%PDF"):
                        # Remove invalid file and abort
                        file_path.unlink(missing_ok=True)
                        raise HTTPException(status_code=400, detail="Uploaded file is not a valid PDF (missing %PDF header). Please export or re-save the document as a PDF and retry.")
                    # Attempt page count if PyPDF2 available
                    try:
                        from PyPDF2 import PdfReader  # type: ignore
                        reader = PdfReader(str(file_path))
                        total_pages = len(reader.pages)
                    except Exception:
                        total_pages = None
                except HTTPException:
                    raise
                except Exception as e:
                    file_path.unlink(missing_ok=True)
                    raise HTTPException(status_code=400, detail=f"Failed to validate PDF: {e}")
        else:
            total_pages = None
        
        material_doc = {
            "_id": material_id,
            "title": title,
            "description": description,
            "department": department,
            "content_type": content_type,
            "file_path": f"materials/{filename}" if file else None,
            "content": content,
            "uploaded_by": user_id,
            "uploaded_at": datetime.utcnow(),
            "total_pages": total_pages
        }
        
        self.materials_collection.insert_one(material_doc)
        return Material(**{**material_doc, "id": material_id})
    
    def get_materials(self, department: Optional[str] = None) -> List[Material]:
        """Get all materials, optionally filtered by department"""
        query = {}
        if department:
            query["department"] = department
        
        materials = list(self.materials_collection.find(query))
        annotated: List[Material] = []
        for mat in materials:
            annotated.append(self._build_material_with_file_flags(mat))
        return annotated
    
    def get_material_by_id(self, material_id: str) -> Optional[dict]:
        """Get a single material by ID"""
        material = self.materials_collection.find_one({"_id": material_id})
        return material
    
    def get_enrolled_materials(self, user: User) -> List[Material]:
        """Get materials the user is enrolled in"""
        if not user.enrolled_materials:
            return []
        
        materials = list(self.materials_collection.find({"_id": {"$in": user.enrolled_materials}}))
        annotated: List[Material] = []
        for mat in materials:
            annotated.append(self._build_material_with_file_flags(mat))
        return annotated
    
    def enroll_user(self, material_id: str, user: User) -> dict:
        """Enroll a user in a material"""
        material = self.materials_collection.find_one({"_id": material_id})
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        if material_id not in user.enrolled_materials:
            self.users_collection.update_one(
                {"_id": user.id},
                {"$push": {"enrolled_materials": material_id}}
            )
            # Initialize progress
            self.progress_collection.insert_one({
                "_id": str(uuid.uuid4()),
                "user_id": user.id,
                "material_id": material_id,
                "progress_percentage": 0.0,
                "completed_sections": [],
                "completed_pages": [],
                "started_at": datetime.utcnow(),
                "last_updated": datetime.utcnow()
            })
        
        return {"message": "Successfully enrolled in material"}

    def delete_material(self, material_id: str, user: User) -> dict:
        """Delete a material (only uploader). Removes file and related progress/enrollments."""
        material = self.materials_collection.find_one({"_id": material_id})
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        if material.get("uploaded_by") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this material")

        # Remove file if exists
        file_rel = material.get("file_path")  # e.g. materials/<file>
        if file_rel:
            uploads_root = Path(settings.UPLOAD_DIR).parent
            file_abs = uploads_root / file_rel
            try:
                if file_abs.exists():
                    file_abs.unlink()
            except Exception:
                # Non-fatal; continue
                pass

        # Remove progress entries
        self.progress_collection.delete_many({"material_id": material_id})
        # Pull from enrolled_materials for all users
        self.users_collection.update_many({}, {"$pull": {"enrolled_materials": material_id}})
        # Delete the material document
        self.materials_collection.delete_one({"_id": material_id})

        return {"message": "Material deleted"}

    def force_delete_material(self, material_id: str) -> dict:
        """Force delete a material regardless of uploader (used for ghost entries with missing files)."""
        material = self.materials_collection.find_one({"_id": material_id})
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        # Attempt file removal if still present
        file_rel = material.get("file_path")
        if file_rel:
            uploads_root = Path(settings.UPLOAD_DIR).parent
            file_abs = uploads_root / file_rel
            try:
                if file_abs.exists():
                    file_abs.unlink()
            except Exception:
                pass
        # Remove progress entries and enrollment references
        self.progress_collection.delete_many({"material_id": material_id})
        self.users_collection.update_many({}, {"$pull": {"enrolled_materials": material_id}})
        self.materials_collection.delete_one({"_id": material_id})
        return {"message": "Material force-deleted"}

    # Internal helpers
    def _build_material_with_file_flags(self, mat: dict) -> Material:
        """Construct Material with file existence and PDF header validation flags."""
        from pathlib import Path
        file_exists = None
        pdf_header_valid = None
        file_rel = mat.get("file_path")
        if file_rel:
            try:
                uploads_root = Path(settings.UPLOAD_DIR).parent  # 'uploads'
                file_abs = uploads_root / file_rel
                if file_abs.exists():
                    file_exists = True
                    # Only attempt PDF header validation if seems to be pdf
                    if str(file_abs).lower().endswith('.pdf'):
                        try:
                            with open(file_abs, 'rb') as f:
                                header = f.read(8)
                            pdf_header_valid = header.startswith(b'%PDF')
                        except Exception:
                            pdf_header_valid = False
                else:
                    file_exists = False
                    if str(file_rel).lower().endswith('.pdf'):
                        pdf_header_valid = False
            except Exception:
                file_exists = False
                if file_rel.lower().endswith('.pdf'):
                    pdf_header_valid = False
        return Material(**{**mat, "id": mat["_id"], "file_exists": file_exists, "pdf_header_valid": pdf_header_valid, "total_pages": mat.get("total_pages")})

# Singleton instance
material_service = MaterialService()
