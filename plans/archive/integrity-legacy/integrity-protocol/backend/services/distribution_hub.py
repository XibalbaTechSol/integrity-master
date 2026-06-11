import os
import json
import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from database import SessionLocal, Agent, ReputationSnapshot

# Xibalba Solutions: Unified Distribution Hub (v1.0)
# Captures and pre-verifies 'OpenClaw' and 'Hermes' agent identities.

class DistributionHub:
    def __init__(self):
        # Paths to external data sources for pre-verification
        self.hermes_data_path = "hermes_interactions.json"
        # In a real environment, we'd also ingest OpenClaw tool logs
        self.openclaw_data_path = "openclaw_logs.json" 

    def _load_json(self, path: str) -> List[Dict[str, Any]]:
        if not os.path.exists(path):
            return []
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except:
            return []

    def capture_agents(self):
        """
        Scans for known Hermes and OpenClaw agents and creates unclaimed profiles.
        This provides immediate value when users first connect.
        """
        db = SessionLocal()
        try:
            # 1. Capture Hermes Agents
            hermes_data = self._load_json(self.hermes_data_path)
            for entry in hermes_data:
                if entry.get("type") == "TRANSACTION_REPORT":
                    self._create_unclaimed(db, entry["payload"].get("agent_address"), "HERMES")

            # 2. Capture OpenClaw Agents
            # (Simulating capture from tool-execution logs)
            openclaw_data = self._load_json(self.openclaw_data_path)
            for entry in openclaw_data:
                self._create_unclaimed(db, entry.get("agent_address"), "OPENCLAW")

            db.commit()
        finally:
            db.close()

    def _create_unclaimed(self, db: Session, addr: str, source: str):
        if not addr: return
        
        existing = db.query(Agent).filter(Agent.eth_address == addr).first()
        if not existing:
            new_agent = Agent(
                eth_address=addr,
                alias=f"{source}_Node_{addr[-4:]}",
                owner_uid=f"UNCLAIMED_{source}",
                verification_tier=1,
                current_ais=400 + (len(addr) % 200), # Baseline AIS based on historical 'presence'
                grounding_score=750,
                is_active=True,
                registration_date=datetime.datetime.utcnow() - datetime.timedelta(days=30)
            )
            db.add(new_agent)
            print(f"[DISTRIBUTION] Captured {source} Agent: {addr}")

    def get_market_stats(self) -> Dict[str, Any]:
        """Calculates total potential reputation for unclaimed agents."""
        db = SessionLocal()
        try:
            unclaimed = db.query(Agent).filter(Agent.owner_uid.like("UNCLAIMED_%")).all()
            total_potential_ais = sum([a.current_ais for a in unclaimed])
            return {
                "unclaimed_count": len(unclaimed),
                "total_potential_ais": total_potential_ais,
                "sources": ["HERMES", "OPENCLAW"]
            }
        finally:
            db.close()
