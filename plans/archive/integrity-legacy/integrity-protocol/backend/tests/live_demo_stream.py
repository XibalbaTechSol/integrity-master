import requests
import time
import random
import uuid

API_URL = "http://localhost:8001"

AGENTS = [
    {
        "address": "0xTestAgentV8", # The stable high-performer
        "base_latency": 150,
        "base_accuracy": 0.99,
        "tokens": 500000,
        "model": "LARGE",
        "staked": 50000,
        "alias": "Xibalba_Validator_01"
    },
    {
        "address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", # The volatile/risky agent
        "base_latency": 300,
        "base_accuracy": 0.90,
        "tokens": 100000,
        "model": "SMALL",
        "staked": 2000,
        "alias": "Veritas_Volatile"
    },
    {
        "address": "0xBB88b098defB751B7401B5f6FD89761B7401B5F", # The HITL/Grounding agent
        "base_latency": 1000,
        "base_accuracy": 0.95,
        "tokens": 250000,
        "model": "MEDIUM",
        "staked": 15000,
        "alias": "Alpha_Grounded"
    }
]

def run_demo():
    print("🚀 Starting Integrity Protocol v8.3 Live Stream Demo")
    print("Press Ctrl+C to stop.")
    
    # Initialize agents if needed by sending a first report
    for agent in AGENTS:
        requests.post(f"{API_URL}/v1/transactions/report", json={
            "agent_address": agent["address"],
            "performer_address": "0xXibalbaPool",
            "deal_id": f"init-{uuid.uuid4().hex[:6]}",
            "contract_value_intg": agent["staked"] / 10,
            "latency_ms": agent["base_latency"],
            "accuracy_score": agent["base_accuracy"],
            "tokens_processed": agent["tokens"],
            "model_class": agent["model"]
        })

    try:
        while True:
            for agent in AGENTS:
                # 1. Determine performance based on persona
                if "Volatile" in agent["alias"]:
                    # High variance
                    latency = agent["base_latency"] + random.randint(-200, 2000)
                    accuracy = max(0.4, agent["base_accuracy"] - (random.random() * 0.4))
                elif "Grounded" in agent["alias"]:
                    # Slow but stable, occasionally sends batch telemetry with high HGI
                    latency = agent["base_latency"] + random.randint(-50, 50)
                    accuracy = agent["base_accuracy"]
                    
# HITL logic simplified for v8.3 dual-witness endpoints
                else:
                    # High-performance stable
                    latency = agent["base_latency"] + random.randint(-10, 10)
                    accuracy = 0.99

                # 2. Report Transaction
                payload = {
                    "agent_address": agent["address"],
                    "performer_address": "0xXibalbaPool",
                    "deal_id": f"deal-{uuid.uuid4().hex[:6]}",
                    "contract_value_intg": 500.0,
                    "latency_ms": max(1, latency),
                    "accuracy_score": accuracy,
                    "tokens_processed": agent["tokens"],
                    "model_class": agent["model"]
                }
                
                requests.post(f"{API_URL}/v1/transactions/report", json=payload)
                # print(f"[*] Reported for {agent['alias']} | Latency: {latency}ms | Acc: {accuracy:.2f}")

            time.sleep(2) # Stream speed
            
    except KeyboardInterrupt:
        print("\nStopping demo stream.")

if __name__ == "__main__":
    run_demo()
