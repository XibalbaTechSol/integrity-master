import os
import sys
import shutil
import time
import sqlite3
from pathlib import Path

# Setup pathing
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from integrity_sdk.client import IntegrityClient

def test_five_agents():
    # Make sure we clean up any pre-existing .integrity directory in the sdk folder to start fresh
    project_root = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    integrity_dir = project_root / ".integrity"
    if integrity_dir.exists():
        shutil.rmtree(integrity_dir)

    print("======================================================================")
    print("INTEGRITY SDK — MULTI-AGENT CONCURRENCY SESSIONS VALIDATION")
    print("======================================================================")
    
    agent_names = [
        "FundamentalScreener",
        "TechnicalAnalyst",
        "XibalbaTrader",
        "RiskController",
        "IntegrityAuditor"
    ]
    
    clients = []
    
    # 1. Initialize 5 clients concurrently
    print("\n[STEP 1] Initializing 5 unique agent sessions on shared hardware...")
    for name in agent_names:
        client = IntegrityClient(
            agent_id=name,
            oracle_url="http://127.0.0.1:9999/invalid_port", # Force offline SQLite caching
            batch_size_limit=2,
            flush_interval_sec=0.5
        )
        clients.append(client)
        print(f"   ✓ Session initialized: {name} | DID: {client.did[:50]}...")

    # 2. Assert unique directories and files were created
    print("\n[STEP 2] Verifying isolation of cryptographic credentials...")
    for name in agent_names:
        did_path = project_root / ".integrity" / "did" / name / "document.json"
        key_path = project_root / ".integrity" / "did" / name / "private_key.pem"
        assert did_path.exists(), f"Missing DID document for {name}"
        assert key_path.exists(), f"Missing private key for {name}"
    print("   ✓ All 5 sessions generated unique namespaced DID keys inside .integrity/did/!")

    # 3. Log telemetry events to force concurrent writes to separate SQLite databases
    print("\n[STEP 3] Logging telemetry concurrently to force local database caching...")
    for i, client in enumerate(clients):
        # Log 2 events to hit the batch limit (2) and trigger immediate background flush
        client.log_telemetry(metadata={"agent_index": i, "call": 1}, entropy=0.1, grounding=0.9)
        client.log_telemetry(metadata={"agent_index": i, "call": 2}, entropy=0.2, grounding=0.8)
        
    print("   Waiting for background threads to flush queues...")
    time.sleep(2.0)
    
    # 4. Verify separate database file creation and content
    print("\n[STEP 4] Auditing namespaced SQLite databases on disk...")
    for name in agent_names:
        db_path = os.path.expanduser(f"~/.integrity/offline_moat_{name}.db")
        assert os.path.exists(db_path), f"Missing database file for {name}"
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT payload FROM offline_telemetry")
        rows = cursor.fetchall()
        conn.close()
        
        assert len(rows) > 0, f"No cached logs found in {name}'s database"
        print(f"   ✓ Database 'offline_moat_{name}.db' contains {len(rows)} successfully cached records.")
        
    # Clean shutdown
    for client in clients:
        client.shutdown()

    # Clean up generated test databases
    for name in agent_names:
        db_path = os.path.expanduser(f"~/.integrity/offline_moat_{name}.db")
        if os.path.exists(db_path):
            os.remove(db_path)
            
    print("\n======================================================================")
    print("✓ SUCCESS: All 5 agent sessions executed and isolated cleanly!")
    print("======================================================================\n")

if __name__ == "__main__":
    test_five_agents()
