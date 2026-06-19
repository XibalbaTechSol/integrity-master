import os
import sys
import pytest
from unittest.mock import patch, MagicMock

# Ensure the root SDK folder is in PYTHONPATH to import validate_sdk_alignment
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import validate_sdk_alignment
from integrity_sdk.client import IntegrityClient
from integrity_sdk.prover import NoirProver

def test_intent_generation():
    """
    Test Intent Generation using commit_action_intent.
    Ensures that commitments detect contextual drift correctly.
    """
    client = IntegrityClient(agent_id="test_agent", oracle_url="http://mock", mode="test")
    client._sign_payload = MagicMock(return_value="mock_signature")
    
    intent_state = {"action": "db_update", "table": "users"}
    
    # 1. Generate intent commitment
    commitment = client.commit_action_intent(
        action_type="database_write",
        intended_state=intent_state,
        opa_policy_id="db_policy_01"
    )
    
    assert commitment.action_type == "database_write"
    assert commitment.opa_policy_id == "db_policy_01"
    assert commitment.provenance_signature == "mock_signature"
    assert commitment.opa_evaluation_result["allow"] is True
    
    # 2. Test valid drift validation (execution matches intent)
    result = client.validate_and_execute(
        commitment=commitment,
        actual_execution_context=intent_state,
        action_function=lambda: "success"
    )
    assert result == "success"

    # 3. Test drift detection failure (execution deviates from intent)
    with pytest.raises(RuntimeError, match="BCC_INTENT_DRIFT"):
        client.validate_and_execute(
            commitment=commitment,
            actual_execution_context={"action": "db_update", "table": "admins"}, # drifted context
            action_function=lambda: "fail"
        )

def test_zkp_compilation_edges():
    """
    Test ZKP compilation edges via NoirProver fallback logic.
    Ensures correct aggregation and behavior on empty/extreme telemetry batches.
    """
    prover = NoirProver(agent_id="test_zkp_agent")
    
    # Edge 1: Empty batch
    empty_proof = prover.generate_proof([])
    assert empty_proof["batch_size"] == 0
    assert empty_proof["avg_entropy"] == 0
    assert empty_proof["avg_grounding"] == 0
    assert empty_proof["commitment"].startswith("0x")
    
    # Edge 2: Valid batch with variance
    batch = [
        {"entropy": 0.0, "grounding": 1.0, "latency_ms": 10, "accuracy": 1.0},
        {"entropy": 1.0, "grounding": 0.0, "latency_ms": 500, "accuracy": 0.0}
    ]
    proof = prover.generate_proof(batch)
    assert proof["batch_size"] == 2
    assert proof["avg_entropy"] == 500     # Mean of 0.0 and 1.0, scaled by 1000
    assert proof["avg_grounding"] == 500   # Mean of 1.0 and 0.0, scaled by 1000
    assert proof["commitment"].startswith("0x")

@patch("integrity_sdk.did.load_or_create_did")
def test_contract_signing_mock(mock_load_did):
    """
    Test contract signing mock functions directly inside the IntegrityClient.
    """
    mock_keypair = MagicMock()
    mock_keypair.sign.return_value = b"test_signature_bytes"
    # Mock load_or_create_did returning a DID and our mocked keypair
    mock_load_did.return_value = ("did:mock:123", mock_keypair)
    
    client = IntegrityClient(agent_id="test_signing", oracle_url="http://mock", mode="test")
    
    # Ensure did and keypair loaded properly
    assert client.did == "did:mock:123"
    
    # Call internal signing function
    payload_to_sign = b"important_contract_data"
    signature_hex = client._sign_payload(payload_to_sign)
    
    # Assert keypair signing was called with the correct raw bytes
    mock_keypair.sign.assert_called_once_with(payload_to_sign)
    
    # The SDK hex-encodes the signature bytes before returning
    assert signature_hex == b"test_signature_bytes".hex()

@patch("validate_sdk_alignment.time.sleep")
@patch("subprocess.run")
@patch("validate_sdk_alignment.IntegrityClient")
def test_validate_sdk_alignment_flow(mock_client_class, mock_subprocess, mock_sleep):
    """
    Test the main execution flow of validate_sdk_alignment.py.
    """
    # Setup mock IntegrityClient
    mock_client = MagicMock()
    mock_client.did = "did:mock:agent"
    mock_client.wallet_address = "0xMockEVMAddress"
    
    # Mock specific return values the script uses
    mock_client.register_agent.return_value = {"status": "success"}
    mock_client.handshake.return_value = {"decision": "ALLOW"}
    mock_client.report_transaction.return_value = {"ais_score": 850}
    
    mock_client_class.return_value = mock_client
    
    # Mock subprocess (psql DB check)
    mock_run_result = MagicMock()
    mock_run_result.stdout = " shield | 3\n"
    mock_subprocess.return_value = mock_run_result
    
    # Execute the integration script's main function
    validate_sdk_alignment.validate_sdk_alignment()
    
    # Verify core operations were triggered
    mock_client.register_agent.assert_called_once()
    mock_client.handshake.assert_called_once()
    mock_client.report_transaction.assert_called_once()
    
    # Telemetry should be logged 3 times
    assert mock_client.log_telemetry.call_count == 3
    
    mock_client.initialize_goal.assert_called_once()
    mock_client.update_goal.assert_called_once()
    
    # Verify the background worker sleep was called
    mock_sleep.assert_called_once_with(7)
