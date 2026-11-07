"""Rotas das configurações da loja."""
from fastapi import APIRouter

from backend.schemas.settings import ShopSettings
from backend.services import settings

router = APIRouter(prefix="/settings", tags=["Configurações"])
admin_router = APIRouter(prefix="/settings", tags=["Configurações · Admin"])


@router.get("")
def get_settings():
    return settings.get_settings()


@admin_router.put("")
def save_settings(payload: ShopSettings):
    return settings.save_settings(payload)
