import pytest
from integrity_sdk.client import IntegrityClient

class TestIntegrityClient:
    """
    Unit tests for the IntegrityClient.
    """

    def test_client_initialization(self):
        """
        Validates that the client initializes correctly with an agent_id.
        """
        # ARRANGE
        agent_id = "test-agent"

        # ACT
        client = IntegrityClient(agent_id=agent_id)

        # ASSERT
        assert client.agent_id == agent_id
        assert client.oracle_url == "http://localhost:3001/ingest"

    def test_client_custom_url(self):
        """
        Validates that the client accepts a custom oracle URL.
        """
        # ARRANGE
        custom_url = "http://localhost:8080/ingest"

        # ACT
        client = IntegrityClient(agent_id="agent", oracle_url=custom_url)

        # ASSERT
        assert client.oracle_url == custom_url
