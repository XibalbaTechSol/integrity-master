import time
import os
import sys
from datetime import datetime

# Ensure we can find the services
sys.path.append(os.path.join(os.path.dirname(__file__), "services"))

from database import SessionLocal
from merkle_service import MerkleService
from blockchain_service import IntegrityBlockchainService

# Xibalba Solutions: Automated Rollup Daemon (v1.0)
# Periodically anchors the Merkle Root of all reputation scores to Base L2.

class RollupDaemon:
    def __init__(self, interval_sec: int = 3600):
        self.interval = interval_sec
        self.blockchain = IntegrityBlockchainService()
        self.db = SessionLocal()

    def run(self):
        print(f"[ROLLUP] Starting Automated Rollup Daemon (Interval: {self.interval}s)...")
        while True:
            try:
                self.process_rollup()
            except Exception as e:
                print(f"[ROLLUP] Error during processing: {e}")
            
            print(f"[ROLLUP] Sleeping for {self.interval} seconds...")
            time.sleep(self.interval)

    def process_rollup(self):
        print(f"[ROLLUP] [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Initiating state anchoring...")
        
        # 1. Compute the Merkle Root from current database state
        root = MerkleService.calculate_reputation_root(self.db)
        print(f"[ROLLUP] Calculated Merkle Root: {root}")
        
        # 2. Anchor to On-chain Registry
        tx_hash = self.blockchain.anchor_state_root(root)
        
        if tx_hash:
            print(f"[ROLLUP] SUCCESS: State root anchored to Base L2. Transaction: {tx_hash}")
            # Update global settings or local log if needed
        else:
            print("[ROLLUP] FAILURE: Anchoring transaction failed or was rejected.")

if __name__ == "__main__":
    # Default to 1 hour, or use ROLLUP_INTERVAL env var
    interval = int(os.getenv("ROLLUP_INTERVAL", 3600))
    daemon = RollupDaemon(interval_sec=interval)
    daemon.run()
