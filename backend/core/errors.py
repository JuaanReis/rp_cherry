"""Formato uniforme dos erros HTTP e de validação."""
from fastapi.responses import JSONResponse


async def http_error(request, exc):
    return JSONResponse({"error": exc.detail}, status_code=exc.status_code)


async def validation_error(request, exc):
    errors = [{"field": ".".join(str(v) for v in e["loc"][1:]), "message": e["msg"]} for e in exc.errors()]
    return JSONResponse({"error": "Confira os campos informados.", "details": errors}, status_code=422)
