"""Disponibilidade da aplicação e da conexão com o SQLite."""
from fastapi import APIRouter

from backend.db import session as db

router = APIRouter(tags=["Saúde"])


@router.get("/health")
def health():
    with db.connection() as conn:
        conn.execute("SELECT 1").fetchone()
    return {"status": "ok", "database": "sqlite"}
