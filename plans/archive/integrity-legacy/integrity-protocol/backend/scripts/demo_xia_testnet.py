import os
import sys
import json
import datetime
import uuid
from sqlalchemy.orm import Session

# Add backend/services to path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "services"))

from database import SessionLocal, Agent, ReputationSnapshot
from blockchain_service import IntegrityBlockchainService
from scoring_engine import TriMetricScoringEngine

def run_xia_testnet_demo():
    """
    Demonstrates XIA features on Testnet (Base Sepolia).
    1. Selects or creates an Institutional Trading Agent.
    2. Populates detailed XIA metrics in the database (Trust Vault).
    3. Anchors the high reputation and Tier 3 status on-chain via the Oracle.
    """
    print("--- XIA TESTNET DEMO: Sovereign Trading Infrastructure ---")
    
    db: Session = SessionLocal()
    blockchain = IntegrityBlockchainService()
    engine = TriMetricScoringEngine()
    
    # Use Alpha Sentinel as the XIA Pilot Agent
    PILOT_ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
    
    agent = db.query(Agent).filter(Agent.eth_address == PILOT_ADDRESS).first()
    if not agent:
        print(f"[DEMO] Creating new pilot agent for XIA: {PILOT_ADDRESS}")
        agent = Agent(
            eth_address=PILOT_ADDRESS,
            alias="XIA Pilot: Alpha Sentinel",
            xns_handle="alpha.xia.intg",
            verification_tier=3,
            current_ais=994,
            owner_uid="demo_alpha_uid",
            is_active=True
        )
        db.add(agent)
        db.flush()
    else:
        print(f"[DEMO] Found existing pilot agent: {agent.alias}")
        agent.verification_tier = 3
        agent.current_ais = 994
        agent.xns_handle = "alpha.xia.intg"

    # Define XIA Metadata
    xia_meta = {
        "pnf_status": "VALIDATED_PROOFS",
        "enclave_attestation": "INTEL_SGX_LOCKED",
        "ia_sharpe": 3.82,
        "compute_alpha": "+15.6%",
        "audit_logs": [
            f"[{datetime.datetime.utcnow().strftime('%H:%M:%S')}] SIG_GEN: 0x8f1... VALIDATED",
            "[PNF] CHECK: SUCCESS - NO FRONT RUNNING",
            "[TEE] ENCLAVE: HARDENED - 0x7b2f...8a1c",
            "[SLA] MIN_AIS: 950 - COMPLIANT",
            "[XIA] RECEIPT: ROI_V8_PILOT_ALPHA",
            "[BINDING] did:intg:alpha.xia (SECURE)"
        ]
    }
    
    agent.agent_metadata = xia_meta
    agent.compliance_score = 99.8
    agent.last_active_at = datetime.datetime.utcnow()
    
    db.commit()
    print("[TRUST_VAULT] XIA metrics populated for pilot agent.")

    # Anchor on Testnet
    print(f"[TESTNET] Anchoring Institutional Status (Tier 3) for {PILOT_ADDRESS} on Base Sepolia...")
    try:
        tx_hash = blockchain.update_agent_reputation(
            agent_address=PILOT_ADDRESS,
            ais=994,
            tier=3
        )
        if tx_hash:
            print(f"[BLOCKCHAIN] SUCCESS: XIA Status Anchored! Tx: {tx_hash}")
        else:
            print("[BLOCKCHAIN] Warning: On-chain update skipped (KMS or Key missing).")
    except Exception as e:
        print(f"[BLOCKCHAIN] ERROR: On-chain anchor failed: {e}")

    # Add historical snapshot for visual fidelity
    snapshot = ReputationSnapshot(
        agent_id=agent.agent_id,
        timestamp=datetime.datetime.utcnow(),
        ais_score=994,
        entropy_score=980,
        grounding_score=990,
        sacrifice_score=995
    )
    db.add(snapshot)
    db.commit()

    print("\n--- DEMO READY ---")
    print(f"Agent: {agent.alias}")
    print(f"Address: {agent.eth_address}")
    print("XIA Metrics: [PNF: VALIDATED, TEE: LOCKED, SHARPE: 3.82]")
    print("UI: The 'Institutional Quant' tab will now show real-time forensic logs for this agent.")

if __name__ == "__main__":
    run_xia_testnet_demo()
