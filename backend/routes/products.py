"""Rotas públicas e administrativas dos produtos."""
from fastapi import APIRouter

from backend.schemas.products import ProductInput
from backend.services import products

router = APIRouter(prefix="/products", tags=["Catálogo"])
admin_router = APIRouter(prefix="/products", tags=["Produtos · Admin"])


@router.get("")
def catalog():
    return products.catalog()


@admin_router.get("")
def all_products():
    return products.all_products()


@admin_router.post("", status_code=201)
def create_product(payload: ProductInput):
    return products.create_product(payload)


@admin_router.put("/{product_id}")
def edit_product(product_id: str, payload: ProductInput):
    return products.edit_product(product_id, payload)


@admin_router.delete("/{product_id}")
def delete_product(product_id: str):
    return products.delete_product(product_id)


@admin_router.post("/{product_id}/duplicate", status_code=201)
def duplicate_product(product_id: str):
    return products.duplicate_product(product_id)
