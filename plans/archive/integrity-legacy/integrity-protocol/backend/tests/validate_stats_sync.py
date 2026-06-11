import requests
import time
import uuid

# Configuration
API_URL = "http://localhost:8001"
AGENT_ADDRESS = "0xTestAgentV8"
PERFORMER_ADDRESS = "0xPerformerV8"

def get_stats():
    resp = requests.get(f"{API_URL}/v1/protocol/stats")
    return resp.json()

def validate_stats():
    print("[*] Starting Stats Synchronization Validation")
    
    # 1. Get initial stats
    initial_stats = get_stats()
    print(f"\n[INITIAL] Treasury Yield: {initial_stats['treasury_yield_itk']} ITK")
    print(f"[INITIAL] Active Nodes: {initial_stats['active_nodes']}")
    
    # 2. Report a new transaction
    print("\n--- Reporting a New Transaction (10,000 ITK Value) ---")
    deal_id = f"deal-{uuid.uuid4().hex[:8]}"
    payload = {
        "agent_address": AGENT_ADDRESS,
        "performer_address": PERFORMER_ADDRESS,
        "deal_id": deal_id,
        "contract_value_intg": 10000.0, # This should generate 50 ITK yield (0.5%)
        "latency_ms": 150,
        "accuracy_score": 0.99,
        "tokens_processed": 1000000,
        "model_class": "LARGE"
    }
    
    requests.post(f"{API_URL}/v1/transactions/report", json=payload)
    
    # 3. Wait for ingestion
    time.sleep(1)
    
    # 4. Get updated stats
    updated_stats = get_stats()
    print(f"\n[UPDATED] Treasury Yield: {updated_stats['treasury_yield_itk']} ITK")
    
    yield_diff = updated_stats['treasury_yield_itk'] - initial_stats['treasury_yield_itk']
    print(f"Yield Increase: {yield_diff} ITK")
    
    if yield_diff == 50.0:
        print("\n✅ SUCCESS: Treasury yield updated correctly (0.5% tax applied).")
    else:
        print(f"\n❌ FAILURE: Expected 50.0 ITK increase, but got {yield_diff} ITK.")

    # 6. Register a New Agent
    print(f"\n--- Registering a New Agent ---")
    new_agent_addr = f"0x{uuid.uuid4().hex[:40]}"
    reg_payload = {
        "eth_address": new_agent_addr,
        "alias": "Validator_Node_X",
        "description": "Validation Node for Protocol Testing"
    }
    
    # We need a mock firebase token or bypass
    requests.post(f"{API_URL}/v1/agent/register", json=reg_payload, headers={"Authorization": "Bearer mock_demo_token"})
    
    time.sleep(1)
    final_stats = get_stats()
    print(f"[FINAL] Total Nodes: {final_stats['total_nodes']}")
    print(f"[FINAL] Active Nodes: {final_stats['active_nodes']}")
    
    if final_stats['total_nodes'] > updated_stats['total_nodes']:
        print("✅ SUCCESS: Total nodes count incremented.")
    else:
        print("❌ FAILURE: Total nodes count did not increment.")
    
if __name__ == "__main__":
    try:
        validate_stats()
    except requests.exceptions.ConnectionError:
        print("[ERROR] Backend not running at http://localhost:8001")
