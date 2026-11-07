"""Consultas e normalização das categorias do catálogo."""
import unicodedata
from uuid import uuid4


def category_key(name):
    name = " ".join(name.split())
    return "".join(c for c in unicodedata.normalize("NFKD", name.casefold()) if not unicodedata.combining(c)).strip()


def add_category(conn, name):
    name = " ".join(name.split())
    key = category_key(name)
    conn.execute("INSERT OR IGNORE INTO categories VALUES (?,?,?)", (uuid4().hex, name, key))
    return dict(conn.execute("SELECT * FROM categories WHERE name_key=?", (key,)).fetchone())


def list_categories(conn):
    return [dict(row) for row in conn.execute("SELECT id,name FROM categories ORDER BY name_key")]


def category_name(conn, name):
    row = conn.execute("SELECT name FROM categories WHERE name_key=?", (category_key(name),)).fetchone()
    return row["name"] if row else None


def get_category(conn, category_id):
    return conn.execute("SELECT * FROM categories WHERE id=?", (category_id,)).fetchone()


def get_replacement(conn, replacement_id, category_id):
    return conn.execute("SELECT name FROM categories WHERE id=? AND id<>?", (replacement_id, category_id)).fetchone()


def delete(conn, category_id):
    conn.execute("DELETE FROM categories WHERE id=?", (category_id,))
