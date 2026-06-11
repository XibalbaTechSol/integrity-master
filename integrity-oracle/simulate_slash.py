import sys
import os
import uuid
import json
from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv("oracle/.env")

sys.path.append(os.path.join(os.path.dirname(__file__), "backend", "services"))

from database import SessionLocal, Agent, TransactionLog
from dispute_resolver import XibalbaDisputeResolver
from blockchain_service import IntegrityBlockchainService

def main():
    print("--- 🏛️ Integrity Protocol: Dispute & Slasher Stress Test ---")
    
    agent_address = "0x79eDf9d21F55a658636DFb3465Ba9bbA009f9D84" # Xibalba
    deal_id = f"STRESS_TEST_{uuid.uuid4().hex[:6].upper()}"
    
    db = SessionLocal()
    resolver = XibalbaDisputeResolver()
    
    # 1. Create a mock transaction in the DB
    print(f"Step 1: Creating mock transaction {deal_id}...")
    agent = db.query(Agent).filter(Agent.eth_address == agent_address).first()
    if not agent:
        print("Agent not found in DB. Please run registration first.")
        return

    new_tx = TransactionLog(
        agent_id=agent.agent_id,
        on_chain_tx_hash=deal_id,
        contract_value_intg=1000.0,
        success=True,
        completion_time_ms=500, # Slow
        data_quality_score=0.40,  # Bad
        dispute_status="OPEN",
        provider_metadata={"estimated_latency": 100, "max_tokens_allocated": 1000},
        customer_metadata={"actual_latency": 500, "actual_accuracy": 0.40, "actual_tokens_processed": 1200}
    )
    db.add(new_tx)
    db.commit()
    print(f"Transaction {deal_id} logged.")

    # 2. Trigger Resolution
    print("\nStep 2: Triggering Automated Resolution...")
    result = resolver.trigger_resolution(new_tx.log_id, deal_id_hex=deal_id)
    
    print(f"\nResolution Result: {json.dumps(result, indent=2)}")
    
    # 3. Verify AIS Penalty (Local)
    db.refresh(agent)
    print(f"\nStep 3: Verifying Local AIS Penalty...")
    print(f"Agent {agent_address} Penalty Points: {agent.penalty_points}")
    
    # 4. Final verification of Transaction Status
    db.refresh(new_tx)
    print(f"Transaction {deal_id} Final Status: {new_tx.dispute_status}")
    
    print("\n--- ✅ Stress Test Complete ---")
    db.close()

if __name__ == "__main__":
    main()
