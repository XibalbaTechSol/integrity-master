import requests
import json
import hashlib
import time
import os
from typing import Dict, Any, Optional
from eth_account import Account
from eth_account.messages import encode_defunct

# Xibalba Solutions: Integrity Framework SDK (v1.1)
# "Form-First Engineering. Mathematical Certainty."

class IntegritySDK:
    def __init__(self, 
                 backend_url: str = "http://localhost:8001", 
                 agent_address: str = None, 
                 private_key: str = None,
                 local_mode: bool = False):
        self.backend_url = backend_url
        self.agent_address = agent_address
        self.private_key = private_key
        self.local_mode = local_mode
        self.api_key = os.getenv("INTEGRITY_API_KEY", "xib_dev_temp_key")

    def sign_payload(self, payload: Dict[str, Any]) -> str:
        """Signs the transaction payload using the agent's private key."""
        if not self.private_key:
            return "unsigned_mock_sig"
        
        # Canonicalize payload for signing
        message_text = json.dumps(payload, sort_keys=True)
        message = encode_defunct(text=message_text)
        signed_message = Account.sign_message(message, private_key=self.private_key)
        return signed_message.signature.hex()

    def report_metrics(self, 
                       deal_id: str, 
                       performer_address: str, 
                       amount: float, 
                       latency_ms: int, 
                       accuracy_score: float,
                       metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Reports performance metrics to the Integrity Protocol.
        In local_mode, it simulates a successful response without hitting the network.
        """
        payload = {
            "agent_address": self.agent_address,
            "performer_address": performer_address,
            "deal_id": deal_id,
            "contract_value_itk": amount,
            "latency_ms": latency_ms,
            "accuracy_score": accuracy_score,
            "timestamp": int(time.time()),
            "metadata": metadata or {}
        }

        # Add cryptographic signature
        payload["signature"] = self.sign_payload(payload)

        if self.local_mode:
            return self._simulate_response(payload)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(
                f"{self.backend_url}/v1/transactions/report", 
                json=payload, 
                headers=headers, 
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {
                "status": "ERROR", 
                "message": f"Integrity Backend Connectivity Issue: {str(e)}",
                "local_fallback": True if self.local_mode else False
            }

    def _simulate_response(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Simulates the backend scoring engine for local development."""
        mock_hash = hashlib.sha256(json.dumps(payload).encode()).hexdigest()
        return {
            "status": "VALIDATED_LOCAL",
            "calculated_entropy": 0.12,
            "ais_impact": 0.85,
            "integrity_hash": mock_hash,
            "message": "Transaction validated in Local Mode."
        }

    def get_reputation(self, address: str) -> Dict[str, Any]:
        """Fetches the current AIS and reputation tier for a given address."""
        if self.local_mode:
            return {"address": address, "ais": 750, "tier": "AAA", "status": "MOCK"}
        
        try:
            response = requests.get(f"{self.backend_url}/v1/identity/{address}")
            return response.json()
        except Exception:
            return {"status": "ERROR", "message": "Could not fetch reputation"}

# --- Example Usage ---

if __name__ == "__main__":
    # Simulate a developer environment
    # In production, use: IntegritySDK(agent_address="...", private_key="...")
    sdk = IntegritySDK(
        agent_address="0x67bA5D723E1F5517afF7eb980E2f73a9e17aD556",
        local_mode=True
    )

    print("🛡️ Reporting Metrics (Local Mode)...")
    result = sdk.report_metrics(
        deal_id="tx_999",
        performer_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        amount=100.0,
        latency_ms=85,
        accuracy_score=0.99
    )
    
    print(json.dumps(result, indent=2))
