"""Login, consulta de sessão e logout do painel."""
from fastapi import APIRouter, Request, Response

from backend.schemas.auth import LoginInput
from backend.services import auth

router = APIRouter(tags=["Autenticação"])
admin_router = APIRouter(tags=["Sessão · Admin"])


@router.post("/admin/login")
def admin_login(request: Request, payload: LoginInput, response: Response):
    token, csrf = auth.login(request, payload.password.get_secret_value())
    config = request.app.state.admin_config
    response.set_cookie(
        auth.COOKIE, token, max_age=config.session_seconds, httponly=True,
        secure=config.cookie_secure, samesite="strict", path="/",
    )
    return {"ok": True, "csrf_token": csrf}


@admin_router.get("/session")
def admin_session(request: Request):
    session = auth.session_for(request)
    return {"authenticated": True, "csrf_token": session["csrf_token"], "expires_at": session["expires_at"]}


@admin_router.post("/logout")
def admin_logout(request: Request, response: Response):
    auth.logout(request)
    response.delete_cookie(
        auth.COOKIE, path="/", httponly=True,
        secure=request.app.state.admin_config.cookie_secure, samesite="strict",
    )
    return {"ok": True}
