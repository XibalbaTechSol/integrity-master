import sys
import os
import time as time_mod
import requests
import subprocess
sys.path.append(os.path.join(os.getcwd(), 'sdk/python'))
from integrity_sdk import XibalbaIntegritySDK

# Simple validation script to ensure the Backend and SDK logic is sound.

def test_integrity_flow():
    print("--- Starting Xibalba Integrity Protocol Validation ---")
    
    # 1. Start the Backend API in the background
    print("🚀 Starting Backend API...")
    backend_process = subprocess.Popen(
        [sys.executable, "services/trust_api.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    time_mod.sleep(5) # Increased sleep time for startup
    
    try:
        # 2. Run the SDK Simulation
        print("🛠️ Running SDK Integrity Handshake...")
        
        sdk = XibalbaIntegritySDK(agent_address="0xAgentValidation")
        
        # Scenario: High-integrity transaction
        deal_id = "test_handshake_456"
        result = sdk.report_transaction_metrics(
            deal_id=deal_id,
            performer_address="0xAgentBeta",
            amount=1000.0,
            latency_ms=120,
            accuracy_score=0.99
        )
        
        if result.get("status") == "VALIDATED_BY_XIBALBA":
            print(f"✅ SDK Reporting Success: Received Hash {result['integrity_hash']}")
            print(f"📈 Impact on AIS: {result['ais_impact']}")
            
            # 3. Simulate Insurance Verification
            print("🔍 Simulating Insurance Verification...")
            verify_url = f"http://localhost:8001/v1/transactions/verify"
            payload = {"deal_id": deal_id}
            headers = {"Authorization": "Bearer master_agent_token"}
            
            verify_res = requests.post(verify_url, json=payload, headers=headers)
            
            if verify_res.status_code == 200:
                print("✅ Insurance Verification SUCCESS: Xibalba DB matches recorded hash.")
            else:
                print(f"❌ Verification Failed: {verify_res.status_code} - {verify_res.text}")
        else:
            print(f"❌ SDK Failed: {result}")
            
    finally:
        print("🛑 Shutting down Backend API...")
        backend_process.terminate()

if __name__ == "__main__":
    try:
        test_integrity_flow()
    except Exception as e:
        print(f"⚠️ Validation Script Error: {e}")
