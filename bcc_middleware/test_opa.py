import httpx
import asyncio
import json

OPA_URL = "http://localhost:8181/v1/data/integrity"

async def test_policy():
    print("Testing OPA Policy Guardrails...\n")
    
    async with httpx.AsyncClient() as client:
        # Scenario 1: Valid authorized request
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
        resp = await client.post(OPA_URL, json=payload_1)
        print("Scenario 1 (Valid ZKP):", json.dumps(resp.json().get("result", {}), indent=2))
        
        # Scenario 2: Technical Safeguard Failure (SSN Exfiltration)
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
        resp = await client.post(OPA_URL, json=payload_2)
        print("\nScenario 2 (SSN Violation):", json.dumps(resp.json().get("result", {}), indent=2))
        
        # Scenario 3: Access Control Failure (Unauthorized Agent EMR_WRITE)
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
        resp = await client.post(OPA_URL, json=payload_3)
        print("\nScenario 3 (Access Control Violation):", json.dumps(resp.json().get("result", {}), indent=2))

if __name__ == "__main__":
    asyncio.run(test_policy())
