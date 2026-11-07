"""Dependências de autenticação e proteção CSRF das rotas."""
import hmac
from fastapi import HTTPException, Request
from backend.services.auth import session_for


def require_admin(request: Request):
    session = session_for(request)
    if session is None:
        raise HTTPException(401, "Entre no painel para continuar.")
    if request.method in {"POST", "PUT", "DELETE", "PATCH"}:
        csrf = request.headers.get("x-csrf-token", "")
        if not hmac.compare_digest(csrf.encode(), session["csrf_token"].encode()):
            raise HTTPException(403, "Atualize o painel e tente novamente: a sessão mudou.")
    return session
