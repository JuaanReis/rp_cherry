"""Conexões e transações SQLite; caminhos independentes do diretório atual."""
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from backend.core.config import ROOT

_configured_dir = Path(os.environ.get("CEREJA_DATA_DIR") or ROOT / "data")
DATA_DIR = (_configured_dir if _configured_dir.is_absolute() else ROOT / _configured_dir).resolve()
DB_PATH = DATA_DIR / "cereja.sqlite3"
UPLOAD_DIR = DATA_DIR / "uploads"


@contextmanager
def connection():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
