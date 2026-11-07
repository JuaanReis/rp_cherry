"""Opaque, revocable sessions. Only a token hash is stored in SQLite."""
import hashlib
import hmac
import secrets
import time
from threading import Lock

from fastapi import HTTPException

from backend.db import session as db
from backend.repositories import auth as repository

COOKIE = "cereja_admin"
_login_lock = Lock()


def session_for(request):
    token = request.cookies.get(COOKIE, "")
    if not token or len(token) > 128:
        return None
    digest = hashlib.sha256(token.encode()).hexdigest()
    with db.connection() as conn:
        return repository.get_session(conn, digest, int(time.time()))


def login(request, password):
    config = request.app.state.admin_config
    timestamp = int(time.time())
    client_key = hashlib.sha256((request.client.host if request.client else "unknown").encode()).hexdigest()
    with _login_lock, db.connection() as conn:
        repository.clear_old_attempts(conn, timestamp - 600)
        if repository.failed_attempts(conn, client_key) >= 10:
            raise HTTPException(429, "Muitas tentativas. Aguarde até 10 minutos para tentar novamente.")
        candidate = hashlib.sha256(password.encode()).digest()
        if not hmac.compare_digest(candidate, config.password_digest):
            repository.record_failure(conn, client_key, timestamp)
            # Commit this failed attempt before returning an authentication error.
            conn.commit()
            raise HTTPException(401, "Senha incorreta.")
        repository.clear_attempts(conn, client_key)
        repository.clear_expired_sessions(conn, timestamp)
        previous = request.cookies.get(COOKIE, "")
        if previous:
            repository.delete_session(conn, hashlib.sha256(previous.encode()).hexdigest())
        token, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
        repository.create_session(conn, hashlib.sha256(token.encode()).hexdigest(), csrf, timestamp + config.session_seconds)
    return token, csrf


def logout(request):
    token = request.cookies.get(COOKIE, "")
    with db.connection() as conn:
        repository.delete_session(conn, hashlib.sha256(token.encode()).hexdigest())
