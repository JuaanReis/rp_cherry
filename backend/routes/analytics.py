"""Rotas de visualizações e indicadores do painel."""
import re
import secrets

from fastapi import APIRouter, Request, Response

from backend.services import analytics, auth

router = APIRouter(tags=["Visualizações"])
admin_router = APIRouter(tags=["Dashboard · Admin"])


@router.post("/products/{product_id}/view")
def record_view(product_id: str, request: Request, response: Response):
    if auth.session_for(request):
        return {"counted": False}
    visitor = request.cookies.get("cereja_visitor", "")
    new_visitor = not re.fullmatch(r"[A-Za-z0-9_-]{32}", visitor)
    if new_visitor:
        visitor = secrets.token_urlsafe(24)
    counted = analytics.record_view(product_id, visitor)
    if new_visitor:
        response.set_cookie(
            "cereja_visitor", visitor, max_age=60 * 86400, httponly=True,
            secure=request.app.state.admin_config.cookie_secure, samesite="lax", path="/",
        )
    return {"counted": counted}


@admin_router.get("/dashboard")
def dashboard():
    return analytics.dashboard()
