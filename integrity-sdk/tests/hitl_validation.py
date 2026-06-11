import os
import sys
import time
import sqlite3
import json

# Setup pathing to import local integrity_sdk
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from integrity_sdk.client import IntegrityClient

def test_hitl_telemetry():
    print("======================================================================")
    print("INTEGRITY SDK — HUMAN-IN-THE-LOOP TELEMETRY VALIDATION")
    print("======================================================================")

    agent_id = "HITLAgent"
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

    # 2. Log a human override action (e.g. user corrected a trade order)
    print("\n[STEP 1] Logging a manual override action (replaces 'Buy 10 AAPL' with 'Buy 15 AAPL')...")
    client.log_hitl_action(
        action_type="override",
        proposed_content="Buy 10 AAPL",
        final_content="Buy 15 AAPL",
        reviewer_did="did:xibalba:human_operator_42",
        review_latency_ms=1250.0,
        justification="Liquidity depth suggests higher trade size",
        extra_metadata={"context": "trader_rebalancing"}
    )

    # Wait for final flush
    print("   Waiting for background threads to flush queue...")
    time.sleep(1.5)

    # 3. Audit the database
    print("\n[STEP 2] Auditing namespaced SQLite DB to verify captured HITL events...")
    assert os.path.exists(db_path), f"Missing SQLite database file for {agent_id}"

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT payload FROM offline_telemetry ORDER BY id ASC")
    rows = cur.fetchall()
    conn.close()

    print(f"Captured {len(rows)} batches in local SQLite cache.")
    assert len(rows) > 0, "No records found in local SQLite database!"

    batch_payload = json.loads(rows[0][0])
    metadata_list = batch_payload.get("metadata", [])
    
    assert len(metadata_list) > 0, "Telemetry payload metadata is empty!"
    hitl_event = metadata_list[0]
    print(f"\nCaptured HITL Event Payload:\n{json.dumps(hitl_event, indent=2)}")

    # Assertions
    assert hitl_event.get("event_type") == "human_in_the_loop", "Wrong event type!"
    assert hitl_event.get("action_type") == "override", "Wrong action type!"
    assert hitl_event.get("reviewer_did") == "did:xibalba:human_operator_42", "Wrong reviewer DID!"
    assert hitl_event.get("review_latency_ms") == 1250.0, "Wrong review latency!"
    assert hitl_event.get("justification") == "Liquidity depth suggests higher trade size", "Wrong justification!"
    assert hitl_event.get("context") == "trader_rebalancing", "Extra metadata missing!"
    
    # Verify Levenshtein edit distance logic:
    # "Buy 10 AAPL" vs "Buy 15 AAPL"
    # Replacing '0' with '5' is 1 substitution. Edit distance = 1.
    assert hitl_event.get("edit_distance") == 1, f"Expected edit distance of 1, got {hitl_event.get('edit_distance')}"
    print("   ✓ Edit distance correctly calculated at SDK level!")

    # Cleanup
    client.shutdown()
    if os.path.exists(db_path):
        os.remove(db_path)

    print("\n======================================================================")
    print("✓ SUCCESS: Human-in-the-loop telemetry validated successfully!")
    print("======================================================================\n")

if __name__ == "__main__":
    test_hitl_telemetry()
