"""Categorias e transferência das peças antes da exclusão."""
from fastapi import HTTPException
from backend.db import session as db
from backend.repositories import categories, products
from backend.schemas.categories import CategoryInput
from backend.schemas.products import ProductInput


def list_categories():
    with db.connection() as conn:
        result = categories.list_categories(conn)
        catalog_products = products.list_products(conn)
        for category in result:
            category["product_count"] = sum(p["category"] == category["name"] for p in catalog_products)
        return result


def create_category(payload: CategoryInput):
    with db.connection() as conn:
        if categories.category_name(conn, payload.name):
            raise HTTPException(409, "Essa categoria já está cadastrada.")
        return categories.add_category(conn, payload.name)


def delete_category(category_id: str, replacement_id: str | None = None):
    with db.connection() as conn:
        category = categories.get_category(conn, category_id)
        if category is None:
            raise HTTPException(404, "Categoria não encontrada.")
        affected = [p for p in products.list_products(conn) if p["category"] == category["name"]]
        if affected:
            replacement = categories.get_replacement(conn, replacement_id, category_id)
            if replacement is None:
                raise HTTPException(409, "Escolha outra categoria para receber as peças antes de excluir esta.")
            for product in affected:
                values = {k: v for k, v in product.items() if k in ProductInput.model_fields}
                values["category"] = replacement["name"]
                products.update(conn, product["id"], values)
        categories.delete(conn, category_id)
    return {"ok": True, "moved": len(affected)}
