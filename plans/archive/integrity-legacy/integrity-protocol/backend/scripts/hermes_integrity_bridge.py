import os
import sys
import json
import time
import logging
from typing import Dict, Any

sys.path.insert(0, "/home/xibalba/Projects/integrity-protocol/backend/sdk/python")

from xibalba_integrity import IntegrityClient, IntegrityConfig

from dotenv import load_dotenv
load_dotenv("/home/xibalba/Projects/integrity-protocol/.env")

# Xibalba Solutions: Hermes-Integrity Bridge (v1.0)
# "Bridging Sovereign Reasoning with Mathematical Certainty."

# Configuration - In production, these should be env vars
HERMES_LEDGER = os.path.expanduser("~/.hermes/hermes_interactions.json")
BACKEND_URL = os.getenv("INTEGRITY_BACKEND_URL", "http://localhost:8001")
AGENT_ADDRESS = os.getenv("XIBALBA_ORACLE_ADDRESS", "0x67ba5d723e1f5517aff7eb980e2f73a9e17ad556")
PRIVATE_KEY = os.getenv("AGENT_PRIVATE_KEY") or os.getenv("XIBALBA_ORACLE_PRIVATE_KEY") or os.getenv("PRIVATE_KEY")

logging.basicConfig(level=logging.INFO, format='[BRIDGE] %(message)s')
logger = logging.getLogger("hermes_integrity_bridge")

class HermesIntegrityBridge:
    def __init__(self):
        self.config = IntegrityConfig(
            api_url=BACKEND_URL,
            agent_address=AGENT_ADDRESS,
            private_key=PRIVATE_KEY,
            api_key=os.getenv("INTEGRITY_API_KEY", "master_agent_token"),
            strict_provenance=True # Enforce Web3 signatures
        )
        self.client = IntegrityClient(self.config)
        self.last_processed_idx = 0
        
        # Load initial state
        if os.path.exists(HERMES_LEDGER):
            with open(HERMES_LEDGER, 'r') as f:
                data = json.load(f)
                self.last_processed_idx = len(data)
        
        logger.info(f"Bridge initialized for agent {AGENT_ADDRESS}")
        logger.info(f"Monitoring ledger: {HERMES_LEDGER}")

    def process_entry(self, entry: Dict[str, Any]):
        etype = entry.get("type")
        payload = entry.get("payload", {})
        
        if etype == "TRANSACTION_REPORT":
            logger.info(f"Processing Hermes transaction: {payload.get('deal_id', 'unknown')}")
            # Report to Integrity Protocol via SDK
            result = self.client.report_deal(
                deal_id=payload.get("deal_id", f"hermes_{int(time.time())}"),
                performer=payload.get("performer_address", "0x000"),
                amount=payload.get("contract_value_intg", 0.0),
                latency_ms=payload.get("latency_ms", 100),
                accuracy=payload.get("accuracy_score", 1.0),
                metadata=payload.get("metadata", {"source": "hermes_harness"})
            )
            if result.status == "SUCCESS" or result.status == "VALIDATED_BY_XIBALBA":
                logger.info(f"✅ Anchored to Protocol: Hash {result.integrity_hash[:16]}...")
            else:
                logger.warning(f"❌ Anchor failed: {result.status}")

        elif etype == "IDENTITY_SYNC":
            logger.info(f"Syncing Hermes identity: {payload.get('alias')}")
            # Ensure the identity is registered/linked
            try:
                # We use the raw request for linking
                import requests
                resp = requests.post(
                    f"{BACKEND_URL}/v1/hermes/link",
                    json={"eth_address": payload.get("eth_address")},
                    headers={"Authorization": "Bearer master_agent_token"}
                )
                if resp.status_code == 200:
                    logger.info("✅ Identity linked successfully.")
            except Exception as e:
                logger.error(f"Identity sync error: {e}")

    def run(self):
        logger.info("🚀 Bridge started. Watching for new interactions...")
        while True:
            try:
                if os.path.exists(HERMES_LEDGER):
                    with open(HERMES_LEDGER, 'r') as f:
                        data = json.load(f)
                        
                    if len(data) > self.last_processed_idx:
                        new_entries = data[self.last_processed_idx:]
                        for entry in new_entries:
                            self.process_entry(entry)
                        self.last_processed_idx = len(data)
                
                time.sleep(2) # Polling interval
            except KeyboardInterrupt:
                logger.info("Bridge stopped by user.")
                break
            except Exception as e:
                logger.error(f"Bridge runtime error: {e}")
                time.sleep(5)

if __name__ == "__main__":
    if not PRIVATE_KEY:
        logger.error("AGENT_PRIVATE_KEY missing. Cannot operate in strict_provenance mode.")
        # In a real scenario, we'd exit here or use a safe dev key
    
    bridge = HermesIntegrityBridge()
    bridge.run()
