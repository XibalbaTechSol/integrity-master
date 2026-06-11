import requests
import json
import time

API_BASE = "http://localhost:8001"
headers = {"Authorization": "Bearer master_agent_token"}
payload = {
    "agent_address": "0x67ba5d723e1f5517aff7eb980e2f73a9e17ad556",
    "performer_address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "deal_id": "sim_test_123",
    "contract_value_intg": 100.0,
    "latency_ms": 100,
    "accuracy_score": 0.99,
    "timestamp": int(time.time()),
    "signature": "dummy_signature_for_test"
}

try:
    resp = requests.post(f"{API_BASE}/v1/transactions/report", json=payload, headers=headers)
    print(f"Status Code: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
