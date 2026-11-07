"""Criação idempotente das tabelas e carga inicial do catálogo."""
import json
from pathlib import Path

from backend.db import session as db
from backend.repositories.categories import add_category
from backend.repositories.products import insert, list_products


def initialize(*, reset_sessions=True):
    db.DATA_DIR.mkdir(parents=True, exist_ok=True)
    db.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    with db.connection() as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)")
        conn.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        conn.execute("CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, name_key TEXT NOT NULL UNIQUE)")
        conn.execute("CREATE TABLE IF NOT EXISTS product_views (product_id TEXT NOT NULL, day TEXT NOT NULL, view_count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(product_id,day))")
        conn.execute("CREATE TABLE IF NOT EXISTS view_dedup (product_id TEXT NOT NULL, visitor_hash TEXT NOT NULL, day TEXT NOT NULL, PRIMARY KEY(product_id,visitor_hash,day))")
        conn.execute("CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, csrf_token TEXT NOT NULL, expires_at INTEGER NOT NULL)")
        conn.execute("CREATE TABLE IF NOT EXISTS login_attempts (client_key TEXT PRIMARY KEY, failures INTEGER NOT NULL, first_attempt INTEGER NOT NULL)")
        conn.execute(
            "INSERT OR IGNORE INTO settings VALUES ('shop', ?)",
            (json.dumps({"brand_name": "RP Modas Cereja", "whatsapp": ""}),),
        )
        current_shop = json.loads(
            conn.execute("SELECT value FROM settings WHERE key='shop'").fetchone()["value"]
        )
        if current_shop.get("brand_name") == "Cereja":
            current_shop["brand_name"] = "RP Modas Cereja"
            conn.execute(
                "UPDATE settings SET value=? WHERE key='shop'",
                (json.dumps(current_shop, ensure_ascii=False),),
            )
        # A flag, instead of a row count, ensures an intentionally empty catalog stays empty.
        if conn.execute("SELECT 1 FROM settings WHERE key='seeded'").fetchone() is None:
            seed = json.loads(Path(__file__).with_name("seed.json").read_text(encoding="utf-8"))
            for product in seed:
                insert(conn, product)
            conn.execute("INSERT INTO settings VALUES ('seeded', 'true')")
        if conn.execute("SELECT 1 FROM settings WHERE key='categories_initialized'").fetchone() is None:
            names = ["Conjuntos", "Sutiãs", "Calcinhas", "Camisolas", "Pijamas"]
            names += [p["category"] for p in list_products(conn)]
            for name in names:
                add_category(conn, name)
            conn.execute("INSERT INTO settings VALUES ('categories_initialized', 'true')")
        # Logging out after a restart also invalidates sessions when the env password changes.
        if reset_sessions:
            conn.execute("DELETE FROM admin_sessions")
