import pytest
from unittest.mock import MagicMock, patch
from integrity_sdk.client import IntegrityClient
from integrity_sdk.integrations.compliance import ComplianceProfile
from integrity_sdk.integrations.world_data_fetcher import WorldDataFetcher

class TestComplianceProfile:
    """
    Unit tests for the ComplianceProfile integration.
    """

    def test_apply_hipaa_shield(self):
        """
        Validates that HIPAA shield applies the correct security controls.
        """
        # ARRANGE
        client = MagicMock(spec=IntegrityClient)
        region = "us-west-2"

        # ACT
        ComplianceProfile.apply_hipaa_shield(client, region=region)

        # ASSERT
        assert client.hipaa_eligible is True
        assert client.zdr_enabled is True
        assert client.external_web_access is False
        assert client.region == region
        client.log_compliance_event.assert_called_once()

    def test_apply_finance_shield(self):
        """
        Validates that Finance shield applies regional data residency controls.
        """
        # ARRANGE
        client = MagicMock(spec=IntegrityClient)
        region = "eu-central-1"
        ekm = "aws-kms"

        # ACT
        ComplianceProfile.apply_finance_shield(client, region=region, ekm_provider=ekm)

        # ASSERT
        assert client.hipaa_eligible is False
        assert client.region == region
        assert client.ekm_provider == ekm
        client.log_compliance_event.assert_called_once()

class TestWorldDataFetcher:
    """
    Unit tests for the WorldDataFetcher integration.
    """

    @patch("requests.get")
    def test_fetch_and_validate_success(self, mock_get):
        """
        Ensures data is correctly fetched and validated when signature matches.
        """
        # ARRANGE
        client = MagicMock(spec=IntegrityClient)
        fetcher = WorldDataFetcher(client)
        mock_data = {"price": 50000, "asset": "BTC"}
        mock_sig = "9b6736207f2305374465d2146e4b85437130b05e04278a54d5802102061b4021" # Dummy valid HMAC

        mock_response = MagicMock()
        mock_response.json.return_value = mock_data
        mock_response.headers = {"X-Integrity-Oracle-Signature": mock_sig}
        mock_get.return_value = mock_response

        # We need a real HMAC calculation for the test to pass if we use the real _verify_oracle_sig
        import json, hmac, hashlib
        message = json.dumps(mock_data, sort_keys=True)
        secret = "secret"
        real_sig = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()
        mock_response.headers["X-Integrity-Oracle-Signature"] = real_sig

        # ACT
        result = fetcher.fetch_and_validate("http://oracle.test", "btc-feed", secret)

        # ASSERT
        assert result == mock_data
        client.log_compliance_event.assert_called_once()

    @patch("requests.get")
    def test_fetch_and_validate_failure(self, mock_get):
        """
        Ensures a RuntimeError is raised if the oracle signature is invalid.
        """
        # ARRANGE
        client = MagicMock(spec=IntegrityClient)
        fetcher = WorldDataFetcher(client)
        mock_response = MagicMock()
        mock_response.json.return_value = {"data": "bad"}
        mock_response.headers = {"X-Integrity-Oracle-Signature": "wrong-sig"}
        mock_get.return_value = mock_response

        # ACT & ASSERT
        with pytest.raises(RuntimeError, match="ORACLE_PROVENANCE_FAILURE"):
            fetcher.fetch_and_validate("http://oracle.test", "bad-feed", "secret")
