import time
import os
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, Agent, TransactionLog
from blockchain_service import IntegrityBlockchainService

# Xibalba Solutions: Decentralized Oracle Worker (v1.0)
# This worker polls the database for agents with pending reputation updates 
# and synchronizes them with the on-chain ReputationRegistry.

class OracleWorker:
    def __init__(self):
        self.blockchain = IntegrityBlockchainService()
        self.poll_interval = 5 # seconds

    def run(self):
        print("--------------------------------------------------")
        print("🚀 XIBALBA ORACLE WORKER STARTED")
        print(f"Target Registry: {self.blockchain.registry_address}")
        print("--------------------------------------------------")

        anchor_count = 0
        while True:
            try:
                self.process_pending_syncs()
                
                # Anchor a new state root every 10 cycles
                if anchor_count % 10 == 0:
                    self.anchor_current_state()
                anchor_count += 1
                
            except Exception as e:
                print(f"[WORKER ERROR] {e}")
            
            time.sleep(self.poll_interval)

    def anchor_current_state(self):
        """Simulates Merkle root calculation and anchors it on-chain."""
        db = SessionLocal()
        try:
            agents = db.query(Agent).all()
            # In a real production environment, we'd use a library like 'merklelib'
            # to build a tree of (eth_address, ais, last_slash_days).
            # For the demo, we'll hash the current agent set to produce a 'state root'.
            state_data = "".join([f"{a.eth_address}{a.current_ais}" for a in agents])
            import hashlib
            root = hashlib.sha256(state_data.encode()).digest()
            
            print(f"[*] Anchoring State Root: 0x{root.hex()}...")
            tx = self.blockchain.anchor_state_root(root)
            if tx:
                print(f"✅ State Anchored: {tx}")
        finally:
            db.close()

    def process_pending_syncs(self):
        db = SessionLocal()
        try:
            # Fetch agents requiring on-chain synchronization
            pending_agents = db.query(Agent).filter(Agent.sync_pending == True).all()

            if not pending_agents:
                return

            print(f"[WORKER] Found {len(pending_agents)} agents pending sync.")

            for agent in pending_agents:
                print(f"[WORKER] Syncing {agent.eth_address} (AIS: {agent.current_ais})...")
                
                tx_hash = self.blockchain.update_agent_reputation(
                    agent_address=agent.eth_address,
                    ais=agent.current_ais,
                    tier=agent.verification_tier
                )

                if tx_hash:
                    agent.sync_pending = False
                    db.commit()
                    print(f"[WORKER] Successfully anchored {agent.eth_address}. Tx: {tx_hash}")
                else:
                    print(f"[WORKER] Failed to anchor {agent.eth_address}. Will retry.")

        finally:
            db.close()

if __name__ == "__main__":
    worker = OracleWorker()
    worker.run()
