"""Regras de publicação, cadastro, edição e duplicação de produtos."""
from fastapi import HTTPException
from backend.db import session as db
from backend.repositories import analytics, categories, products
from backend.schemas.products import ProductInput


def catalog():
    with db.connection() as conn:
        catalog_products = [p for p in products.list_products(conn) if p["status"] == "active"]
    return sorted(catalog_products, key=lambda p: not p["featured"])


def all_products():
    with db.connection() as conn:
        return products.list_products(conn)


def create_product(payload: ProductInput):
    with db.connection() as conn:
        values = payload.model_dump()
        values["category"] = categories.category_name(conn, values["category"])
        if values["category"] is None:
            raise HTTPException(422, "Escolha uma categoria cadastrada no painel.")
        return products.insert(conn, values)


def edit_product(product_id: str, payload: ProductInput):
    with db.connection() as conn:
        if products.get_product(conn, product_id) is None:
            raise HTTPException(404, "Peça não encontrada.")
        values = payload.model_dump()
        values["category"] = categories.category_name(conn, values["category"])
        if values["category"] is None:
            raise HTTPException(422, "Escolha uma categoria cadastrada no painel.")
        return products.update(conn, product_id, values)


def delete_product(product_id: str):
    with db.connection() as conn:
        deleted = products.delete(conn, product_id)
        if deleted == 0:
            raise HTTPException(404, "Peça não encontrada.")
        analytics.delete_product(conn, product_id)
    return {"ok": True}


def duplicate_product(product_id: str):
    with db.connection() as conn:
        product = products.get_product(conn, product_id)
        if product is None:
            raise HTTPException(404, "Peça não encontrada.")
        payload = ProductInput.model_validate({k: v for k, v in product.items() if k in ProductInput.model_fields}).model_dump()
        payload.update(name=payload["name"][:92] + " (cópia)", status="draft")
        return products.insert(conn, payload)
