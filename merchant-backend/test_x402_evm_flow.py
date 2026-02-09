#!/usr/bin/env python3
"""
Test script for x402 EVM (Base mainnet) payment flow.

Usage:
  python3 test_x402_evm_flow.py [BASE_URL]

Defaults to local server. Uses EVM buyer wallet from secrets.
"""

import base64
import json
import os
import sys

import requests as req_lib

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"

# Load EVM buyer key
SECRETS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "secrets")
with open(os.path.join(SECRETS_DIR, "evm-buyer-wallet.json")) as f:
    evm_wallet = json.load(f)
EVM_PRIVATE_KEY = evm_wallet["privateKey"]

def main():
    print(f"🎯 Testing x402 EVM flow against: {BASE_URL}\n")

    # 1. Create a cart
    r = req_lib.post(f"{BASE_URL}/api/cart/")
    r.raise_for_status()
    session_id = r.json()["session_id"]
    print(f"🛒 Cart created: {session_id}")

    # 2. Get a product (prefer cheap digital items to stay under wallet balance)
    r = req_lib.get(f"{BASE_URL}/api/products/?limit=50")
    r.raise_for_status()
    products = r.json()["products"]
    if not products:
        print("❌ No products found")
        return
    # Pick cheapest digital product for minimal test (no shipping)
    digitals = [p for p in products if (p.get("category", "")).lower() == "digital"]
    product = min(digitals if digitals else products, key=lambda p: p["price"])
    print(f"📦 Product: {product['name']} - ${product['price']}")

    # 3. Add to cart
    r = req_lib.post(
        f"{BASE_URL}/api/cart/{session_id}/items",
        json={"product_id": product["id"], "quantity": 1},
    )
    r.raise_for_status()
    print("✅ Added to cart")

    # 4. Hit x402 pay WITHOUT payment header → expect 402
    print("\n--- Step 4: Request without payment (expect 402) ---")
    r = req_lib.post(
        f"{BASE_URL}/api/cart/{session_id}/x402/pay",
        headers={"Accept": "application/json"},
    )
    print(f"Status: {r.status_code}")

    if r.status_code != 402:
        print(f"❌ Expected 402, got {r.status_code}")
        print(f"Body: {r.text[:500]}")
        return

    pr_header = r.headers.get("payment-required", "")
    if pr_header:
        payment_required = json.loads(base64.b64decode(pr_header))
        print(f"✅ Got 402 with x402 v{payment_required.get('x402Version')} payment requirements:")
        for acc in payment_required.get("accepts", []):
            amount_usdc = int(acc["amount"]) / 1_000_000
            print(f"   💰 {amount_usdc:.2f} USDC on {acc['network']}")
            print(f"   📬 Pay to: {acc['payTo']}")
            if acc.get("extra", {}).get("feePayer"):
                print(f"   🎁 Fee payer (sponsored): {acc['extra']['feePayer']}")

    # 5. Pay with EVM x402 client
    print("\n--- Step 5: Paying with x402 EVM client ---")
    try:
        from x402 import x402ClientSync
        from x402.http import x402HTTPClientSync
        from x402.http.clients import x402_requests
        from x402.mechanisms.evm.exact.register import register_exact_evm_client
        from x402.mechanisms.evm.signers import EthAccountSigner
        from eth_account import Account

        client = x402ClientSync()
        acct = Account.from_key(EVM_PRIVATE_KEY)
        evm_signer = EthAccountSigner(acct)
        register_exact_evm_client(client, evm_signer)

        http_client = x402HTTPClientSync(client)

        with x402_requests(client) as session:
            r2 = session.post(f"{BASE_URL}/api/cart/{session_id}/x402/pay")
            print(f"Status: {r2.status_code}")
            if r2.status_code == 200:
                body = r2.json()
                print(f"✅ Order confirmed!")
                print(f"   Order ID: {body.get('order_id')}")
                print(f"   Total: ${body.get('total', 'N/A')}")
                # Check for settlement info
                try:
                    settle = http_client.get_payment_settle_response(
                        lambda name: r2.headers.get(name)
                    )
                    print(f"   💳 Settlement: {settle.model_dump_json(indent=2)}")
                except (ValueError, Exception):
                    print("   ℹ️  No settlement response header")
            else:
                print(f"❌ Payment failed: {r2.text[:500]}")

    except ImportError as e:
        print(f"❌ Missing packages: {e}")
        print("   Install with: pip install 'x402[requests,evm]'")
    except Exception as e:
        import traceback
        print(f"❌ Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    main()
