"""
Materials API routes
"""
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, Response
from typing import List, Optional
from src.core.models import Material, User
from src.services.auth_service import auth_service
from src.services.material_service import material_service
from pathlib import Path
import mimetypes
from src.core.config import settings

router = APIRouter(tags=["Materials"])

@router.post("", response_model=Material)
async def upload_material(
    title: str = Form(...),
    description: str = Form(...),
    department: str = Form(...),
    content_type: str = Form(...),
    file: Optional[UploadFile] = File(None),
    content: Optional[str] = Form(None),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Upload a new learning material"""
    return material_service.create_material(
        title=title,
        description=description,
        department=department,
        content_type=content_type,
        user_id=current_user.id,
        file=file,
        content=content
    )

@router.get("", response_model=List[Material])
async def get_materials(
    department: Optional[str] = None,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get all materials, optionally filtered by department"""
    return material_service.get_materials(department)

@router.get("/enrolled", response_model=List[Material])
async def get_enrolled_materials(current_user: User = Depends(auth_service.get_current_user)):
    """Get materials the user is enrolled in"""
    return material_service.get_enrolled_materials(current_user)

@router.get("/{material_id}")
async def get_material(
    material_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get a specific material by ID"""
    material = material_service.get_material_by_id(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return {**material, "id": material["_id"]}

@router.get("/{material_id}/file")
async def get_material_file(
    material_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Serve the raw file for a material with correct MIME type (inline)."""
    material = material_service.get_material_by_id(material_id)
    if not material or not material.get("file_path"):
        raise HTTPException(status_code=404, detail="File not found for material")

    # material['file_path'] stored as 'materials/<filename>' relative to uploads root
    uploads_root = Path(settings.UPLOAD_DIR).parent  # 'uploads'
    file_rel = material["file_path"]  # e.g. materials/abc.pdf
    file_abs = uploads_root / file_rel
    if not file_abs.exists():
        raise HTTPException(status_code=404, detail="Stored file missing on disk")

    media_type = mimetypes.guess_type(str(file_abs.name))[0] or "application/octet-stream"
    from fastapi.responses import FileResponse
    return FileResponse(str(file_abs), media_type=media_type, headers={"Accept-Ranges": "bytes"})

@router.get("/{material_id}/file-info")
async def get_material_file_info(
    material_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Return diagnostic info about the stored file (size, hash, header bytes)."""
    import hashlib
    material = material_service.get_material_by_id(material_id)
    if not material or not material.get("file_path"):
        raise HTTPException(status_code=404, detail="File not found for material")

    uploads_root = Path(settings.UPLOAD_DIR).parent
    file_rel = material["file_path"]
    file_abs = uploads_root / file_rel
    if not file_abs.exists():
        raise HTTPException(status_code=404, detail="Stored file missing on disk")

    data = {
        "material_id": material_id,
        "file_name": file_abs.name,
        "file_path": str(file_abs),
        "size_bytes": file_abs.stat().st_size,
        "is_pdf": file_abs.suffix.lower() == ".pdf",
    }
    # Hash (MD5 for quick diagnostic purposes, not for security)
    hash_md5 = hashlib.md5()
    with open(file_abs, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            hash_md5.update(chunk)
    data["md5"] = hash_md5.hexdigest()
    # First 8 bytes
    with open(file_abs, "rb") as f:
        header = f.read(8)
    data["header_hex"] = header.hex()
    data["header_ascii"] = ''.join(chr(b) if 32 <= b <= 126 else '.' for b in header)
    # Expected PDF header starts with %PDF
    if data["is_pdf"]:
        data["pdf_header_valid"] = header.startswith(b"%PDF")
    return data

@router.get("/{material_id}/file-stream")
async def stream_material_file(
    material_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Alternate streaming endpoint to add explicit headers helpful for some viewers."""
    material = material_service.get_material_by_id(material_id)
    if not material or not material.get("file_path"):
        raise HTTPException(status_code=404, detail="File not found for material")
    uploads_root = Path(settings.UPLOAD_DIR).parent
    file_rel = material["file_path"]
    file_abs = uploads_root / file_rel
    if not file_abs.exists():
        raise HTTPException(status_code=404, detail="Stored file missing on disk")
    media_type = mimetypes.guess_type(str(file_abs.name))[0] or "application/octet-stream"
    from fastapi.responses import FileResponse
    # Provide Accept-Ranges and Cache-Control (adjust as needed)
    return FileResponse(
        str(file_abs),
        media_type=media_type,
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-store",
        }
    )

@router.put("/{material_id}/enroll")
async def enroll_in_material(
    material_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Enroll in a material"""
    return material_service.enroll_user(material_id, current_user)

@router.delete("/{material_id}")
async def delete_material(
    material_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Delete a material (must be uploader)."""
    return material_service.delete_material(material_id, current_user)

@router.delete("/{material_id}/force")
async def force_delete_material(
    material_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Force delete a ghost material (missing file). Allows non-uploader if file is gone and user is enrolled.
    Prevent deletion via this route if file still exists."""
    material = material_service.get_material_by_id(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    file_rel = material.get("file_path")
    if file_rel:
        uploads_root = Path(settings.UPLOAD_DIR).parent
        file_abs = uploads_root / file_rel
        if file_abs.exists():
            raise HTTPException(status_code=400, detail="File still exists; use standard delete endpoint.")
    # Authorization: uploader OR enrolled user may force delete ghost
    if material.get("uploaded_by") != current_user.id and material_id not in (current_user.enrolled_materials or []):
        raise HTTPException(status_code=403, detail="Not authorized to force delete this ghost material")
    return material_service.force_delete_material(material_id)

@router.post("/{material_id}/verify-learning")
async def verify_learning(
    material_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Verify learning for a material using AI"""
    from src.services.ai_service import ai_service
    material = material_service.get_material_by_id(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return ai_service.verify_learning(material)
