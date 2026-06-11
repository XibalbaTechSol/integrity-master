import requests
import time
import uuid

# Configuration
API_URL = "http://localhost:8001"
AGENT_ADDRESS = "0xTestAgentV8"
PERFORMER_ADDRESS = "0xPerformerV8"

def test_full_flow():
    print("[*] Starting Integrity Protocol v8.3 Validation Flow")
    
    # 1. Report several stable transactions
    print("\n--- Phase 1: Building a Stable Reputation ---")
    for i in range(5):
        deal_id = f"deal-{uuid.uuid4().hex[:6]}"
        payload = {
            "agent_address": AGENT_ADDRESS,
            "performer_address": PERFORMER_ADDRESS,
            "deal_id": deal_id,
            "contract_value_intg": 1000.0,
            "latency_ms": 200,
            "accuracy_score": 0.98,
            "tokens_processed": 500000,
            "model_class": "MEDIUM"
        }
        response = requests.post(f"{API_URL}/v1/transactions/report", json=payload)
        data = response.json()
        print(f"[TX {i}] AIS: {data['ais_impact']} | Entropy: {data['calculated_entropy']}")
        time.sleep(0.1)

    # 2. Check agent status (Grounding should be 0)
    resp = requests.get(f"{API_URL}/v1/agent/{AGENT_ADDRESS}")
    agent_data = resp.json()
    print(f"\nInitial Grounding Score: {agent_data.get('grounding_score', 0)}")

    # 3. Simulate Human Interventions (Grounding Boost)
    print("\n--- Phase 2: Testing Human Grounding (HITL) ---")
    batch_payload = {
        "agent_address": AGENT_ADDRESS,
        "events": [
            {
                "event_type": "inference",
                "latency_ms": 210, 
                "accuracy": 0.99, 
                "tokens_in": 500, 
                "tokens_out": 500,
                "was_intervened": True,
                "intervention_depth": 0.8
            },
            {
                "event_type": "inference",
                "latency_ms": 195, 
                "accuracy": 0.97, 
                "tokens_in": 500, 
                "tokens_out": 500,
                "was_intervened": True,
                "intervention_depth": 0.5
            }
        ]
    }
    requests.post(f"{API_URL}/v1/telemetry/batch", json=batch_payload)
    
    # Check agent status again
    resp = requests.get(f"{API_URL}/v1/agent/{AGENT_ADDRESS}")
    agent_data = resp.json()
    print(f"New Grounding Score: {agent_data.get('grounding_score', 0)}")
    print(f"New AIS (should have boost): {agent_data['current_ais']}")

    # 4. Simulate a "Glitch" - High Entropy Event
    print("\n--- Phase 3: Simulating a Stability Breach ---")
    deal_id = f"deal-glitch-{uuid.uuid4().hex[:6]}"
    payload = {
        "agent_address": AGENT_ADDRESS,
        "performer_address": PERFORMER_ADDRESS,
        "deal_id": deal_id,
        "contract_value_intg": 1000.0,
        "latency_ms": 8000,
        "accuracy_score": 0.30,
        "tokens_processed": 500000,
        "model_class": "MEDIUM"
    }
    response = requests.post(f"{API_URL}/v1/transactions/report", json=payload)
    data = response.json()
    print(f"[TX GLITCH] AIS: {data['ais_impact']} | Entropy: {data['calculated_entropy']}")
    
    # 5. Verify Final Score
    resp = requests.get(f"{API_URL}/v1/agent/{AGENT_ADDRESS}")
    agent_data = resp.json()
    print(f"\nFinal AIS after glitch: {agent_data['current_ais']}")
    
if __name__ == "__main__":
    try:
        test_full_flow()
    except requests.exceptions.ConnectionError:
        print("[ERROR] Backend not running.")
