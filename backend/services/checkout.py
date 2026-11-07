"""Validação do pedido e montagem da mensagem de WhatsApp."""
from urllib.parse import quote
from fastapi import HTTPException
from backend.db import session as db
from backend.repositories import products, settings
from backend.schemas.checkout import CheckoutInput


def money(cents):
    integer, decimal = divmod(cents, 100)
    return "R$ " + f"{integer:,}".replace(",", ".") + f",{decimal:02d}"


def whatsapp_checkout(payload: CheckoutInput):
    with db.connection() as conn:
        shop = settings.get_settings(conn)
        if not shop["whatsapp"]:
            raise HTTPException(409, "O WhatsApp da loja ainda não foi configurado.")
        grouped = {}
        for item in payload.items:
            key = (item.product_id, item.size.upper())
            grouped[key] = grouped.get(key, 0) + item.quantity
        per_product, resolved, total = {}, [], 0
        for (product_id, size), quantity in grouped.items():
            product = products.get_product(conn, product_id)
            if not product or product["status"] != "active":
                raise HTTPException(409, "Uma peça não está mais disponível. Atualize o catálogo.")
            if size not in product["sizes"]:
                raise HTTPException(409, f"O tamanho {size} não está disponível para {product['name']}.")
            per_product[product_id] = per_product.get(product_id, 0) + quantity
            if per_product[product_id] > product["stock"]:
                raise HTTPException(409, f"Estoque insuficiente para {product['name']}. Disponível: {product['stock']}.")
            subtotal = product["price_cents"] * quantity
            total += subtotal
            resolved.append({"product_id": product_id, "name": product["name"], "size": size, "color": product["color"], "quantity": quantity, "unit_price_cents": product["price_cents"], "subtotal_cents": subtotal})
    lines = [f"Olá, {shop['brand_name']}! Gostaria de pedir:", ""]
    for item in resolved:
        detail = f"{item['name']} | tamanho {item['size']}"
        if item["color"]:
            detail += f" | {item['color']}"
        lines.append(f"• {item['quantity']}x {detail} — {money(item['subtotal_cents'])}")
    lines += ["", f"Total das peças: {money(total)}", "Frete e disponibilidade a combinar."]
    message = "\n".join(lines)
    return {"items": resolved, "total_cents": total, "message": message, "whatsapp_url": f"https://wa.me/{shop['whatsapp']}?text={quote(message, safe='')}"}
