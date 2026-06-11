import os
import sys
import time
import json

# Add SDK to path
sys.path.append("/home/xibalba/Projects/INTEGRITY/integrity-sdk")

from integrity_sdk.client import IntegrityClient

def validate_sdk_alignment():
    print("\n--- [SDK VALIDATION] Initializing IntegrityClient ---")
    
    # Use Oracle on port 8081
    ORACLE_URL = "http://localhost:8081"
    AGENT_ID = "0xSDK_Validation_001"
    DOMAIN = "shield"
    
    client = IntegrityClient(
        agent_id=AGENT_ID,
        oracle_url=ORACLE_URL,
        domain_id=DOMAIN
    )
    
    print(f"Agent DID: {client.did}")
    print(f"EVM Address: {client.wallet_address}")
    
    # 1. Register
    print("\n--- 1. Testing SDK Registration ---")
    try:
        reg_resp = client.register_agent(
            eth_address=client.wallet_address,
            alias="SDK_Aligned_Agent",
            xns_handle="sdk_test.intg"
        )
        print(f"Registration Status: {reg_resp.get('status')}")
    except Exception as e:
        print(f"Registration failed: {e}")
    
    # 2. Handshake
    print("\n--- 2. Testing SDK Handshake ---")
    try:
        hs_resp = client.handshake(
            initiator_eth_address=client.wallet_address,
            target_eth_address="0xd62982a313FfA10966e76CD9dA11708eDbb01B3f" # Xibalba Master
        )
        print(f"Handshake Decision: {hs_resp.get('decision')}")
    except Exception as e:
        print(f"Handshake failed: {e}")
        
    # 3. Synchronous Report (New Envelope Standard)
    print("\n--- 3. Testing Synchronous Transaction Report ---")
    try:
        tx_resp = client.report_transaction(
            deal_id=f"sdk_sync_{int(time.time())}",
            deal_amount=100.0,
            latency_ms=45,
            accuracy_score=0.98,
            hitl_intervention=True,
            verification_tier=3
        )
        print(f"AIS Score: {tx_resp.get('ais_score')}")
        print("✓ SUCCESS: Synchronous report aligned with IngestionEnvelope!")
    except Exception as e:
        print(f"✖ FAILURE: Synchronous report failed: {e}")
        
    # 4. Asynchronous Batching
    print("\n--- 4. Testing Asynchronous Batch Reporting ---")
    try:
        print("Logging 3 telemetry points...")
        # Include a Reasoning block with <thought> tags
        client.log_telemetry(
            metadata={
                "task": "inference", 
                "tokens": 512,
                "text_output": "<thought>Analyzing the protocol schema layout. Matching clearance_flags to bitmask fields.</thought>Analysis completed."
            }, 
            entropy=0.01, 
            grounding=1.0
        )
        
        # Test stateful goal tracking
        print("Initializing stateful Goal: integrity_flow_goal...")
        client.initialize_goal("integrity_flow_goal", "Verify end-to-end telemetry pipeline", {"tier": "integration"})
        
        client.log_telemetry(metadata={"task": "search", "tokens": 256}, entropy=0.02, grounding=0.95)
        client.log_telemetry(metadata={"task": "validation", "tokens": 128}, entropy=0.01, grounding=1.0)
        
        print("Updating Goal: integrity_flow_goal as SUCCESS...")
        client.update_goal("integrity_flow_goal", "SUCCESS", {"assertions_passed": 3})
        
        print("Waiting for background flush (5s interval)...")
        time.sleep(7)
        print("✓ SDK Background worker should have flushed.")
    except Exception as e:
        print(f"✖ FAILURE: Asynchronous batching failed: {e}")

    # 5. Verify Isolation in Database
    print("\n--- 5. Final Schema Verification (DB Check) ---")
    import subprocess
    db_url = "postgres://xibalba_admin:integrity_secret_123@localhost:5432/integrity_protocol"
    res = subprocess.run([
        "psql", db_url, "-t", "-c", 
        f"SELECT domain_id, COUNT(*) FROM transaction_logs WHERE agent_id = (SELECT agent_id FROM agents WHERE eth_address = '{client.wallet_address}') GROUP BY domain_id"
    ], capture_output=True, text=True)
    print(f"Domain Counts in DB:\n{res.stdout.strip()}")
    
    if DOMAIN in res.stdout:
        print(f"\n✓ FINAL SUCCESS: SDK correctly tagged data with domain_id='{DOMAIN}'")
    else:
        print("\n✖ FINAL FAILURE: domain_id tagging not found in DB.")

if __name__ == "__main__":
    validate_sdk_alignment()
