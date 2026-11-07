"""Rota para preparar um pedido pelo WhatsApp."""
from fastapi import APIRouter

from backend.schemas.checkout import CheckoutInput
from backend.services import checkout

router = APIRouter(prefix="/checkout", tags=["Pedidos"])


@router.post("")
def whatsapp_checkout(payload: CheckoutInput):
    return checkout.whatsapp_checkout(payload)
