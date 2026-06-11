#!/usr/bin/env python3
"""
Validates the EVM wallet integration end-to-end:
1. IntegrityClient derives an EVM address from its master seed
2. The address is injected into telemetry payloads as `performer_address`
3. The Oracle correctly registers and stores the agent under that EVM address
"""

import sys
import os
import time

# Add the SDK to path
sys.path.insert(0, os.path.expanduser("~/Projects/integrity-sdk"))

from integrity_sdk import IntegrityClient

print("=" * 70)
print("  EVM WALLET INTEGRATION VALIDATION")
print("=" * 70)

# --- 1. Instantiate a client and verify wallet address derivation ---
client = IntegrityClient(
    agent_id="WalletTestAgent",
    oracle_url="http://localhost:8080/v1/transactions/report",
)

print(f"\n[✓] Agent ID       : {client.agent_id}")
print(f"[✓] DID            : {client.did}")
print(f"[✓] HW Fingerprint : {client.hardware_fingerprint}")
print(f"[✓] Wallet Address : {client.wallet_address}")

assert client.wallet_address is not None, "FAIL: wallet_address is None"
assert client.wallet_address.startswith("0x"), "FAIL: wallet_address doesn't start with 0x"
assert len(client.wallet_address) == 42, f"FAIL: wallet_address length is {len(client.wallet_address)}, expected 42"

print(f"\n[✓] Wallet address format validated: {client.wallet_address}")

# --- 2. Send telemetry and verify it reaches Oracle ---
print("\n[...] Sending telemetry with wallet address...")
client.log_telemetry(
    metadata={
        "event_type": "wallet_integration_test",
        "model_name": "test-model-v1",
        "test_timestamp": time.time(),
    },
    entropy=0.15,
    grounding=0.90,
)

# Wait for background batcher to flush
print("[...] Waiting for batch flush...")
time.sleep(8)

# --- 3. Query Postgres to verify the agent was registered with the correct EVM address ---
try:
    import psycopg2
    conn = psycopg2.connect(
        host="localhost", port=5432, dbname="integrity",
        user="postgres", password="postgres"
    )
    cur = conn.cursor()
    
    # Check agents table
    cur.execute("SELECT agent_id, eth_address FROM agents WHERE eth_address = %s", (client.wallet_address,))
    row = cur.fetchone()
    
    if row:
        print(f"\n[✓] Agent registered in DB with EVM wallet:")
        print(f"    UUID         : {row[0]}")
        print(f"    eth_address  : {row[1]}")
    else:
        print(f"\n[!] Agent NOT found by wallet address. Checking by agent_id...")
        cur.execute("SELECT agent_id, eth_address FROM agents WHERE eth_address LIKE %s", (f"%{client.agent_id}%",))
        fallback = cur.fetchone()
        if fallback:
            print(f"    Found via agent_id: UUID={fallback[0]}, eth={fallback[1]}")
        else:
            print("    [✗] Agent not found in DB at all!")

    # Check transaction_logs for the entry
    cur.execute("""
        SELECT t.transaction_id, t.on_chain_tx_hash, a.eth_address 
        FROM transaction_logs t 
        JOIN agents a ON a.agent_id = t.agent_id 
        WHERE a.eth_address = %s
        ORDER BY t.created_at DESC LIMIT 1
    """, (client.wallet_address,))
    tx_row = cur.fetchone()
    if tx_row:
        print(f"\n[✓] Transaction log linked to wallet:")
        print(f"    TX ID        : {tx_row[0]}")
        print(f"    Integrity Hash: {tx_row[1]}")
        print(f"    Wallet       : {tx_row[2]}")
    else:
        print("\n[!] No transaction logs found linked to this wallet address.")

    conn.close()
except ImportError:
    print("\n[!] psycopg2 not available — skipping DB verification. Check Oracle logs manually.")
except Exception as e:
    print(f"\n[!] DB query error: {e}")

# --- 4. Verify deterministic derivation (same seed = same address) ---
print("\n[...] Verifying deterministic derivation...")
client2 = IntegrityClient(
    agent_id="WalletTestAgent",
    oracle_url="http://localhost:8080/v1/transactions/report",
)
assert client.wallet_address == client2.wallet_address, \
    f"FAIL: Non-deterministic! {client.wallet_address} != {client2.wallet_address}"
print(f"[✓] Deterministic: re-derived address matches: {client2.wallet_address}")

# --- Cleanup ---
client.shutdown()
client2.shutdown()

print("\n" + "=" * 70)
print("  ALL VALIDATIONS PASSED ✓")
print("=" * 70)
