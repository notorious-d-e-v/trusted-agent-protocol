#!/usr/bin/env python3
"""
Generate agent spending wallets for x402 payments and write them to .env.

Creates:
  - A Solana keypair (private key for signing x402 payments)
  - An EVM account (private key for signing x402 payments)
  - Appends/updates wallet vars in .env

Run once:  python setup_x402_wallet.py
"""

import os
import sys
from pathlib import Path

ENV_PATH = Path(__file__).parent / ".env"


def generate_solana_keypair():
    """Return (base58_private_key, base58_public_address)."""
    from solders.keypair import Keypair  # installed via x402[svm]

    kp = Keypair()
    return str(kp), str(kp.pubkey())


def generate_evm_account():
    """Return (hex_private_key_with_0x, hex_address)."""
    from eth_account import Account  # installed via eth-account

    acct = Account.create()
    return acct.key.hex(), acct.address


def upsert_env(key: str, value: str):
    """Insert or update a key=value in .env, preserving other content."""
    lines = []
    found = False

    if ENV_PATH.exists():
        lines = ENV_PATH.read_text().splitlines(keepends=True)
        new_lines = []
        for line in lines:
            stripped = line.lstrip()
            if stripped.startswith(f"{key}="):
                new_lines.append(f"{key}={value}\n")
                found = True
            else:
                new_lines.append(line)
        lines = new_lines

    if not found:
        if lines and not lines[-1].endswith("\n"):
            lines[-1] += "\n"
        lines.append(f"{key}={value}\n")

    ENV_PATH.write_text("".join(lines))


def main():
    print("=== x402 Agent Wallet Setup ===\n")

    # --- Solana ---
    try:
        svm_privkey, svm_address = generate_solana_keypair()
        print(f"Solana address:     {svm_address}")
        print(f"  (private key stored in .env as SVM_PRIVATE_KEY)")
        upsert_env("SVM_PRIVATE_KEY", svm_privkey)
    except ImportError:
        print("Skipping Solana — 'solders' not installed (pip install x402[svm])")
        svm_address = None

    # --- EVM ---
    try:
        evm_privkey, evm_address = generate_evm_account()
        print(f"EVM address:        {evm_address}")
        print(f"  (private key stored in .env as EVM_PRIVATE_KEY)")
        upsert_env("EVM_PRIVATE_KEY", evm_privkey)
    except ImportError:
        print("Skipping EVM — 'eth_account' not installed (pip install eth-account)")
        evm_address = None

    print(f"\nWrote configuration to {ENV_PATH}")

    # --- Next steps ---
    print("\n--- Next Steps ---")
    if svm_address:
        print(f"1. Fund Solana wallet with devnet SOL:  https://faucet.solana.com/")
        print(f"2. Get testnet USDC:                    https://faucet.circle.com")
        print(f"   Fund address: {svm_address}")
    if evm_address:
        print(f"3. Fund EVM wallet with Base Sepolia ETH + testnet USDC:")
        print(f"   https://faucet.circle.com")
        print(f"   Fund address: {evm_address}")
    print(f"\n4. Run the merchant setup script too:")
    print(f"   cd ../merchant-backend && python setup_x402_wallet.py")


if __name__ == "__main__":
    main()
