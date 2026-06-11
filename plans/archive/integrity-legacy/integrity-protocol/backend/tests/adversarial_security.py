import requests
import time
import json
from eth_account import Account
from eth_account.messages import encode_defunct

# Xibalba Solutions: Adversarial Security Testing Suite (v1.0)
# This script attempts to exploit the protocol to verify hardening measures.

BASE_URL = "http://localhost:8001/v1"

def test_unauthorized_telemetry():
    print("[*] Test: Unauthorized Telemetry Report (No Auth)...")
    payload = {"agent_address": "0xTest", "events": []}
    resp = requests.post(f"{BASE_URL}/telemetry/batch", json=payload)
    if resp.status_code == 401:
        print("✅ SUCCESS: Blocked unauthorized report (401)")
    else:
        print(f"❌ FAILURE: Allowed unauthorized report ({resp.status_code})")

def test_unowned_agent_reporting():
    print("[*] Test: Reporting metrics for an agent you don't own...")
    # Register as guest A
    guest_a_token = "Bearer guest_adversary_A"
    # Register as guest B
    guest_b_token = "Bearer guest_adversary_B"
    
    # 1. Guest B registers an agent
    requests.post(f"{BASE_URL}/identity/register", 
                  headers={"Authorization": guest_b_token},
                  json={"eth_address": "0xVictimAgent", "alias": "Victim"})
    
    # 2. Guest A tries to report for Guest B's agent
    payload = {
        "agent_address": "0xVictimAgent",
        "events": [{"event_type": "inference", "latency_ms": 100}]
    }
    resp = requests.post(f"{BASE_URL}/telemetry/batch", 
                        headers={"Authorization": guest_a_token},
                        json=payload)
    
    if resp.status_code == 403:
        print("✅ SUCCESS: Blocked report for unowned agent (403)")
    else:
        print(f"❌ FAILURE: Allowed report for unowned agent ({resp.status_code})")

def test_invalid_signature():
    print("[*] Test: Telemetry with Invalid Cryptographic Signature...")
    guest_token = "Bearer guest_adversary_sig"
    
    # 1. Register agent
    agent_addr = "0xAdversaryAgent"
    requests.post(f"{BASE_URL}/identity/register", 
                  headers={"Authorization": guest_token},
                  json={"eth_address": agent_addr, "alias": "Adversary"})
    
    # 2. Send payload with a fake/broken signature
    payload = {
        "agent_address": agent_addr,
        "events": [{"event_type": "inference", "latency_ms": 50}],
        "signature": "0x" + "0" * 130, # Clearly invalid
        "timestamp": int(time.time())
    }
    resp = requests.post(f"{BASE_URL}/telemetry/batch", 
                        headers={"Authorization": guest_token},
                        json=payload)
    
    if resp.status_code == 401:
        print("✅ SUCCESS: Blocked invalid signature (401)")
    else:
        print(f"❌ FAILURE: Allowed invalid signature ({resp.status_code})")

def test_expired_payload():
    print("[*] Test: Replay/Expired Payload (Old Timestamp)...")
    guest_token = "Bearer guest_adversary_replay"
    agent_addr = "0xReplayAgent"
    
    # 1. Register agent
    requests.post(f"{BASE_URL}/identity/register", 
                  headers={"Authorization": guest_token},
                  json={"eth_address": agent_addr, "alias": "Replay"})
    
    # 2. Sign a payload with an old timestamp (1 hour ago)
    old_ts = int(time.time()) - 3600
    payload = {
        "agent_address": agent_addr,
        "events": [{"event_type": "inference", "latency_ms": 50}],
        "timestamp": old_ts
    }
    
    # Sign it (using a mock key since we just need the structure)
    acc = Account.create()
    msg_text = json.dumps(payload, sort_keys=True)
    msg = encode_defunct(text=msg_text)
    signed = Account.sign_message(msg, private_key=acc.key.hex())
    payload["signature"] = signed.signature.hex()
    
    resp = requests.post(f"{BASE_URL}/telemetry/batch", 
                        headers={"Authorization": guest_token},
                        json=payload)
    
    if resp.status_code == 401:
        print("✅ SUCCESS: Blocked expired payload (401)")
    else:
        print(f"❌ FAILURE: Allowed expired payload ({resp.status_code})")

def test_rate_limiter():
    print("[*] Test: Telemetry Flooding (Rate Limiter)...")
    guest_token = "Bearer guest_adversary_flood"
    agent_addr = "0xFloodAgent"
    
    # 1. Register agent
    requests.post(f"{BASE_URL}/identity/register", 
                  headers={"Authorization": guest_token},
                  json={"eth_address": agent_addr, "alias": "Flood"})
    
    # 2. Flood it
    blocked = False
    for i in range(120):
        resp = requests.post(f"{BASE_URL}/telemetry/batch", 
                            headers={"Authorization": guest_token},
                            json={"agent_address": agent_addr, "events": []})
        if resp.status_code == 429:
            blocked = True
            break
    
    if blocked:
        print("✅ SUCCESS: Rate limiter triggered (429)")
    else:
        print("❌ FAILURE: Rate limiter did not trigger after 120 requests")

if __name__ == "__main__":
    print("--- ⚔️ INTEGRITY PROTOCOL: ADVERSARIAL SECURITY TEST SUITE ---")
    try:
        test_unauthorized_telemetry()
        test_unowned_agent_reporting()
        test_invalid_signature()
        test_expired_payload()
        test_rate_limiter()
    except Exception as e:
        print(f"❌ ERROR RUNNING TESTS: {e}")
        print("Is the backend running at localhost:8001?")
    print("--- ⚔️ TEST SUITE COMPLETE ---")
