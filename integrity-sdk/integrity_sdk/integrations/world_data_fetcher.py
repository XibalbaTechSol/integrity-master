import requests
from typing import Dict, Any, Optional
import time
import hmac
import hashlib

class WorldDataFetcher:
    """
    SDK Helper to securely fetch, verify, and log external data 
    from decentralized oracles into the Integrity Protocol.
    """
    def __init__(self, client: "IntegrityClient"):
        self.client = client

    def fetch_and_validate(self, oracle_url: str, source_id: str, secret_key: str) -> Dict[str, Any]:
        """
        Fetches data from an oracle, verifies its integrity, and logs the provenance.
        """
        # 1. Fetch data
        response = requests.get(oracle_url, timeout=5.0)
        response.raise_for_status()
        data = response.json()
        
        # 2. Verify signature (Proof of Provenance)
        # Assuming Oracle attaches a signature in headers
        oracle_sig = response.headers.get("X-Integrity-Oracle-Signature")
        if not oracle_sig or not self._verify_oracle_sig(data, oracle_sig, secret_key):
            raise RuntimeError("ORACLE_PROVENANCE_FAILURE: Invalid or missing data signature.")

        # 3. Log provenance to Integrity Oracle
        self.client.log_compliance_event(
            event_type="world_data_ingestion",
            status="success",
            details=f"Ingested verified data from {source_id}",
            extra_metadata={"source_id": source_id}
        )

        return data

    def _verify_oracle_sig(self, data: Dict[str, Any], signature: str, secret: str) -> bool:
        message = json.dumps(data, sort_keys=True)
        computed_sig = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(computed_sig, signature)
