import hashlib
import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]

def load_environment():
    load_dotenv(ROOT / ".env", override=False)

@dataclass(frozen=True)
class AdminConfig:
    password_digest: bytes
    cookie_secure: bool
    session_seconds: int

def admin_config():
    password = os.environ.get("ADMIN_PASSWORD", "")
    if len(password) < 8:
        raise RuntimeError("Configure ADMIN_PASSWORD com pelo menos 8 caracteres no .env da pasta do projeto. Copie .env.example para .env e preencha a senha.")
    secure = os.environ.get("COOKIE_SECURE", "false").strip().lower()
    if secure not in {"true", "false"}:
        raise RuntimeError("COOKIE_SECURE deve ser true ou false.")
    return AdminConfig(hashlib.sha256(password.encode()).digest(), secure == "true", 8 * 60 * 60)


FRONTEND_DIR = ROOT / "frontend"
PAGES_DIR = FRONTEND_DIR / "pages"
STATIC_DIR = FRONTEND_DIR / "static"
ADMIN_ASSETS_DIR = FRONTEND_DIR / "admin-assets"

# Centraliza o carregamento antes de qualquer módulo de persistência.
load_environment()
