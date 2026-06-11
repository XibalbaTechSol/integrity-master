import time
import json
from integrity_sdk.client import IntegrityClient

def test_xibalba_flow():
    print("🚀 Initiating Xibalba Master Agent SDK Test...")
    
    # 1. Initialize for Xibalba Master Agent
    # In a real scenario, this would have the actual private keys / TEE attestation
    import os
    port = os.getenv("INTEGRITY_ORACLE_PORT", "8081")
    client = IntegrityClient(
        oracle_url=f"http://127.0.0.1:{port}/v1/transactions/report",
        agent_id="xibalba_master_agent_sdk_test"
    )
    
    # Use the seeded Xibalba address for testing
    xibalba_address = "0x67bA5D723E1F5517afF7eb980E2f73a9e17aD556"
    print(f"Agent Address: {xibalba_address}")

    # 1. Register the agent
    print("\n0. Registering Agent Identity...")
    try:
        # In a real scenario, this uses the hardware-bound identity
        reg = client.register_agent(
            eth_address=client._evm_address,
            alias="SDK-Test-Agent",
            description="Autonomous agent for SDK/Oracle validation"
        )
        print(f"✅ Registered: {reg.get('agent_id')}")
    except Exception as e:
        if "409" in str(e):
            print("ℹ️ Agent already registered.")
        else:
            print(f"❌ Registration failed: {e}")

    # 2. Log High-Fidelity Telemetry
    print("\n1. Sending High-Integrity Telemetry...")
    try:
        client.log_telemetry(
            metadata={
                "event": "liquidity_provision",
                "pair": "ITK/USDC",
                "action": "rebalance"
            },
            entropy=0.01,   # Very stable
            grounding=0.99  # Highly verified
        )
        print("✅ Telemetry logged (Batched and Backgrounded)")
    except Exception as e:
        print(f"❌ Telemetry failed: {e}")

    # 3. Check Credit Profile via SDK
    print("\n2. Querying Institutional Credit Profile...")
    try:
        # Note: We need to make sure the client uses the correct address internally for these methods
        # I'll manually pass the address if the SDK method allows, or assume it uses its derived one.
        # Since I added these methods to the SDK client recently:
        profile = client.get_credit_profile()
        print(f"✅ Credit Score: {profile.get('credit_score')}")
        print(f"✅ Borrow Limit: {profile.get('max_borrow_limit')} ITK")
    except Exception as e:
        print(f"❌ Credit query failed: {e}")

    # 4. Request a Certification Audit
    print("\n3. Requesting Institutional Audit...")
    try:
        audit = client.request_audit(platinum=True)
        print(f"✅ Audit Initialized. ID: {audit.get('audit_id')}")
    except Exception as e:
        print(f"❌ Audit request failed: {e}")

    # 5. Check Provenance
    print("\n4. Fetching Forensic Provenance...")
    try:
        logs = client.get_provenance()
        print(f"✅ Retrieved {len(logs)} provenance records.")
        if logs:
            print(f"   Latest Action: {logs[0].get('action')}")
    except Exception as e:
        print(f"❌ Provenance fetch failed: {e}")

    print("\n🏁 Xibalba SDK Test Sequence Complete.")

if __name__ == "__main__":
    test_xibalba_flow()
