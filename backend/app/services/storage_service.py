import os
import mimetypes
import logging
import requests
from typing import Optional
from fastapi import UploadFile
from backend.app.core.config import settings

logger = logging.getLogger("bharatpanchyt.storage")

class StorageService:
    def __init__(self):
        self.blob_token = settings.BLOB_READ_WRITE_TOKEN
        self.upload_dir = settings.UPLOAD_DIR
        self.backend_url = (settings.BACKEND_URL or "").rstrip("/")

    def upload_bytes(
        self,
        data: bytes,
        filename: str,
        content_type: Optional[str] = None,
        folder: str = "general"
    ) -> str:
        """
        Uploads binary data to persistent storage.
        If BLOB_READ_WRITE_TOKEN is configured (Vercel Blob), uploads directly
        to Vercel Blob and returns the persistent public HTTPS URL.
        Otherwise falls back to local disk with full backend URL resolution.
        """
        if not content_type:
            content_type, _ = mimetypes.guess_type(filename)
            content_type = content_type or "application/octet-stream"

        clean_folder = folder.strip("/\\")
        pathname = f"{clean_folder}/{filename}" if clean_folder else filename

        # 1. Try Vercel Blob if token available
        token = os.getenv("BLOB_READ_WRITE_TOKEN") or settings.BLOB_READ_WRITE_TOKEN
        if token:
            try:
                # Vercel Blob REST API PUT
                blob_url = f"https://blob.vercel-storage.com/{pathname}"
                headers = {
                    "Authorization": f"Bearer {token}",
                    "x-api-version": "7",
                    "Content-Type": content_type,
                    "x-add-random-suffix": "false"
                }
                res = requests.put(blob_url, data=data, headers=headers, timeout=4)
                if res.status_code in [200, 201]:
                    res_json = res.json()
                    public_url = res_json.get("url")
                    if public_url:
                        logger.info(f"Uploaded {pathname} to Vercel Blob: {public_url}")
                        return public_url
                else:
                    logger.warning(f"Vercel Blob returned status {res.status_code}: {res.text}. Falling back to disk.")
            except Exception as e:
                logger.warning(f"Vercel Blob upload skipped or timed out: {e}. Falling back to disk.")

        # 2. Local disk fallback
        target_dir = os.path.join(self.upload_dir, clean_folder)
        os.makedirs(target_dir, exist_ok=True)
        local_path = os.path.join(target_dir, filename)

        with open(local_path, "wb") as f:
            f.write(data)

        # Build accessible URL
        rel_url = f"/uploads/{clean_folder}/{filename}" if clean_folder else f"/uploads/{filename}"
        backend_url = os.getenv("BACKEND_URL") or self.backend_url
        if backend_url:
            return f"{backend_url}{rel_url}"
        return rel_url

    def upload_file_sync(
        self,
        upload_file: UploadFile,
        folder: str = "general"
    ) -> str:
        content = upload_file.file.read()
        return self.upload_bytes(
            data=content,
            filename=upload_file.filename,
            content_type=upload_file.content_type,
            folder=folder
        )

    def persist_local_file(
        self,
        local_path: str,
        folder: str = "reports"
    ) -> str:
        """
        Reads an existing generated local file and persists it to Blob storage if configured.
        """
        if not os.path.exists(local_path):
            raise FileNotFoundError(f"File not found: {local_path}")

        filename = os.path.basename(local_path)
        content_type, _ = mimetypes.guess_type(local_path)
        content_type = content_type or "application/octet-stream"

        with open(local_path, "rb") as f:
            data = f.read()

        return self.upload_bytes(
            data=data,
            filename=filename,
            content_type=content_type,
            folder=folder
        )

storage_service = StorageService()
