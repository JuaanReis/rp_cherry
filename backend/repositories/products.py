"""Consultas de produtos; a transação pertence ao serviço chamador."""
import json
from datetime import datetime, timezone
from uuid import uuid4


def now():
    return datetime.now(timezone.utc).isoformat()


def unpack(row):
    if row is None:
        return None
    return {**json.loads(row["payload"]), "id": row["id"], "created_at": row["created_at"], "updated_at": row["updated_at"]}


def get_product(conn, product_id):
    return unpack(conn.execute("SELECT * FROM products WHERE id=?", (product_id,)).fetchone())


def list_products(conn):
    return [unpack(row) for row in conn.execute("SELECT * FROM products ORDER BY created_at DESC, id")]


def insert(conn, payload):
    product_id, timestamp = uuid4().hex, now()
    conn.execute("INSERT INTO products VALUES (?, ?, ?, ?)", (product_id, json.dumps(payload, ensure_ascii=False), timestamp, timestamp))
    return get_product(conn, product_id)


def update(conn, product_id, payload):
    conn.execute("UPDATE products SET payload=?, updated_at=? WHERE id=?", (json.dumps(payload, ensure_ascii=False), now(), product_id))
    return get_product(conn, product_id)


def delete(conn, product_id):
    return conn.execute("DELETE FROM products WHERE id=?", (product_id,)).rowcount


def clear(conn):
    conn.execute("DELETE FROM products")
