import os
import json
import unittest
from unittest.mock import MagicMock, patch
from integrity_sdk.client import IntegrityClient
from integrity_sdk.integrations.compliance import ComplianceProfile
from integrity_sdk.telemetry.conventions import IntegrityAttributes

class TestCompliancePipeline(unittest.TestCase):
    def setUp(self):
        self.client = IntegrityClient(
            agent_id="test_compliance_agent",
            oracle_url="http://mock-oracle/ingest",
            batch_size_limit=1
        )

    @patch("requests.post")
    def test_hipaa_shield_activation(self, mock_post):
        # 1. Apply HIPAA Shield
        ComplianceProfile.apply_hipaa_shield(
            self.client, 
            region="us-east-1",
            api_domain_prefix="hipaa.api.openai.com"
        )
        
        self.assertTrue(self.client.hipaa_eligible)
        self.assertTrue(self.client.zdr_enabled)
        self.assertFalse(self.client.external_web_access)
        self.assertEqual(self.client.region, "us-east-1")
        self.assertEqual(self.client.api_domain_prefix, "hipaa.api.openai.com")

        # 2. Log Telemetry
        self.client.log_telemetry(metadata={"action": "phi_access"})
        
        # 3. Manually flush to trigger _process_and_send
        batch = self.client.batcher.get_batch_and_clear()
        self.client._process_and_send(batch)
        
        # 4. Verify Payload
        args, kwargs = mock_post.call_args
        envelope = kwargs["json"]
        payload = envelope["payload"]
        
        self.assertEqual(payload[IntegrityAttributes.COMPLIANCE_HIPAA_ELIGIBLE], True)
        self.assertEqual(payload[IntegrityAttributes.COMPLIANCE_ZDR_ENABLED], True)
        self.assertEqual(payload[IntegrityAttributes.COMPLIANCE_DATA_RESIDENCY_REGION], "us-east-1")
        self.assertEqual(payload[IntegrityAttributes.COMPLIANCE_API_DOMAIN_PREFIX], "hipaa.api.openai.com")

    def test_finance_shield_activation(self):
        ComplianceProfile.apply_finance_shield(
            self.client,
            region="eu-central-1",
            ekm_provider="aws-kms",
            api_domain_prefix="eu.api.openai.com"
        )
        
        self.assertFalse(self.client.hipaa_eligible)
        self.assertEqual(self.client.region, "eu-central-1")
        self.assertEqual(self.client.ekm_provider, "aws-kms")
        self.assertEqual(self.client.api_domain_prefix, "eu.api.openai.com")

if __name__ == "__main__":
    unittest.main()
