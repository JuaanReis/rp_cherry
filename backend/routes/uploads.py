"""Rota administrativa de envio de imagens."""
from fastapi import APIRouter, UploadFile

from backend.services import uploads

admin_router = APIRouter(prefix="/uploads", tags=["Fotos · Admin"])


@admin_router.post("", status_code=201)
async def upload_photo(file: UploadFile):
    try:
        data = await file.read(uploads.MAX_UPLOAD + 1)
    finally:
        await file.close()
    return uploads.save_photo(data)
