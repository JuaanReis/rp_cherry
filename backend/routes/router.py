"""Composição das rotas públicas e administrativas da API."""
from fastapi import APIRouter, Depends

from backend.routes import analytics, auth, catalog, categories, checkout, products, settings, uploads
from backend.routes.dependencies import require_admin

api_router = APIRouter(prefix="/api")
admin_router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])

for module in (auth, products, categories, settings, analytics, checkout):
    api_router.include_router(module.router)

for module in (auth, products, categories, settings, analytics, catalog, uploads):
    admin_router.include_router(module.admin_router)

api_router.include_router(admin_router)
