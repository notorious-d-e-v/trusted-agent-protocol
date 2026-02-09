# Trusted Agent Protocol — Extended

> **This is a fork of [Visa's Trusted Agent Protocol](https://github.com/visa/trusted-agent-protocol)** that extends the reference implementation with real payment settlement, multi-network crypto payments, and a trust-tiered authorization model.

*Establishing a universal standard of trust between AI agents and merchants for the next phase of agentic commerce.*

---

## What This Fork Adds

Visa's original TAP provides cryptographic agent identity verification. This fork takes it further — from *"is this agent legitimate?"* all the way to *"agent verified, payment settled, order confirmed."*

### 🛡️ Trust-Tiered Spend Limits
The CDN proxy enriches each request with trust signals from external sources, and the merchant enforces spend limits accordingly:

| Tier | Source | Spend Limit |
|------|--------|-------------|
| 0 | Unknown agent | Blocked |
| 1 | Registry-known (valid [OpenClaw](https://github.com/openclaw/openclaw) device key) | $5/tx |
| 2 | [ClawKey](https://clawkey.com) verified (human owner) | $100/tx |
| 3 | [Moltbook](https://moltbook.com) reputation + Tier 2 | $500/tx |
| 4 | Merchant-approved allowlist | Unlimited |

### 🔗 Real Payment Settlement via x402
Instead of mock checkouts, agents pay with real USDC using the [x402 protocol](https://www.x402.org/) (HTTP 402 Payment Required). The merchant backend returns a `402` with payment requirements, the agent's x402 client signs and submits payment, and the [PayAI facilitator](https://facilitator.payai.network) settles on-chain — all in a single HTTP round-trip.

- **Dual-network support:** Solana mainnet and Base (EVM) mainnet USDC
- **Sponsored gas fees:** PayAI covers transaction fees on both networks — agents don't need SOL or ETH
- **Dynamic pricing:** Payment amounts are computed from actual cart contents (subtotal + tax + conditional shipping)

### 🏗️ Production-Ready Architecture
- **CDN Proxy** verifies TAP signatures, enriches requests with trust headers, and proxies to the merchant
- **Merchant Backend** enforces trust tiers and gates checkout behind x402 payment middleware
- **All services deployed on Railway** with a working end-to-end demo

### 📊 What Changed (vs upstream)
- `merchant-backend/` — x402 payment middleware, trust-tiered spend limits, dynamic pricing, x402 checkout endpoint
- `cdn-proxy/` — ClawKey/Moltbook trust enrichment, configurable registry + frontend URLs
- Test scripts for both Solana and EVM payment flows
- Railway deployment configs for all services

---

## The Challenge

AI agents are becoming part of everyday commerce, capable of executing complex tasks like booking travel or managing subscriptions. As agent capabilities evolve, merchants need visibility into their identities and actions more than ever.

**For an agent to make a purchase, merchants must answer:**

-  Is this a legitimate, trusted, and recognized AI agent?
-  Is it acting on behalf of a specific, authenticated user?
-  Does the agent carry valid instructions from the user to make this purchase?

**Without a standard, merchants face an impossible choice:**
-  Block potentially valuable agent-driven commerce
-  Accept significant operational and security risks from unverified agents

## The Solution

Visa's **Trusted Agent Protocol** provides a standardized, cryptographic method for an AI agent to prove its identity and associated authorization directly to merchants. By presenting a secure digital signature with every interaction, a merchant can verify that an agent is legitimate and has the user's permission to act.

For merchants, the Trusted Agent Protocol describes a standardized set of mechanisms enabling merchants to:

- **Cryptographically Verify Agent Intent:** Instantly distinguish a legitimate, credentialed agent from an anonymous bot. The agent presents a secure signature that includes timestamps, a unique session identifier, key identifier, and algorithm identifier, allowing you to verify that the signature is current and prevent relays or replays. 

- **Confirm Transaction-Specific Authorization:** Ensure the agent is authorized for the specific action it is taking  (browsing or payment) as the signature is bound to your domain and the specific operation being performed.

- **Receive Trusted User & Payment Identifiers:** Securely receive key information needed for checkout via query parameters. This can include, as consented by the consumer, verifiable consumer identifiers, Payment Account References (PARs) for cards on file, or other identifiers like loyalty numbers, emails and phone numbers, allowing you to streamline or pre-fill the customer experience.

- **Reduce Fraud:** By trusting the agent's identity and intentions, merchants can create a more seamless path to purchase for customers using agents. This cryptographic proof of identity and intent provides a powerful new tool to reduce fraud and minimize chargebacks from unauthorized transactions.

## Key Benefits

- **Differentiate from Malicious Actors:** The Trusted Agent Protocol provides a definitive way for you to distinguish legitimate, authorized AI agents from other automated traffic. This allows you to confidently welcome agent-driven commerce while protecting your site from harmful bots.

- **Context-Bound Security:** Every request from a trusted agent is cryptographically locked to a merchant's specific website and the exact page with which the agent is interacting . This ensures that an agent's authorization cannot be misused elsewhere.

- **Protection Against Replay Attacks:** The protocol is designed to prevent bad actors from capturing and reusing old requests. Each signature includes unique, time-sensitive elements that ensure every request is fresh and valid only for a single use.

- **Securely Receive Customer & Payment Identifiers:** The protocol defines a standardized way for a verified agent to pass essential customer information directly to merchants. This allows merchants to streamline the checkout process by receiving trusted data to pre-fill forms or identify the customer.

## Example Agent Verification for Payments
![](./assets/trusted-agent-protocol-flow.png)

## Quick Start

This repository contains a complete sample implementation demonstrating the Trusted Agent Protocol across multiple components:

### 🚀 **Running the Sample**

1. **Install Dependencies** (from root directory):
   ```bash
   pip install -r requirements.txt
   ```

2. **Start All Services**:
   ```bash
   # Terminal 1: Agent Registry (port 8001)
   cd agent-registry && python main.py
   
   # Terminal 2: Merchant Backend (port 8000)
   cd merchant-backend && python -m uvicorn app.main:app --reload
   
   # Terminal 3: CDN Proxy (port 3002)
   cd cdn-proxy && npm install && npm start
   
   # Terminal 4: Merchant Frontend (port 3001)
   cd merchant-frontend && npm install && npm run dev
   
   # Terminal 5: TAP Agent (port 8501)
   cd tap-agent && streamlit run agent_app.py
   ```

3. **Try the Demo**:
   - Open the TAP Agent at http://localhost:8501
   - Configure merchant URL: http://localhost:3001
   - Generate signatures and interact with the sample merchant

### 📚 **Component Documentation**

Each component has detailed setup instructions:

- **[TAP Agent](./tap-agent/README.md)** - Streamlit app demonstrating agent signature generation
- **[Merchant Frontend](./merchant-frontend/README.md)** - React e-commerce sample with TAP integration  
- **[Merchant Backend](./merchant-backend/README.md)** - FastAPI backend with signature verification
- **[CDN Proxy](./cdn-proxy/README.md)** - Node.js proxy implementing RFC 9421 signature verification
- **[Agent Registry](./agent-registry/README.md)** - Public key registry service for agent verification

### 🏗️ **Architecture Overview**

The sample demonstrates a complete TAP ecosystem:
1. **TAP Agent** generates RFC 9421 compliant signatures
2. **Merchant Frontend** provides the e-commerce interface
3. **CDN Proxy** intercepts and verifies agent signatures  
4. **Merchant Backend** processes verified requests
5. **Agent Registry** manages agent public keys and metadata