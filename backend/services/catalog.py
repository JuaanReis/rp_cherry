"""Importação transacional e exportação do catálogo."""
from backend.db import session as db
from backend.repositories import analytics, categories, products
from backend.schemas.catalog import ImportInput
from backend.schemas.categories import CategoryInput
from backend.schemas.products import ProductInput


def export_catalog():
    with db.connection() as conn:
        catalog_products = [{k: v for k, v in p.items() if k in ProductInput.model_fields} for p in products.list_products(conn)]
        return {"version": 2, "products": catalog_products, "categories": [c["name"] for c in categories.list_categories(conn)]}


def import_catalog(payload: ImportInput):
    names = [CategoryInput(name=name).name for name in payload.categories]
    names += [product.category for product in payload.products]
    # Pydantic validates the entire collection before any rows are changed.
    with db.connection() as conn:
        products.clear(conn)
        analytics.clear(conn)
        for name in names:
            categories.add_category(conn, name)
        for product in payload.products:
            values = product.model_dump()
            values["category"] = categories.category_name(conn, values["category"])
            products.insert(conn, values)
    return {"ok": True, "count": len(payload.products)}
