#!/usr/bin/env bash
# =============================================================================
# TrustedClaw Agent Demo — End-to-end purchase using AgentWallet
#
# Demonstrates the full flow:
#   1. Agent browses the TrustedClaw merchant store
#   2. Agent adds items to cart
#   3. Agent pays with USDC on Solana via x402 (through AgentWallet)
#
# Prerequisites:
#   - AgentWallet account (see https://agentwallet.mcpay.tech/skill.md)
#   - Config at ~/.agentwallet/config.json with apiToken
#   - USDC balance on Solana (fund at https://agentwallet.mcpay.tech/u/USERNAME)
#
# Usage:
#   ./scripts/agent-demo-agentwallet.sh
#
# Environment variables (optional):
#   MERCHANT_URL    — Merchant backend URL (default: https://merchant-backend-production-e43a.up.railway.app)
#   CDN_PROXY_URL   — CDN proxy URL (default: https://cdn-proxy-production.up.railway.app)
#   AGENTWALLET_CONFIG — Path to AgentWallet config (default: ~/.agentwallet/config.json)
# =============================================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

MERCHANT_URL="${MERCHANT_URL:-https://merchant.trustedclaw.cc}"
CDN_PROXY_URL="${CDN_PROXY_URL:-https://cdn-proxy-production.up.railway.app}"
AGENTWALLET_CONFIG="${AGENTWALLET_CONFIG:-$HOME/.agentwallet/config.json}"
AW_BASE="https://agentwallet.mcpay.tech/api"

# Load AgentWallet config
if [ ! -f "$AGENTWALLET_CONFIG" ]; then
  echo -e "${RED}Error: AgentWallet config not found at $AGENTWALLET_CONFIG${NC}"
  echo "Run the AgentWallet connect flow first: https://agentwallet.mcpay.tech/skill.md"
  exit 1
fi

AW_USERNAME=$(python3 -c "import json; print(json.load(open('$AGENTWALLET_CONFIG'))['username'])")
AW_TOKEN=$(python3 -c "import json; print(json.load(open('$AGENTWALLET_CONFIG'))['apiToken'])")
AW_SOLANA=$(python3 -c "import json; print(json.load(open('$AGENTWALLET_CONFIG'))['solanaAddress'])")

echo -e "${PURPLE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║   🐾 TrustedClaw — Agent Purchase Demo       ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Agent:${NC}     $AW_USERNAME"
echo -e "${BLUE}Wallet:${NC}    $AW_SOLANA (Solana)"
echo -e "${BLUE}Merchant:${NC}  $MERCHANT_URL"
echo ""

# Step 1: Check wallet balance
echo -e "${YELLOW}━━━ Step 1: Check wallet balance ━━━${NC}"
BALANCE_RESP=$(curl -s "$AW_BASE/wallets/$AW_USERNAME/balances" -H "Authorization: Bearer $AW_TOKEN")
SOL_BALANCE=$(echo "$BALANCE_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for w in d.get('solanaWallets',[]):
  for b in w.get('balances',[]):
    if b['chain']=='solana' and b['asset']=='usdc':
      raw=int(b['rawValue'])
      print(f'{raw/1e6:.2f}')
      exit()
print('0.00')
" 2>/dev/null)
echo -e "  USDC balance: ${GREEN}\$${SOL_BALANCE}${NC}"
echo ""

# Step 2: Browse products
echo -e "${YELLOW}━━━ Step 2: Browse merchant products ━━━${NC}"
PRODUCTS=$(curl -sL "$MERCHANT_URL/api/products/?limit=15")
echo "$PRODUCTS" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'  Found {d[\"total\"]} products:')
for p in d['products']:
  tier = 1 if p['price'] <= 5 else (2 if p['price'] <= 20 else 3)
  tier_label = {1: '✓ Tier 1', 2: '★ Tier 2', 3: '🛡️ Tier 3'}[tier]
  print(f'    #{p[\"id\"]:3d} | \${p[\"price\"]:>8.2f} | {tier_label:12s} | {p[\"name\"]}')
"
echo ""

