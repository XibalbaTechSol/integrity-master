import os
import sys

# Ensure the SDK is in the path
sys.path.insert(0, '/home/xibalba/Projects/integrity-sdk')

from integrity_sdk import IntegrityClient
from eth_account.messages import encode_defunct
from eth_account import Account

# 1. Initialize client
client = IntegrityClient(
    oracle_url="http://localhost:8080/v1/transactions/report",
    agent_id="TestClaimAgent"
)

# Wait a second to ensure initial telemetry is sent and agent is registered
import time
client.log_telemetry({"event": "startup", "msg": "hello"})
print("Waiting 6s for background worker to flush telemetry...")
time.sleep(6)

print(f"Agent derived EVM Address: {client.wallet_address}")

# 2. Simulate human owner (MetaMask)
owner_account = Account.create()
owner_address = owner_account.address
print(f"Simulated Human Owner Address: {owner_address}")

# 3. Generate claim challenge
challenge = client.generate_claim_challenge(owner_address)
print(f"\nChallenge generated:\n{challenge}")

# 4. Sign the challenge like MetaMask does (EIP-191 personal_sign)
signable_message = encode_defunct(text=challenge)
signed_message = owner_account.sign_message(signable_message)
signature_hex = signed_message.signature.hex()
print(f"\nSignature generated: {signature_hex}")

# 5. Claim ownership
print("\nSubmitting claim to Oracle...")
try:
    result = client.claim_ownership(
        owner_address=owner_address,
        signature=signature_hex,
        challenge=challenge
    )
    print("Success! Response from Oracle:")
    print(result)

    print("\nFetching owner's agents...")
    agents_res = client.get_owner_agents(owner_address)
    print(agents_res)
except Exception as e:
    print(f"Error during claim: {e}")
