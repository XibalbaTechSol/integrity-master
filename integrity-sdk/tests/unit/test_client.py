import pytest
import json
import time
import hashlib
from unittest.mock import patch, MagicMock
from integrity_sdk.client import IntegrityClient, BCCCommitment

class TestIntegrityClient:
    """
    Unit tests for the IntegrityClient SDK.
    Validates identity, telemetry ingestion, and BCC pipeline.
    """

    @pytest.fixture
    def client(self):
        """
        Fixture to provide a clean IntegrityClient instance for each test.
        """
        # ARRANGE
        mock_host_sampler = MagicMock()
        mock_host_sampler.get_current_metrics.return_value = {"path_entropy": 0.0}

        with patch('integrity_sdk.telemetry.core.init_telemetry'), \
             patch('integrity_sdk.telemetry.host.HostTelemetrySampler', return_value=mock_host_sampler), \
             patch('integrity_sdk.did.load_or_create_did', return_value=("did:intg:test", MagicMock())), \
             patch('integrity_sdk.did.get_hardware_fingerprint', return_value="hw-123"), \
             patch('integrity_sdk.did.derive_evm_address', return_value="0xAgent"):
            return IntegrityClient(agent_id="test_agent", mode="test", api_key="test_key")

    def test_client_initialization(self, client):
        """
        Validates that the client initializes with correct defaults and identity.
        """
        # ASSERT
        assert client.agent_id == "test_agent"
        assert client.did == "did:intg:test"
        assert client.wallet_address == "0xAgent"
        assert client.mode == "test"

    def test_register_agent(self, client):
        """
        Validates the agent registration workflow.
        """
        # ARRANGE
        mock_response = {"success": True, "agent_id": "0xAgent"}

        with patch('requests.post') as mock_post:
            mock_post.return_value.json.return_value = mock_response
            mock_post.return_value.status_code = 200

            # ACT
            result = client.register_agent(eth_address="0xAgent", alias="TestAgent")

            # ASSERT
            assert result["success"] is True
            mock_post.assert_called_once()
            args, kwargs = mock_post.call_args
            assert "register" in args[0]
            assert kwargs["json"]["eth_address"] == "0xAgent"

    def test_handshake(self, client):
        """
        Validates the trust handshake between agents.
        """
        # ARRANGE
        mock_response = {"trust_decision": "Permit", "score": 850}

        with patch('requests.post') as mock_post:
            mock_post.return_value.json.return_value = mock_response
            mock_post.return_value.status_code = 200

            # ACT
            result = client.handshake(initiator_eth_address="0x1", target_eth_address="0x2")

            # ASSERT
            assert result["decision"] == "Permit"
            assert result["score"] == 850

    def test_report_transaction(self, client):
        """
        Validates standard telemetry report ingestion.
        """
        # ARRANGE
        with patch('requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {"success": True}

            # ACT
            client.report_transaction(
                deal_id="deal_001",
                deal_amount=100.0,
                latency_ms=150,
                accuracy_score=0.98
            )

            # ASSERT
            mock_post.assert_called_once()
            _, kwargs = mock_post.call_args
            assert kwargs["json"]["payload"]["deal_id"] == "deal_001"
            assert kwargs["json"]["agent_id"] == "0xAgent"

    def test_bcc_commitment_and_validation(self, client):
        """
        Validates the BCC (Blind Commitment & Control) intent pipeline.
        """
        # ARRANGE
        intended_state = {"action": "transfer", "amount": 10}

        # ACT
        commitment = client.commit_action_intent(
            action_type="FINANCIAL_TX",
            intended_state=intended_state,
            opa_policy_id="policy_001"
        )

        # ASSERT
        assert isinstance(commitment, BCCCommitment)
        assert commitment.action_type == "FINANCIAL_TX"

        # Verify drift detection
        # ACT / ASSERT
        with pytest.raises(RuntimeError, match="BCC_INTENT_DRIFT"):
            client.validate_and_execute(
                commitment=commitment,
                actual_execution_context={"action": "transfer", "amount": 100}, # Modified amount
                action_function=lambda: True
            )

    def test_metric_calculation_heuristics(self, client):
        """
        Validates internal heuristic calculations for entropy and grounding.
        """
        # ARRANGE
        metadata_clean = {"over_sized_count": 0}
        metadata_bad = {"hallucination_flag": True, "errors": 1}

        # ACT
        entropy_clean, grounding_clean = client._calculate_metrics(metadata_clean)
        entropy_bad, grounding_bad = client._calculate_metrics(metadata_bad)

        # ASSERT
        assert entropy_clean < entropy_bad
        assert grounding_clean > grounding_bad
