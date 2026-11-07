"""Leitura e gravação das configurações da loja."""
import json


def get_settings(conn):
    defaults = {
        "brand_name": "RP Modas Cereja",
        "whatsapp": "",
        "instagram_enabled": False,
        "instagram_profile": "",
        "tiktok_enabled": False,
        "tiktok_profile": "",
    }
    return {**defaults, **json.loads(conn.execute("SELECT value FROM settings WHERE key='shop'").fetchone()["value"])}


def save_settings(conn, values):
    conn.execute("UPDATE settings SET value=? WHERE key='shop'", (json.dumps(values, ensure_ascii=False),))
    return get_settings(conn)
