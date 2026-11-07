"""Validação das imagens e armazenamento dos arquivos enviados."""
import io
import warnings
from uuid import uuid4

from fastapi import HTTPException
from PIL import Image, UnidentifiedImageError

from backend.db import session as db

MAX_UPLOAD = 5 * 1024 * 1024


def save_photo(data: bytes):
    if not data or len(data) > MAX_UPLOAD:
        raise HTTPException(413, "A foto deve ter até 5 MB.")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data)) as image:
                extension = {"PNG": ".png", "JPEG": ".jpg", "WEBP": ".webp"}.get(image.format)
                if extension is None:
                    raise HTTPException(415, "Use uma foto JPG, PNG ou WebP.")
                if image.width * image.height > 25_000_000:
                    raise HTTPException(413, "Use uma foto de até 25 megapixels.")
                image.verify()
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(415, "O arquivo não é uma foto JPG, PNG ou WebP válida.")
    name = uuid4().hex + extension
    (db.UPLOAD_DIR / name).write_bytes(data)
    return {"url": "/uploads/" + name}
