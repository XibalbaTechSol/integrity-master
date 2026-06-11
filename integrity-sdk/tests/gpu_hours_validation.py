import os
import sys
import time
import sqlite3

# Setup pathing to import local integrity_sdk
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from integrity_sdk.client import IntegrityClient

def test_gpu_hours():
    print("======================================================================")
    print("INTEGRITY SDK — VIRTUAL GPU HOURS ATTESTATION VALIDATION")
    print("======================================================================")

    # 1. Initialize client pointing to local SQLite (offline mode for metric extraction audit)
    client = IntegrityClient(
        agent_id="GPUAttestationAgent",
        oracle_url="http://127.0.0.1:9999/invalid_port",
        batch_size_limit=1,
        flush_interval_sec=0.1
    )
    
    # 2. Log simulated GPT-4o inference containing 2000 tokens
    raw_response = {
        "model": "gpt-4o",
        "usage": {
            "prompt_tokens": 1500,
            "completion_tokens": 500,
            "total_tokens": 2000
        },
        "choices": [
            {
                "finish_reason": "stop",
                "message": {
                    "role": "assistant",
                    "content": "Solving base L2 transaction routes."
                }
            }
        ]
    }
    
    print("\n[STEP 1] Logging simulated OpenAI GPT-4o response (2000 tokens total)...")
    client.log_inference(
        provider="openai",
        raw_data=raw_response,
        latency_ms=150.0
    )
    
    # Wait for queue flush to local SQLite database
    print("   Waiting for background threads to flush queue...")
    time.sleep(2.0)
    
    # 3. Audit database to verify correct GPU Hours calculation
    print("\n[STEP 2] Auditing namespaced SQLite DB to verify metrics extraction...")
    db_path = os.path.expanduser("~/.integrity/offline_moat_GPUAttestationAgent.db")
    assert os.path.exists(db_path), "Missing SQLite database file for GPUAttestationAgent"
    
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT payload FROM offline_telemetry LIMIT 1")
    row = cur.fetchone()
    conn.close()
    
    assert row is not None, "No logged telemetry found in local SQLite database!"
    
    import json
    payload = json.loads(row[0])
    print(f"\nCaptured Payload JSON structure:\n{json.dumps(payload, indent=2)}")
    
    # Assert GPU hours are calculated
    gpu_hours = payload.get("gpu_hours_used", 0.0)
    # Expected: 2000 * 2.4e-7 = 0.00048
    expected_gpu_hours = round(2000 * 2.4e-7, 8)
    
    print(f"\n   Calculated GPU Hours: {gpu_hours} (Expected: {expected_gpu_hours})")
    assert abs(gpu_hours - expected_gpu_hours) < 1e-9, f"Calculation mismatch! Expected {expected_gpu_hours}, got {gpu_hours}"
    print("   ✓ Virtual GPU-Hours correctly estimated and attested at SDK level!")
    
    # Cleanup
    client.shutdown()
    if os.path.exists(db_path):
        os.remove(db_path)
        
    print("\n======================================================================")
    print("✓ SUCCESS: Virtual GPU Hours attestation validated successfully!")
    print("======================================================================\n")

if __name__ == "__main__":
    test_gpu_hours()
