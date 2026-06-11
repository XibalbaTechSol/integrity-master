import os
import time
import json
from eth_account import Account
from eth_account.messages import encode_defunct
from integrity_sdk.client import IntegrityClient
import requests

# 1. Create a dummy "Human" MetaMask wallet for testing
human_account = Account.create()
owner_address = human_account.address
owner_key = human_account.key

print(f"Human Wallet Address: {owner_address}")

# 2. Initialize the Integrity SDK Agent
client = IntegrityClient(
    oracle_url="http://127.0.0.1:8080/v1/transactions/report",
    agent_id="test_agent_claim_001"
)
agent_address = client._evm_address
print(f"Agent Derived Address: {agent_address}")

# 3. Send a telemetry event so the agent is auto-registered in the Oracle DB
print("Sending telemetry to auto-register agent...")
client.log_telemetry(
    metadata={"event": "initialization"},
    entropy=0.5,
    grounding=0.9
)
# Wait for async processing (flush interval is 5s)
time.sleep(6)

# 4. Generate the claim challenge
challenge = client.generate_claim_challenge(owner_address)
print(f"Challenge Message: {challenge}")

# 5. Sign the challenge as the human (simulating MetaMask personal_sign)
signable_message = encode_defunct(text=challenge)
signed_message = Account.sign_message(signable_message, private_key=owner_key)
signature_hex = signed_message.signature.hex()
print(f"Signature: {signature_hex}")

# 6. Submit the ownership claim
print("Submitting ownership claim...")
try:
    result = client.claim_ownership(
        owner_address=owner_address,
        signature=signature_hex,
        challenge=challenge
    )
    print("Claim successful!")
    print(json.dumps(result, indent=2))
except Exception as e:
    print(f"Claim failed: {e}")
    if hasattr(e, 'response') and e.response is not None:
        print(e.response.text)
    raise

# 7. Fetch the agents owned by this human
print(f"Fetching agents for owner {owner_address}...")
try:
    owned_agents = client.get_owner_agents(owner_address)
    print(json.dumps(owned_agents, indent=2))
    assert len(owned_agents['agents']) == 1, "Expected exactly 1 agent owned"
    assert owned_agents['agents'][0]['agent_wallet'].lower() == agent_address.lower(), "Agent wallet mismatch"
    print("SUCCESS: Full flow validated!")
except Exception as e:
    print(f"Fetch failed: {e}")
    if hasattr(e, 'response') and e.response is not None:
        print(e.response.text)
    raise
