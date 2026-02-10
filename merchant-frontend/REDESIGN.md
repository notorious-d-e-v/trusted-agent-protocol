# Merchant Frontend Redesign Plan

**Goal:** Transform the generic Visa sample merchant into a polished TrustedClaw demo store that visually showcases agent trust verification, tiered access, and x402 USDC payments on Solana.

**Tech:** Vite + React (JSX), inline styles (existing pattern), no new dependencies unless necessary. Keep it simple — this ships in hours, not days.

**Live at:** trustedclaw.cc (via Railway, CDN proxy routes /api to merchant-backend)

---

## Section 1: Rebrand & Visual Overhaul

**Files to change:** `Header.jsx`, `App.jsx`, `index.html`, all page components

### Changes:
- Rename "TAP Sample Merchant" → **"TrustedClaw"** everywhere (header, footer, page title)
- New color palette:
  - Primary: `#6C5CE7` (purple) — trust/identity vibe
  - Secondary: `#00B894` (green) — payment/success
  - Dark bg: `#1A1A2E` (deep navy)
  - Card bg: `#16213E` or `#FFFFFF` depending on context
  - Accent: `#F39C12` (gold) — for trust badges
  - Danger/price: `#E17055`
- Header: gradient background (`#6C5CE7` → `#1A1A2E`), TrustedClaw logo text, tagline "Agent Commerce, Verified"
- Footer: dark, minimal, link to GitHub repos + "Powered by x402 on Solana"
- Hero banner on products page: brief explainer — "A trust-verified marketplace where AI agents shop with real USDC on Solana"
- Update `<title>` in index.html to "TrustedClaw — Trusted Agent Commerce"

---

## Section 2: Trust Tier UI

**Files to change:** `Header.jsx` (new trust badge), `ProductCard.jsx`, new `TrustBadge.jsx` component

### Trust Tier Display:
Create a `TrustBadge` component that shows agent trust level:

| Tier | Label | Color | Icon |
|------|-------|-------|------|
| 0 | Unknown | `#636E72` (gray) | 🚫 |
| 1 | Registered | `#0984E3` (blue) | ✓ |
| 2 | Reputable | `#F39C12` (gold) | ★ |
| 3 | Verified | `#00B894` (green) | 🛡️ |

### Header Integration:
- Add trust badge to header right side showing current agent tier
- For the demo, read trust tier from a query param (`?tier=2`) or a context/state so it can be toggled

### Product Cards:
- Each product has a `min_trust_tier` (0-3) based on price:
  - $0-5: Tier 1 (Registered)
  - $5-20: Tier 2 (Reputable)  
  - $20+: Tier 3 (Verified)
- Show a small trust tier badge on each card: "Requires Tier 2 ★"
- If agent's tier is below required: overlay with semi-transparent lock, "Upgrade trust to purchase"
- If agent's tier meets requirement: normal display, green "Add to Cart"

### Implementation Notes:
- Trust tier can be passed via `X-Trust-Tier` header from CDN proxy (already happens in the real flow)
- For the demo frontend, use React context with a tier selector dropdown (for video demonstration)
- Store in `TrustContext.jsx`

---

## Section 3: Product Catalog Update

**Files to change:** `create_sample_data.py` (backend), `SearchFilters.jsx` (new categories)

### New Product Mix:
Replace current generic products with a curated catalog that demonstrates trust tiers:

**Tier 1 items ($0.50 - $4.99) — Any registered agent can buy:**
- API Health Check (single call) — $0.50
- Weather Data Query — $1.00
- Basic Analytics Report — $2.99
- Stock Quote Bundle (10 queries) — $3.99
- Digital Sticker Pack — $1.99

**Tier 2 items ($5 - $19.99) — Reputable agents:**
- Premium API Access (1 hour) — $9.99
- Market Intelligence Report — $14.99
- Compute Credits (1 GPU-hour) — $12.99
- Dataset: Public Sentiment Analysis — $7.99
- Smart Contract Audit (basic) — $19.99

**Tier 3 items ($20 - $2000) — Verified agents only:**
- Enterprise API Key (monthly) — $49.99
- Full Market Dataset (annual) — $199.99
- Dedicated Compute Instance (day) — $89.99
- Custom ML Model Training — $499.99
- Premium SLA Support Package — $999.99

**Categories:** Digital Services, Data & Analytics, Compute, API Access, Enterprise

### SearchFilters Update:
- Replace old categories (Electronics, Sports, etc.) with new ones
- Add a "Trust Tier" filter dropdown

---

## Section 4: x402 Payment Visibility

**Files to change:** `CheckoutPage.jsx`, new `X402PaymentFlow.jsx` component

### Changes:
- Remove the credit card form entirely (this is an agent commerce demo, not a human checkout)
- Replace with **"Pay with USDC on Solana"** as the primary (only) payment method
- Show payment flow steps visually:
  1. "🔍 Verifying agent identity..." (TAP signature check)
  2. "🛡️ Trust tier confirmed: Tier X" (trust enrichment)
  3. "💰 Payment required: $X.XX USDC" (402 response)
  4. "✍️ Signing transaction..." (x402 client signs)
  5. "⛓️ Settling on Solana..." (PayAI facilitator)
  6. "✅ Payment confirmed!" (with Solana explorer link)
- For the demo, this can be an animated sequence that plays when "Pay with USDC" is clicked
- Show Solana and Base network options (both supported)

### Order Summary:
- Display prices in both USD and USDC
- Show "Gas fees: Sponsored by PayAI" badge
- Show network: "Solana Mainnet" with Solana logo

---

## Section 5: "How It Works" Page

**Files to add:** `HowItWorksPage.jsx`, route in `App.jsx`

### Content:
A visual explanation page accessible from the header nav:

1. **Agent Identity** — "Agents register Ed25519 device keys with the TrustedClaw registry"
   - Visual: Agent icon → Registry → Key stored
   
2. **Trust Enrichment** — "CDN proxy verifies TAP signatures and enriches with trust signals"
   - Visual: Request → CDN Proxy → ClawKey check → Moltbook check → Trust headers added

3. **Spend Gating** — "Merchants enforce tiered spend limits based on trust level"
   - Visual: Trust tier table with color-coded limits

4. **Payment** — "Real USDC settlement on Solana via x402"
   - Visual: 402 flow diagram → PayAI → Solana

5. **Links:**
   - GitHub: both repos
   - x402 protocol: x402.org
   - Visa TAP: original repo
   - ClawKey, Moltbook, PayAI, OpenClaw links

### Design:
- Clean, scrollable single-page layout
- Each section is a card with an icon/illustration on one side and text on the other
- Alternating left/right layout
- Use CSS only — no images needed, use emoji or Unicode symbols for icons

---

## Execution Notes

- Each section is independent and can be built in parallel
- Section 1 (rebrand) should be done first as it sets the visual foundation
- Section 3 (products) requires a backend change (create_sample_data.py) — redeploy needed
- Sections 2 and 4 are the most impactful for the demo video
- Section 5 is nice-to-have but helps judges understand the architecture
- Test locally with `npm run dev` before pushing
- Push to git → Railway auto-deploys
