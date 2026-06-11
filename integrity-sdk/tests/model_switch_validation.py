import os
import sys
import time
import sqlite3
import json

# Setup pathing to import local integrity_sdk
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from integrity_sdk.client import IntegrityClient

def test_model_switch():
    print("======================================================================")
    print("INTEGRITY SDK — MODEL SWITCH TELEMETRY VALIDATION")
    print("======================================================================")

    agent_id = "ModelSwitchAgent"
    db_path = os.path.expanduser(f"~/.integrity/offline_moat_{agent_id}.db")
    if os.path.exists(db_path):
        os.remove(db_path)

    # 1. Initialize client pointing to local SQLite (offline mode for audit)
    client = IntegrityClient(
        agent_id=agent_id,
        oracle_url="http://127.0.0.1:9999/invalid_port",
        batch_size_limit=1,
        flush_interval_sec=0.1
    )
    
    # 2. Log inference 1 with gpt-4o
    print("\n[STEP 1] Logging first inference with model: gpt-4o...")
    client.log_inference(
        provider="openai",
        raw_data={
            "model": "gpt-4o",
            "usage": {"prompt_tokens": 10, "completion_tokens": 10, "total_tokens": 20},
            "choices": [{"finish_reason": "stop", "message": {"role": "assistant", "content": "Ping"}}]
        },
        latency_ms=50.0
    )
    
    # Wait for flush
    time.sleep(0.5)
    
    # 3. Log inference 2 with llama-3 (switch models)
    print("\n[STEP 2] Logging second inference with model: llama-3 (simulating a model switch)...")
    client.log_inference(
        provider="together",
        raw_data={
            "model": "llama-3",
            "usage": {"prompt_tokens": 10, "completion_tokens": 10, "total_tokens": 20},
            "choices": [{"finish_reason": "stop", "message": {"role": "assistant", "content": "Pong"}}]
        },
        latency_ms=60.0
    )
    
    # Wait for flush
    time.sleep(0.5)

    # 4. Log a manual model switch event
    print("\n[STEP 3] Logging a manual model switch event (claude-3-opus -> gemini-1.5-pro)...")
    client.log_model_switch(
        from_model="claude-3-opus",
        to_model="gemini-1.5-pro",
        from_provider="anthropic",
        to_provider="google",
        reason="cost_optimization"
    )

    # Wait for final flush
    print("   Waiting for background threads to flush queue...")
    time.sleep(1.5)

    # 5. Audit the database
    print("\n[STEP 4] Auditing namespaced SQLite DB to verify captured switch events...")
    assert os.path.exists(db_path), f"Missing SQLite database file for {agent_id}"
    
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT payload FROM offline_telemetry ORDER BY id ASC")
    rows = cur.fetchall()
    conn.close()
    
    print(f"Captured {len(rows)} batches in local SQLite cache.")
    
    switch_events = []
    for row in rows:
        batch_payload = json.loads(row[0])
        # The batcher groups multiple payloads. The batch payload contains "metadata" list (which maps to list of item metadatas)
        # Let's inspect the metadata list
        metadata_list = batch_payload.get("metadata", [])
        for meta in metadata_list:
            if meta.get("event_type") == "model_switch":
                switch_events.append(meta)

    print(f"Found {len(switch_events)} model switch events:")
    for ev in switch_events:
        print(json.dumps(ev, indent=2))

    # Assertions
    assert len(switch_events) >= 2, "Expected at least 2 model switch events!"
    
    # Check automated switch
    auto_switch = switch_events[0]
    assert auto_switch["from_model"] == "gpt-4o", "Expected automated from_model to be gpt-4o"
    assert auto_switch["to_model"] == "llama-3", "Expected automated to_model to be llama-3"
    assert auto_switch["reason"] == "automatic_telemetry_detect", "Expected reason to be automatic_telemetry_detect"
    
    # Check manual switch
    manual_switch = switch_events[1]
    assert manual_switch["from_model"] == "claude-3-opus", "Expected manual from_model to be claude-3-opus"
    assert manual_switch["to_model"] == "gemini-1.5-pro", "Expected manual to_model to be gemini-1.5-pro"
    assert manual_switch["reason"] == "cost_optimization", "Expected manual reason to be cost_optimization"

    # Cleanup
    client.shutdown()
    if os.path.exists(db_path):
        os.remove(db_path)
        
    print("\n======================================================================")
    print("✓ SUCCESS: Model switch telemetry tracking validated successfully!")
    print("======================================================================\n")

if __name__ == "__main__":
    test_model_switch()
