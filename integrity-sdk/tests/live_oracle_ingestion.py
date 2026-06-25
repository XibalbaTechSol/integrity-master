import os
import sys
import time
import sqlite3
import json
import requests

# Setup pathing to import local integrity_sdk
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from integrity_sdk.client import IntegrityClient

def test_live_ingestion():
    print("======================================================================")
    print("INTEGRITY SDK — LIVE ORACLE INGESTION VALIDATION")
    print("======================================================================")

    # Target the Rust Axum Oracle server running on port 8080
    oracle_url = "http://127.0.0.1:8080/v1/transactions/report"
    
    agent_id = "LiveTelemetryAgent"
    db_path = os.path.expanduser(f"~/.integrity/offline_moat_{agent_id}.db")
    if os.path.exists(db_path):
        os.remove(db_path)

    print(f"[STEP 1] Initializing SDK Client pointing to: {oracle_url}")
    client = IntegrityClient(
        agent_id=agent_id,
        oracle_url=oracle_url,
        batch_size_limit=2,
        flush_interval_sec=0.1
    )

    # 1. Log a Model Switch event
    print("\n[STEP 2] Logging a Model Switch event...")
    client.log_model_switch(
        from_model="gpt-4o",
        to_model="claude-3-5-sonnet",
        from_provider="openai",
        to_provider="anthropic",
        reason="complex_reasoning_required"
    )

    # 2. Log a HITL action
    print("\n[STEP 3] Logging a HITL Override action...")
    client.log_hitl_action(
        action_type="override",
        proposed_content="Delete old keys",
        final_content="Archive old keys",
        reviewer_did="did:xibalba:human_operator_77",
        review_latency_ms=3200.0,
        justification="Safety compliance policy override"
    )

    # Shutdown client to force immediate flush and wait for workers
    print("\n[STEP 4] Shutting down client to force flush...")
    client.shutdown()
    
    # Check if local SQLite is empty (indicating it was successfully accepted by Oracle)
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM offline_telemetry")
        count = cur.fetchone()[0]
        conn.close()
        os.remove(db_path)
        print(f"Local cache row count: {count}")
        assert count == 0, "Telemetry was written to local offline cache! Transmission to Oracle failed."
    
    print("\n======================================================================")
    print("✓ SUCCESS: Telemetry successfully accepted and ingested by the Oracle!")
    print("======================================================================\n")

if __name__ == "__main__":
    # Test connection to Oracle first
    try:
        r = requests.get("http://127.0.0.1:8080/health", timeout=2.0)
        print(f"Axum Oracle Connection Status: {r.status_code} ({r.text})")
    except Exception as e:
        print(f"Could not connect to Axum Oracle: {e}")
        
    try:
        test_live_ingestion()
    except Exception as e:
        print(f"Ingestion test failed: {e}")
        sys.exit(1)
