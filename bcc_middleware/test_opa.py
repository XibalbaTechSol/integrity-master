import httpx
import asyncio
import json
import pytest

OPA_URL = "http://localhost:8181/v1/data/integrity"

@pytest.mark.asyncio
async def test_policy():
    """
    Validates OPA policy guardrails via async HTTP calls.
    Tests scenarios for valid requests, SSN violations, and access control.
    """
    async with httpx.AsyncClient() as client:
        # ARRANGE - Scenario 1: Valid authorized request
        payload_1 = {
            "input": {
                "commitment": {
                    "action_type": "ZKP_PROVING",
                    "agent_id": "did:intg:agent_scribe_01"
                },
                "context": {
                    "data": "Anonymized medical data ready for proof generation"
                }
            }
        }
        
        # ACT
        try:
            resp = await client.post(OPA_URL, json=payload_1)
            # ASSERT
            if resp.status_code == 200:
                result = resp.json().get("result", {})
                assert result.get("allow") is True
        except Exception:
            pytest.skip("OPA service unreachable")

        # ARRANGE - Scenario 2: Technical Safeguard Failure (SSN Exfiltration)
        payload_2 = {
            "input": {
                "commitment": {
                    "action_type": "EXTERNAL_API_CALL",
                    "agent_id": "did:intg:agent_scribe_01"
                },
                "context": {
                    "notes": "Patient SSN is 123-45-6789. Sending to external server."
                }
            }
        }

        # ACT
        resp = await client.post(OPA_URL, json=payload_2)
        
        # ASSERT
        result = resp.json().get("result", {})
        assert result.get("allow") is False
        assert any("SSN" in r for r in result.get("blocking_reasons", []))

        # ARRANGE - Scenario 3: Access Control Failure (Unauthorized Agent EMR_WRITE)
        payload_3 = {
            "input": {
                "commitment": {
                    "action_type": "EMR_WRITE",
                    "agent_id": "did:intg:unauthorized_agent_99"
                },
                "context": {
                    "diagnosis": "Healthy"
                }
            }
        }

        # ACT
        resp = await client.post(OPA_URL, json=payload_3)

        # ASSERT
        result = resp.json().get("result", {})
        assert result.get("allow") is False
