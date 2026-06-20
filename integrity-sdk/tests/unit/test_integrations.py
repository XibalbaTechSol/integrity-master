import pytest
from unittest.mock import MagicMock, patch
from integrity_sdk.integrations.compliance import ComplianceProfile
from integrity_sdk.integrations.world_data_fetcher import WorldDataFetcher

class TestIntegrityIntegrations:
    """
    Unit tests for SDK integration helpers (Compliance and World Data).
    """

    @pytest.fixture
    def mock_client(self):
        """
        Mock IntegrityClient for integration testing.
        """
        # ARRANGE
        client = MagicMock()
        client.log_compliance_event = MagicMock()
        return client

    def test_apply_hipaa_shield(self, mock_client):
        """
        Validates the application of the HIPAA compliance profile.
        """
        # ACT
        ComplianceProfile.apply_hipaa_shield(mock_client, region="us-west-2")

        # ASSERT
        assert mock_client.hipaa_eligible is True
        assert mock_client.zdr_enabled is True
        assert mock_client.external_web_access is False
        assert mock_client.region == "us-west-2"
        mock_client.log_compliance_event.assert_called_with(
            event_type="hipaa_shield_activated",
            status="success",
            details="HIPAA shield applied for region us-west-2."
        )

    def test_apply_finance_shield(self, mock_client):
        """
        Validates the application of the Finance compliance profile.
        """
        # ACT
        ComplianceProfile.apply_finance_shield(
            mock_client,
            region="eu-central-1",
            ekm_provider="AWS-KMS"
        )

        # ASSERT
        assert mock_client.hipaa_eligible is False
        assert mock_client.region == "eu-central-1"
        assert mock_client.ekm_provider == "AWS-KMS"
        mock_client.log_compliance_event.assert_called_with(
            event_type="finance_shield_activated",
            status="success",
            details="Finance shield applied for region eu-central-1 with EKM provider AWS-KMS."
        )

    def test_world_data_fetch_and_validate_success(self, mock_client):
        """
        Validates secure data fetching and provenance verification.
        """
        # ARRANGE
        fetcher = WorldDataFetcher(mock_client)
        mock_data = {"price": 50000, "asset": "BTC"}
        mock_secret = "secret-123"

        # Calculate valid HMAC signature
        import json
        import hmac
        import hashlib
        message = json.dumps(mock_data, sort_keys=True)
        valid_sig = hmac.new(mock_secret.encode(), message.encode(), hashlib.sha256).hexdigest()

        with patch('requests.get') as mock_get:
            mock_response = MagicMock()
            mock_response.json.return_value = mock_data
            mock_response.headers = {"X-Integrity-Oracle-Signature": valid_sig}
            mock_get.return_value = mock_response

            # ACT
            result = fetcher.fetch_and_validate(
                oracle_url="http://oracle.local",
                source_id="COINBASE",
                secret_key=mock_secret
            )

            # ASSERT
            assert result == mock_data
            mock_client.log_compliance_event.assert_called_with(
                event_type="world_data_ingestion",
                status="success",
                details="Ingested verified data from COINBASE",
                extra_metadata={"source_id": "COINBASE"}
            )

    def test_world_data_fetch_invalid_signature(self, mock_client):
        """
        Ensures that data with invalid signatures is rejected.
        """
        # ARRANGE
        fetcher = WorldDataFetcher(mock_client)
        mock_data = {"price": 50000}

        with patch('requests.get') as mock_get:
            mock_response = MagicMock()
            mock_response.json.return_value = mock_data
            mock_response.headers = {"X-Integrity-Oracle-Signature": "wrong-sig"}
            mock_get.return_value = mock_response

            # ACT / ASSERT
            with pytest.raises(RuntimeError, match="ORACLE_PROVENANCE_FAILURE"):
                fetcher.fetch_and_validate(
                    oracle_url="http://oracle.local",
                    source_id="COINBASE",
                    secret_key="secret"
                )
