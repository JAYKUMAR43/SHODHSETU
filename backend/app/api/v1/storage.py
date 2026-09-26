from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.app.services.storage_service import storage_service

router = APIRouter(prefix="/storage", tags=["Storage"])

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Form("general")
):
    try:
        content = await file.read()
        public_url = storage_service.upload_bytes(
            data=content,
            filename=file.filename,
            content_type=file.content_type,
            folder=folder
        )
        return {
            "success": True,
            "url": public_url,
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
