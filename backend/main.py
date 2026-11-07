from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from backend.core.config import ADMIN_ASSETS_DIR, STATIC_DIR, admin_config
from backend.core.errors import http_error, validation_error
from backend.core.middleware import same_origin
from backend.db import session as db
from backend.db.schema import initialize
from backend.routes import health, pages
from backend.routes.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.admin_config = admin_config()
    initialize()
    yield

def create_app() -> FastAPI:
    application = FastAPI(
        title="RP Modas Cereja", lifespan=lifespan,
        docs_url="/api/docs", redoc_url=None,
    )
    application.middleware("http")(same_origin)
    application.add_exception_handler(HTTPException, http_error)
    application.add_exception_handler(RequestValidationError, validation_error)
    application.include_router(pages.router)
    application.include_router(health.router)
    application.include_router(api_router)
    application.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    application.mount("/admin-assets", StaticFiles(directory=ADMIN_ASSETS_DIR), name="admin-assets")
    application.mount("/uploads", StaticFiles(directory=db.UPLOAD_DIR, check_dir=False), name="uploads")
    return application

app = create_app()