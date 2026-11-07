"""Configurações compartilhadas pela loja e pelo painel."""
from backend.db import session as db
from backend.repositories import settings
from backend.schemas.settings import ShopSettings


def get_settings():
    with db.connection() as conn:
        return settings.get_settings(conn)


def save_settings(payload: ShopSettings):
    with db.connection() as conn:
        return settings.save_settings(conn, payload.model_dump())