# Step 3: Create cart and add a Tier 1 item
echo -e "${YELLOW}━━━ Step 3: Create cart & add item ━━━${NC}"
CART_RESP=$(curl -sL -X POST "$MERCHANT_URL/api/cart/")
SESSION_ID=$(echo "$CART_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['session_id'])")
echo -e "  Cart created: session ${BLUE}$SESSION_ID${NC}"

# Pick the cheapest product (Tier 1)
PRODUCT_ID=$(echo "$PRODUCTS" | python3 -c "
import sys,json
d=json.load(sys.stdin)
cheapest=min(d['products'], key=lambda p: p['price'])
print(cheapest['id'])
")
PRODUCT_NAME=$(echo "$PRODUCTS" | python3 -c "
import sys,json
d=json.load(sys.stdin)
cheapest=min(d['products'], key=lambda p: p['price'])
print(cheapest['name'])
")
PRODUCT_PRICE=$(echo "$PRODUCTS" | python3 -c "
import sys,json
d=json.load(sys.stdin)
cheapest=min(d['products'], key=lambda p: p['price'])
print(f'{cheapest[\"price\"]:.2f}')
")

ADD_RESP=$(curl -sL -X POST "$MERCHANT_URL/api/cart/$SESSION_ID/items" \
  -H "Content-Type: application/json" \
  -d "{\"product_id\": $PRODUCT_ID, \"quantity\": 1}")
echo -e "  Added: ${GREEN}$PRODUCT_NAME${NC} (\$$PRODUCT_PRICE)"
echo ""

# Step 4: View cart
echo -e "${YELLOW}━━━ Step 4: View cart ━━━${NC}"
CART=$(curl -sL "$MERCHANT_URL/api/cart/$SESSION_ID")
echo "$CART" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for item in d.get('items',[]):
  p=item['product']
  print(f'  {p[\"name\"]} x{item[\"quantity\"]} = \${p[\"price\"]*item[\"quantity\"]:.2f}')
total=sum(i['product']['price']*i['quantity'] for i in d.get('items',[]))
print(f'  ─────────────────────')
print(f'  Total: \${total:.2f} USDC')
"
echo ""

# Step 5: Pay via x402 using AgentWallet
echo -e "${YELLOW}━━━ Step 5: x402 Payment via AgentWallet ━━━${NC}"
echo -e "  Using AgentWallet x402/fetch (one-step payment proxy)..."
echo -e "  Target: ${BLUE}$MERCHANT_URL/api/cart/$SESSION_ID/x402/pay${NC}"
echo ""

X402_RESP=$(curl -s -X POST "$AW_BASE/wallets/$AW_USERNAME/actions/x402/fetch" \
  -H "Authorization: Bearer $AW_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$MERCHANT_URL/api/cart/$SESSION_ID/x402/pay\",
    \"method\": \"POST\",
    \"body\": {},
    \"preferredChain\": \"solana\",
    \"dryRun\": true
  }")

echo -e "  ${PURPLE}x402 dry run response:${NC}"
echo "$X402_RESP" | python3 -m json.tool 2>/dev/null || echo "$X402_RESP"
echo ""

# Check if it would succeed
WOULD_PAY=$(echo "$X402_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
pay=d.get('payment',{})
if pay.get('required'):
  print(f'Payment would be: {pay.get(\"amountFormatted\",\"?\")}'
        f' on {pay.get(\"chain\",\"?\")}')
  if pay.get('policyAllowed'):
    print('Policy: ALLOWED')
  else:
    print('Policy: DENIED')
else:
  print('No payment required or error')
" 2>/dev/null || echo "Could not parse response")
echo -e "  ${GREEN}$WOULD_PAY${NC}"
echo ""

echo -e "${PURPLE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║   Demo complete!                              ║${NC}"
echo -e "${PURPLE}║                                               ║${NC}"
echo -e "${PURPLE}║   To execute a real payment, remove dryRun    ║${NC}"
echo -e "${PURPLE}║   and ensure your wallet has USDC balance.    ║${NC}"
echo -e "${PURPLE}║                                               ║${NC}"
echo -e "${PURPLE}║   Fund wallet: agentwallet.mcpay.tech/u/$AW_USERNAME  ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════╝${NC}"
