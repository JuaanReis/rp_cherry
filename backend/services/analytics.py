"""Deduplicação de visualizações e indicadores do painel."""
import hashlib
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from backend.db import session as db
from backend.repositories import analytics, categories, products


def record_view(product_id, visitor):
    today = datetime.now(timezone.utc).date()
    with db.connection() as conn:
        product = products.get_product(conn, product_id)
        if not product or product["status"] != "active":
            raise HTTPException(404, "Peça não encontrada.")
        return analytics.record_view(
            conn,
            product_id,
            hashlib.sha256(visitor.encode()).hexdigest(),
            today.isoformat(),
            (today - timedelta(days=30)).isoformat(),
        )


def dashboard():
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=13)
    with db.connection() as conn:
        catalog = products.list_products(conn)
        active = [product for product in catalog if product["status"] == "active"]
        by_day = analytics.daily_views(conn, start.isoformat())
        by_product = analytics.product_views(conn, start.isoformat())
        by_category = [
            {
                "name": category["name"],
                "products": sum(product["category"] == category["name"] for product in catalog),
                "stock": sum(product["stock"] for product in catalog if product["category"] == category["name"]),
            }
            for category in categories.list_categories(conn)
        ]
    ranking = [
        {"id": product["id"], "name": product["name"], "views": by_product[product["id"]]}
        for product in catalog
        if by_product.get(product["id"], 0)
    ]
    ranking.sort(key=lambda product: (-product["views"], product["name"]))
    most_stock = [
        {"id": product["id"], "name": product["name"], "stock": product["stock"]}
        for product in sorted(catalog, key=lambda product: (-product["stock"], product["name"]))[:5]
    ]
    return {
        "total_products": len(catalog),
        "active_products": len(active),
        "stock_units": sum(product["stock"] for product in catalog),
        "average_price_cents": round(sum(product["price_cents"] for product in active) / len(active)) if active else 0,
        "views_14_days": sum(by_day.values()),
        "daily_views": [
            {"day": (start + timedelta(days=index)).isoformat(), "views": by_day.get((start + timedelta(days=index)).isoformat(), 0)}
            for index in range(14)
        ],
        "most_viewed": ranking[:5],
        "most_stock": most_stock,
        "categories": by_category,
    }
