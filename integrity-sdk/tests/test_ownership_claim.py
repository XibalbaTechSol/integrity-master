from eth_account import Account
from eth_account.messages import encode_defunct
from integrity_sdk.client import IntegrityClient

def test_ownership_claim(requests_mock):
    # 1. Create a dummy "Human" MetaMask wallet for testing
    human_account = Account.create()
    owner_address = human_account.address
    owner_key = human_account.key

    # 2. Initialize the Integrity SDK Agent
    client = IntegrityClient(
        oracle_url="http://127.0.0.1:8080/v1/transactions/report",
        agent_id="test_agent_claim_001",
        batch_size_limit=1
    )
    agent_address = client._evm_address

    # Mock the telemetry endpoint
    requests_mock.post("http://127.0.0.1:8080/v1/transactions/report", json={"status": "ok"})
    
    # 3. Send a telemetry event
    client.log_telemetry(
        metadata={"event": "initialization"},
        entropy=0.5,
        grounding=0.9
    )
    
    # Manual flush
    batch = client.batcher.get_batch_and_clear()
    client._process_and_send(batch)

    # 4. Generate the claim challenge
    challenge = client.generate_claim_challenge(owner_address)

    # 5. Sign the challenge
    signable_message = encode_defunct(text=challenge)
    signed_message = Account.sign_message(signable_message, private_key=owner_key)
    signature_hex = signed_message.signature.hex()

    # Mock the claim endpoint
    requests_mock.post(
        "http://127.0.0.1:8080/v1/agents/claim", 
        json={"status": "claimed"}
    )

    # 6. Submit the ownership claim
    result = client.claim_ownership(
        owner_address=owner_address,
        signature=signature_hex,
        challenge=challenge
    )
    assert result["status"] == "claimed"

    # Mock the get agents endpoint
    requests_mock.get(
        f"http://127.0.0.1:8080/v1/owner/{owner_address}/agents", 
        json={"agents": [{"agent_wallet": agent_address}]}
    )

    # 7. Fetch the agents owned by this human
    owned_agents = client.get_owner_agents(owner_address)
    assert len(owned_agents['agents']) == 1
    assert owned_agents['agents'][0]['agent_wallet'].lower() == agent_address.lower()
