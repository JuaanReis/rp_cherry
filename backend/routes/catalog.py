"""Rotas administrativas de importação e exportação."""
from fastapi import APIRouter

from backend.schemas.catalog import ImportInput
from backend.services import catalog

admin_router = APIRouter(tags=["Importação e exportação · Admin"])


@admin_router.get("/export")
def export_catalog():
    return catalog.export_catalog()


@admin_router.post("/import")
def import_catalog(payload: ImportInput):
    return catalog.import_catalog(payload)
