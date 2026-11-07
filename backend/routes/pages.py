"""Rotas que entregam as páginas do frontend."""
from fastapi import APIRouter, Request
from fastapi.responses import FileResponse, RedirectResponse

from backend.core.config import PAGES_DIR
from backend.services import auth

router = APIRouter(include_in_schema=False)


@router.get("/")
@router.get("/index.html")
def catalog_page():
    return FileResponse(PAGES_DIR / "index.html")


@router.get("/admin")
@router.get("/admin/")
def admin_page(request: Request):
    if auth.session_for(request) is None:
        return RedirectResponse("/admin/login", status_code=303)
    return FileResponse(PAGES_DIR / "admin" / "index.html")


@router.get("/admin/login")
def login_page(request: Request):
    if auth.session_for(request):
        return RedirectResponse("/admin", status_code=303)
    return FileResponse(PAGES_DIR / "admin" / "login.html")
