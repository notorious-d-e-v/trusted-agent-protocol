"""
x402 payment checkout route.

This endpoint is gated by the x402 middleware. By the time the request
reaches this handler, payment has already been verified and will be
settled automatically by the middleware after the response is sent.

Flow:
  1. Agent POSTs to /api/cart/{session_id}/x402/pay  (no payment header)
     → middleware returns 402 with payment requirements (USDC amount, payTo, network)
  2. Agent signs crypto payment, resubmits with X-Payment header
     → middleware verifies via PayAI facilitator
     → this handler runs: creates order from cart
     → middleware settles payment on-chain
     → response returned with settlement receipt headers
"""

import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload

from app.database.database import get_db
from app.models.models import (
    Cart as CartModel,
    CartItem as CartItemModel,
    Order as OrderModel,
    OrderItem as OrderItemModel,
    Product as ProductModel,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cart", tags=["x402-checkout"])


def _generate_order_number() -> str:
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    uid = uuid.uuid4().hex[:6].upper()
    return f"ORD-{ts}-{uid}"


@router.post("/{session_id}/x402/pay")
async def x402_pay(
    session_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Complete an x402-paid checkout.

    By the time this handler executes, the x402 middleware has already
    verified the client's payment. We just need to create the order.

    The middleware will settle the payment on-chain after we return 200.
    """
    # ------------------------------------------------------------------
    # 1. Load cart
    # ------------------------------------------------------------------
    cart = (
        db.query(CartModel)
        .options(joinedload(CartModel.items).joinedload(CartItemModel.product))
        .filter(CartModel.session_id == session_id)
        .first()
    )

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    if not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # ------------------------------------------------------------------
    # 2. Calculate totals (must match what the middleware charged)
    # ------------------------------------------------------------------
    subtotal = sum(item.product.price * item.quantity for item in cart.items)
    tax_rate = 0.0875
    tax_amount = subtotal * tax_rate
    DIGITAL_CATEGORIES = {
        "digital", "digital services", "api access", "data & analytics",
        "compute", "enterprise", "ai & ml", "software",
    }
    is_digital = all(
        (item.product.category or "").lower() in DIGITAL_CATEGORIES
        for item in cart.items
    )
    shipping_cost = 0.0 if is_digital else 15.0
    total_amount = subtotal + tax_amount + shipping_cost

    # ------------------------------------------------------------------
    # 3. Extract agent identity from CDN proxy headers (if present)
    # ------------------------------------------------------------------
    agent_key_id = request.headers.get("x-agent-keyid", "unknown")
    clawkey_verified = (
        request.headers.get("x-agent-clawkey-verified", "").lower() == "true"
    )
    moltbook_claimed = (
        request.headers.get("x-agent-moltbook-claimed", "").lower() == "true"
    )

    # ------------------------------------------------------------------
    # 4. Trust-gating (optional policy layer on top of x402 payment)
    # ------------------------------------------------------------------
    import os

    limit_clawkey = float(os.getenv("SPEND_LIMIT_CLAWKEY", "2000"))
    limit_high_rep = float(os.getenv("SPEND_LIMIT_HIGH_REP", "20"))
    limit_claimed = float(os.getenv("SPEND_LIMIT_CLAIMED", "5"))
    high_rep_threshold = int(os.getenv("MOLTBOOK_HIGH_KARMA", "100"))

    try:
        moltbook_karma = int(request.headers.get("x-agent-moltbook-karma") or 0)
    except ValueError:
        moltbook_karma = 0

    is_high_rep = moltbook_claimed and moltbook_karma >= high_rep_threshold

    if clawkey_verified:
        spend_limit = limit_clawkey
    elif moltbook_claimed:
        spend_limit = limit_high_rep if is_high_rep else limit_claimed
    else:
        spend_limit = limit_claimed  # Allow small purchases for registered agents

    if total_amount > spend_limit:
        raise HTTPException(
            status_code=403,
            detail=f"Trust-gated: order ${total_amount:.2f} exceeds limit ${spend_limit:.2f}",
        )

    # ------------------------------------------------------------------
    # 5. Create order
    # ------------------------------------------------------------------
    order = OrderModel(
        order_number=_generate_order_number(),
        customer_email=f"agent_{agent_key_id}@x402.pay",
        customer_name=f"Agent {agent_key_id}",
        total_amount=total_amount,
        status="confirmed",
        payment_method="x402_usdc_solana",
        payment_status="settled",
        card_last_four=None,
        card_brand="x402",
    )
    db.add(order)
    db.flush()  # get order.id

    for cart_item in cart.items:
        db.add(
            OrderItemModel(
                order_id=order.id,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                price=cart_item.product.price,
            )
        )

    # Clear the cart
    db.query(CartItemModel).filter(CartItemModel.cart_id == cart.id).delete()
    db.commit()
    db.refresh(order)

    logger.info(
        "x402 order created: %s total=$%.2f agent=%s",
        order.order_number, total_amount, agent_key_id,
    )

    # ------------------------------------------------------------------
    # 6. Response
    # ------------------------------------------------------------------
    tracking = f"TRK{uuid.uuid4().hex[:10].upper()}"

    return {
        "status": "success",
        "message": "x402 checkout completed — payment settled on Solana",
        "order": {
            "id": order.id,
            "order_number": order.order_number,
            "total_amount": round(total_amount, 2),
            "subtotal": round(subtotal, 2),
            "tax_amount": round(tax_amount, 2),
            "shipping_cost": round(shipping_cost, 2),
            "status": order.status,
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "created_at": order.created_at.isoformat(),
            "items": [
                {
                    "product_id": item.product_id,
                    "product_name": item.product.name,
                    "quantity": item.quantity,
                    "unit_price": float(item.price),
                    "total_price": float(item.price * item.quantity),
                }
                for item in order.items
            ],
        },
        "agent": {
            "key_id": agent_key_id,
            "clawkey_verified": clawkey_verified,
            "moltbook_claimed": moltbook_claimed,
        },
        "fulfillment": {
            "tracking_number": tracking,
            "estimated_delivery": "5-7 business days",
            "shipping_carrier": "Standard Shipping",
            "status": "processing",
        },
    }
