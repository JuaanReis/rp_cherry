"""Rotas de listagem e administração das categorias."""
from fastapi import APIRouter

from backend.schemas.categories import CategoryInput
from backend.services import categories as service

router = APIRouter(prefix="/categories", tags=["Categorias"])
admin_router = APIRouter(prefix="/categories", tags=["Categorias · Admin"])


@router.get("")
@admin_router.get("")
def categories():
    return service.list_categories()


@admin_router.post("", status_code=201)
def create_category(payload: CategoryInput):
    return service.create_category(payload)


@admin_router.delete("/{category_id}")
def delete_category(category_id: str, replacement_id: str | None = None):
    return service.delete_category(category_id, replacement_id)
