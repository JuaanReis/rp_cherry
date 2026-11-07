"""Origem, sessões dos assets administrativos e limites da API."""
from urllib.parse import urlsplit
from fastapi import Request
from fastapi.responses import JSONResponse
from backend.core.rate_limit import Limit, limiter
from backend.services import auth

PUBLIC_API_LIMIT = Limit(requests=120, window_seconds=60)
VIEW_LIMIT = Limit(requests=60, window_seconds=60)
CHECKOUT_LIMIT = Limit(requests=20, window_seconds=60)
ADMIN_API_LIMIT = Limit(requests=120, window_seconds=60)


def request_limit(path: str) -> tuple[str, Limit] | None:
    if not path.startswith("/api/") or path in {"/api/docs", "/api/openapi.json"}:
        return None
    if path == "/api/checkout":
        return "checkout", CHECKOUT_LIMIT
    if path.endswith("/view"):
        return "product-views", VIEW_LIMIT
    if path.startswith("/api/admin/"):
        return "admin", ADMIN_API_LIMIT
    return "public", PUBLIC_API_LIMIT


async def same_origin(request: Request, call_next):
    origin = request.headers.get("origin")
    if request.method in {"POST", "PUT", "DELETE", "PATCH"} and origin:
        parsed = urlsplit(origin)
        if parsed.scheme != request.url.scheme or parsed.netloc != request.url.netloc:
            return JSONResponse({"error": "Origem da requisição não permitida."}, status_code=403)
    if request.url.path.startswith("/admin-assets/") and auth.session_for(request) is None:
        return JSONResponse({"error": "Entre no painel para continuar."}, status_code=401)

    rate_rule = request_limit(request.url.path)
    if rate_rule is not None:
        rate_group, limit = rate_rule
        client_ip = request.client.host if request.client else "unknown"
        allowed, remaining, retry_after = limiter.allow(
            f"{rate_group}:{client_ip}",
            limit,
        )
        if not allowed:
            return JSONResponse(
                {"error": "Muitas requisições. Aguarde um momento e tente novamente."},
                status_code=429,
                headers={"Retry-After": str(retry_after), "X-RateLimit-Limit": str(limit.requests), "X-RateLimit-Remaining": "0"},
            )

    response = await call_next(request)
    if rate_rule is not None:
        response.headers["X-RateLimit-Limit"] = str(limit.requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
    if request.url.path.startswith(("/api/", "/admin")):
        response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response
