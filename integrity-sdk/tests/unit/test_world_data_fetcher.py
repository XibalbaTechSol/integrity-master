import pytest
import json
import hmac
import hashlib
from unittest.mock import Mock, patch
from requests.exceptions import HTTPError

from integrity_sdk.integrations.world_data_fetcher import WorldDataFetcher

class TestWorldDataFetcher:
    def setup_method(self):
        self.mock_client = Mock()
        self.fetcher = WorldDataFetcher(client=self.mock_client)
        self.oracle_url = "https://example.com/oracle"
        self.source_id = "test_source_id"
        self.secret_key = "test_secret_key"
        self.data = {"price": 1000, "timestamp": 1678886400}

        # Calculate valid signature
        message = json.dumps(self.data, sort_keys=True)
        self.valid_sig = hmac.new(
            self.secret_key.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()

    @patch('integrity_sdk.integrations.world_data_fetcher.requests.get')
    def test_fetch_and_validate_success(self, mock_get):
        # Arrange
        mock_response = Mock()
        mock_response.json.return_value = self.data
        mock_response.headers = {"X-Integrity-Oracle-Signature": self.valid_sig}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        # Act
        result = self.fetcher.fetch_and_validate(self.oracle_url, self.source_id, self.secret_key)

        # Assert
        assert result == self.data
        mock_get.assert_called_once_with(self.oracle_url, timeout=5.0)
        self.mock_client.log_compliance_event.assert_called_once_with(
            event_type="world_data_ingestion",
            status="success",
            details=f"Ingested verified data from {self.source_id}",
            extra_metadata={"source_id": self.source_id}
        )

    @patch('integrity_sdk.integrations.world_data_fetcher.requests.get')
    def test_fetch_and_validate_missing_signature(self, mock_get):
        # Arrange
        mock_response = Mock()
        mock_response.json.return_value = self.data
        mock_response.headers = {}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        # Act & Assert
        with pytest.raises(RuntimeError) as exc_info:
            self.fetcher.fetch_and_validate(self.oracle_url, self.source_id, self.secret_key)

        assert "ORACLE_PROVENANCE_FAILURE: Invalid or missing data signature." in str(exc_info.value)
        self.mock_client.log_compliance_event.assert_not_called()

    @patch('integrity_sdk.integrations.world_data_fetcher.requests.get')
    def test_fetch_and_validate_invalid_signature(self, mock_get):
        # Arrange
        mock_response = Mock()
        mock_response.json.return_value = self.data
        mock_response.headers = {"X-Integrity-Oracle-Signature": "invalid_signature_hex"}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        # Act & Assert
        with pytest.raises(RuntimeError) as exc_info:
            self.fetcher.fetch_and_validate(self.oracle_url, self.source_id, self.secret_key)

        assert "ORACLE_PROVENANCE_FAILURE: Invalid or missing data signature." in str(exc_info.value)
        self.mock_client.log_compliance_event.assert_not_called()

    @patch('integrity_sdk.integrations.world_data_fetcher.requests.get')
    def test_fetch_and_validate_http_error(self, mock_get):
        # Arrange
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = HTTPError("404 Not Found")
        mock_get.return_value = mock_response

        # Act & Assert
        with pytest.raises(HTTPError):
            self.fetcher.fetch_and_validate(self.oracle_url, self.source_id, self.secret_key)

        self.mock_client.log_compliance_event.assert_not_called()

    def test_verify_oracle_sig_valid(self):
        # Act & Assert
        assert self.fetcher._verify_oracle_sig(self.data, self.valid_sig, self.secret_key) is True

    def test_verify_oracle_sig_invalid(self):
        # Act & Assert
        assert self.fetcher._verify_oracle_sig(self.data, "invalid_sig", self.secret_key) is False
