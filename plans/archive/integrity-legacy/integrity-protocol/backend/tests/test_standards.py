import requests
import json

def test_did_resolution():
    print("Testing DID Resolution...")
    agent_address = "0xTestAgentV8"
    response = requests.get(f"http://localhost:8001/did/{agent_address}")
    if response.status_code == 200:
        did_doc = response.json()
        print(f"DID Document: {json.dumps(did_doc, indent=2)}")
        assert did_doc["id"] == f"did:intg:{agent_address}"
        print("DID Resolution SUCCESS")
    else:
        print(f"DID Resolution FAILED: {response.status_code} {response.text}")

def test_vc_generation():
    print("\nTesting VC Generation...")
    agent_address = "0xTestAgentV8"
    response = requests.get(f"http://localhost:8001/vc/ais/{agent_address}")
    if response.status_code == 200:
        vc = response.json()
        print(f"Verifiable Credential: {json.dumps(vc, indent=2)}")
        assert "AgentIntegrityCredential" in vc["type"]
        assert vc["credentialSubject"]["ais_score"] > 0
        print("VC Generation SUCCESS")
    else:
        print(f"VC Generation FAILED: {response.status_code} {response.text}")

if __name__ == "__main__":
    # Note: Assumes the API is running on localhost:8001
    try:
        test_did_resolution()
        test_vc_generation()
    except Exception as e:
        print(f"Tests failed: {e}")
