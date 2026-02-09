"""
x402 Payment Protocol integration for the merchant backend.

Configures the x402 middleware with:
- PayAI facilitator for payment verification & settlement
- Solana mainnet USDC payments
- Base mainnet USDC payments
- Dynamic pricing based on cart contents
"""

import logging
import os
import re

from x402.http import FacilitatorConfig, HTTPFacilitatorClient, PaymentOption
from x402.http.middleware.fastapi import PaymentMiddlewareASGI, payment_middleware
from x402.http.types import HTTPRequestContext, RouteConfig
from x402.mechanisms.svm.exact import ExactSvmServerScheme
from x402.mechanisms.evm.exact import ExactEvmServerScheme
from x402.schemas import Network
from x402.server import x402ResourceServer

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration (env-overridable)
# ---------------------------------------------------------------------------

# Merchant wallet addresses
SVM_ADDRESS = os.getenv(
    "SVM_ADDRESS",
    "4zHkvLcPUeNDkR4swKoYHjbDhgoNPMxB3x1Ve3cqhvAe",
)
EVM_ADDRESS = os.getenv(
    "EVM_ADDRESS",
    "0xEF78657456C6618a299309E880ee99502C6F6B8f",
)

# Networks
SVM_NETWORK: Network = os.getenv(
    "SVM_NETWORK",
    "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",  # Solana mainnet
)
EVM_NETWORK: Network = os.getenv(
    "EVM_NETWORK",
    "eip155:8453",  # Base mainnet
)

# Facilitator
FACILITATOR_URL = os.getenv(
    "FACILITATOR_URL",
    "https://facilitator.payai.network",
)

# ---------------------------------------------------------------------------
# Dynamic price callback
# ---------------------------------------------------------------------------

def _get_cart_total(context: HTTPRequestContext) -> str:
    """
    Dynamic price callback – extracts session_id from the request path,
    looks up the cart in the DB, and returns the USD total as a price string.

    Path pattern: /api/cart/{session_id}/x402/pay
    """
    from app.database.database import SessionLocal
    from app.models.models import Cart as CartModel

    # Extract session_id from path
    match = re.search(r"/api/cart/([^/]+)/x402/pay", context.path)
    if not match:
        logger.warning("x402 dynamic price: could not extract session_id from %s", context.path)
        return "$0.01"  # fallback minimum

    session_id = match.group(1)

    db = SessionLocal()
    try:
        cart = db.query(CartModel).filter(CartModel.session_id == session_id).first()
        if not cart or not cart.items:
            logger.warning("x402 dynamic price: empty/missing cart %s", session_id)
            return "$0.01"

        subtotal = sum(item.product.price * item.quantity for item in cart.items)
        tax_amount = subtotal * 0.0875  # 8.75%
        # Digital-only carts: no shipping
        is_digital = all(
            (item.product.category or "").lower() == "digital" for item in cart.items
        )
        shipping = 0.0 if is_digital else 15.0
        total = subtotal + tax_amount + shipping

        price_str = f"${total:.2f}"
        logger.info(
            "x402 dynamic price for cart %s: %s (subtotal=%.2f tax=%.2f ship=%.2f)",
            session_id, price_str, subtotal, tax_amount, shipping,
        )
        return price_str
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Build x402 server + middleware
# ---------------------------------------------------------------------------

def create_x402_middleware():
    """
    Build and return the x402 payment middleware function for FastAPI.

    Supports two payment networks:
      - Solana mainnet (USDC via SPL token)
      - Base mainnet (USDC via ERC-20)

    The buyer's x402 client picks whichever network it has funds on.
    """
    facilitator = HTTPFacilitatorClient(FacilitatorConfig(url=FACILITATOR_URL))

    server = x402ResourceServer(facilitator)
    server.register(SVM_NETWORK, ExactSvmServerScheme())
    server.register(EVM_NETWORK, ExactEvmServerScheme())

    # Route config: gate the x402 checkout endpoint with dynamic pricing
    # Both networks offered — client picks the one it can pay with
    routes = {
        "POST /api/cart/*/x402/pay": RouteConfig(
            accepts=[
                PaymentOption(
                    scheme="exact",
                    pay_to=SVM_ADDRESS,
                    price=_get_cart_total,  # dynamic!
                    network=SVM_NETWORK,
                ),
                PaymentOption(
                    scheme="exact",
                    pay_to=EVM_ADDRESS,
                    price=_get_cart_total,  # dynamic!
                    network=EVM_NETWORK,
                ),
            ],
            description="Checkout & pay for cart via x402 (USDC on Solana or Base)",
            mime_type="application/json",
        ),
    }

    logger.info(
        "x402 configured: facilitator=%s networks=[%s, %s] payTo=[%s, %s]",
        FACILITATOR_URL, SVM_NETWORK, EVM_NETWORK, SVM_ADDRESS, EVM_ADDRESS,
    )

    return payment_middleware(routes, server)
