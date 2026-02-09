#!/usr/bin/env python3
"""
Test script for x402 payment flow (end-to-end).

Usage:
  # Test against local server:
  python3 test_x402_flow.py

  # Test against deployed server:
  python3 test_x402_flow.py https://merchant-backend-production-e43a.up.railway.app

Requires:
  pip install "x402[requests,svm]"

Environment:
  SVM_PRIVATE_KEY  - Solana private key (base58) for the buyer wallet
"""

import json
import os
import sys

import requests as req_lib

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"

def main():
    print(f"🎯 Testing x402 flow against: {BASE_URL}\n")

    # 1. Create a cart
    r = req_lib.post(f"{BASE_URL}/api/cart/")
    r.raise_for_status()
    session_id = r.json()["session_id"]
    print(f"🛒 Cart created: {session_id}")

    # 2. Get a product
    r = req_lib.get(f"{BASE_URL}/api/products/")
    r.raise_for_status()
    products = r.json()["products"]
    if not products:
        print("❌ No products found")
        return
    product = products[0]
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
        headers={"Accept": "application/json", "User-Agent": "x402-test/1.0"},
    )
    print(f"Status: {r.status_code}")
    
    if r.status_code != 402:
        print(f"❌ Expected 402, got {r.status_code}")
        print(f"Body: {r.text[:500]}")
        return

    # Decode payment-required header
    import base64
    pr_header = r.headers.get("payment-required", "")
    if pr_header:
        payment_required = json.loads(base64.b64decode(pr_header))
        print(f"✅ Got 402 with x402 v{payment_required.get('x402Version')} payment requirements:")
        for acc in payment_required.get("accepts", []):
            amount_usdc = int(acc["amount"]) / 1_000_000
            print(f"   💰 {amount_usdc:.2f} USDC on {acc['network']}")
            print(f"   📬 Pay to: {acc['payTo']}")
            print(f"   🏦 Asset: {acc['asset']}")
            if acc.get("extra", {}).get("feePayer"):
                print(f"   🎁 Fee payer (sponsored): {acc['extra']['feePayer']}")
    else:
        print("⚠️  No payment-required header found")

    # 5. If we have a private key, try to pay
    svm_key = os.getenv("SVM_PRIVATE_KEY")
    if not svm_key:
        print("\n⏭️  No SVM_PRIVATE_KEY set — skipping actual payment.")
        print("   Set SVM_PRIVATE_KEY (base58) and fund the wallet with USDC to test payment.")
        return

    print("\n--- Step 5: Paying with x402 client ---")
    try:
        from x402 import x402ClientSync
        from x402.http import x402HTTPClientSync
        from x402.http.clients import x402_requests
        from x402.mechanisms.svm import KeypairSigner
        from x402.mechanisms.svm.exact.register import register_exact_svm_client

        client = x402ClientSync()
        svm_signer = KeypairSigner.from_base58(svm_key)
        register_exact_svm_client(client, svm_signer)

        http_client = x402HTTPClientSync(client)

        with x402_requests(client) as session:
            r2 = session.post(f"{BASE_URL}/api/cart/{session_id}/x402/pay")
            print(f"Status: {r2.status_code}")
            print(f"Body: {json.dumps(r2.json(), indent=2)}")

            if r2.ok:
                try:
                    settle = http_client.get_payment_settle_response(
                        lambda name: r2.headers.get(name)
                    )
                    print(f"\n💳 Settlement: {settle.model_dump_json(indent=2)}")
                except ValueError:
                    print("ℹ️  No settlement response header (may still be pending)")
    except ImportError as e:
        print(f"❌ Missing x402 client packages: {e}")
        print("   Install with: pip install 'x402[requests,svm]'")
    except Exception as e:
        print(f"❌ Payment failed: {e}")

if __name__ == "__main__":
    main()
