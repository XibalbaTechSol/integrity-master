import requests
import uuid

API_URL = "http://localhost:8001"
AGENT_ADDRESS = "0xTestAgentV8"
PERFORMER_ADDRESS = "0xPerformerV8"

def inject_stats():
    print("[*] Injecting Prime Stats for", AGENT_ADDRESS)
    
    # 1. 20 stable transactions
    for i in range(20):
        requests.post(f"{API_URL}/v1/transactions/report", json={
            "agent_address": AGENT_ADDRESS,
            "performer_address": PERFORMER_ADDRESS,
            "deal_id": f"deal-prime-{uuid.uuid4().hex[:6]}",
            "contract_value_intg": 1000.0,
            "latency_ms": 200,
            "accuracy_score": 0.99,
            "tokens_processed": 500000,
            "model_class": "LARGE"
        })
        
    # 2. Telemetry batch for HGI
    requests.post(f"{API_URL}/v1/telemetry/batch", json={
        "agent_address": AGENT_ADDRESS,
        "events": [
            {
                "event_type": "inference",
                "latency_ms": 200, 
                "accuracy": 0.99, 
                "tokens_in": 500, 
                "tokens_out": 500,
                "was_intervened": True,
                "intervention_depth": 0.9
            } for _ in range(5)
        ]
    })
    
    # 3. Check quote
    resp = requests.post(f"{API_URL}/v1/insurance/quote", json={
        "agent_eth_address": AGENT_ADDRESS,
        "contract_value_intg": 1000.0
    })
    
    print(resp.json())

if __name__ == "__main__":
    inject_stats()
