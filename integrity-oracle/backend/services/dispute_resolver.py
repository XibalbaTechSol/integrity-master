import time
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, Agent, TransactionLog

from blockchain_service import IntegrityBlockchainService

class XibalbaDisputeResolver:
    """
    Xibalba Solutions: Dispute Resolution Engine (v2.0)
    
    Automated 'Supreme Court' logic to resolve Dual-Witness mismatches
    and apply Slashing Penalties ($P_s$) directly to the Trust Vault.
    """

    def __init__(self):
        self.blockchain = IntegrityBlockchainService()

    def trigger_resolution(self, log_id: str, deal_id_hex: str = None):
        """
        Main entry point for transaction auditing.
        Requires both provider and customer metadata to be present.
        """
        db = SessionLocal()
        try:
            tx = db.query(TransactionLog).filter(TransactionLog.log_id == log_id).first()
            if not tx:
                print(f"[!] Error: Transaction {log_id} not found.")
                return None

            if not tx.provider_metadata or not tx.customer_metadata:
                print(f"[*] Tx {log_id}: Awaiting dual-witness completion.")
                return {"status": "PENDING"}

            # --- Resolution Logic ---
            transaction_id = str(log_id)
            provider = tx.provider_metadata
            customer = tx.customer_metadata
            
            breaches = []
            
            # 1. Latency Breach Check (Threshold: 5x)
            actual_latency = customer.get('actual_latency', 0)
            estimated_latency = provider.get('estimated_latency', 1)
            if actual_latency > (estimated_latency * 5.0):
                breaches.append({
                    "category": "LATENCY_BREACH",
                    "penalty": 0.10,
                    "msg": f"Latency mismatch: {actual_latency}ms vs {estimated_latency}ms."
                })

            # 2. Data/Token Inconsistency Check
            actual_tokens = customer.get('actual_tokens_processed', 0)
            allocated_tokens = provider.get('max_tokens_allocated', 0)
            if actual_tokens > allocated_tokens and allocated_tokens > 0:
                 breaches.append({
                    "category": "DATA_INCONSISTENCY",
                    "penalty": 0.40,
                    "msg": f"Over-charging detected: {actual_tokens} tokens vs {allocated_tokens} allocated."
                })

            # 3. Malicious Accuracy Drop
            actual_accuracy = customer.get('actual_accuracy', 1.0)
            if actual_accuracy < 0.50:
                breaches.append({
                    "category": "MALICIOUS_INTENT",
                    "penalty": 1.0,
                    "msg": f"Catastrophic failure: Accuracy dropped to {actual_accuracy}."
                })

            # --- Verdict & Slashing ---
            if not breaches:
                tx.dispute_status = "RESOLVED"
                db.commit()
                print(f"[VERDICT] Tx {transaction_id} RESOLVED. No breach detected.")
                return {"status": "RESOLVED", "total_penalty": 0.0}

            # Select the highest penalty among breaches
            max_penalty = max([b["penalty"] for b in breaches])
            verdict_msg = "; ".join([b["msg"] for b in breaches])
            
            # Apply Slashing to Agent Record
            agent = db.query(Agent).filter(Agent.agent_id == tx.agent_id).first()
            if agent:
                # Accumulate penalty points (capped at 1.0)
                agent.penalty_points = min(1.0, float(agent.penalty_points) + max_penalty)
                tx.dispute_status = "SLASHED"
                print(f"[VERDICT] Tx {transaction_id} SLASHED! Penalty: {max_penalty}")
                print(f"  -> Agent {agent.eth_address} reputation reduced.")
                
                # --- On-Chain Slash ---
                if deal_id_hex:
                    print(f"[BLOCKCHAIN] Triggering on-chain slash for deal {deal_id_hex}...")
                    self.blockchain.resolve_dispute_on_chain(deal_id_hex, True)
            
            db.commit()
            
            return {
                "status": "SLASHED",
                "total_penalty": max_penalty,
                "breach_summary": verdict_msg
            }

        finally:
            db.close()

if __name__ == "__main__":
    # Integration Test Placeholder
    resolver = XibalbaDisputeResolver()
    print("[*] Dispute Resolver initialized and ready for automated auditing.")
