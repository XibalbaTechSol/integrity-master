import os
import datetime
from sqlalchemy.orm import Session
from services.database import SessionLocal, Agent, TransactionLog, TelemetryLog
from services.scoring_engine import TriMetricScoringEngine
from decimal import Decimal

# Initialize Scoring Engine
engine = TriMetricScoringEngine()

def seed_demo_agents():
    db: Session = SessionLocal()
    
    print("[*] Seeding 3 Demo Agents for Developer Playbook...")

    # 1. Sovereign Slacker (Tier 1) - Demonstrates Low Tier & Ceiling
    slacker = db.query(Agent).filter(Agent.eth_address == "0xSlackerSovereign").first()
    if not slacker:
        slacker = Agent(
            eth_address="0xSlackerSovereign",
            alias="Sovereign_Slacker",
            verification_tier=1,
            current_ais=450,
            performance_entropy=0.15, # High entropy = low score
            grounding_score=400,
            owner_uid="mock_dev_uid",
            registration_date=datetime.datetime.utcnow() - datetime.timedelta(days=90),
            last_active_at=datetime.datetime.utcnow() - datetime.timedelta(days=2),
            staked_amount_itk=Decimal("50.0")
        )
        db.add(slacker)
        print("[+] Created Agent: Sovereign Slacker (Tier 1)")

    # 2. Verified Voyager (Tier 2) - Demonstrates Mid Tier & Solid Rep
    voyager = db.query(Agent).filter(Agent.eth_address == "0xVoyagerVerified").first()
    if not voyager:
        voyager = Agent(
            eth_address="0xVoyagerVerified",
            alias="Verified_Voyager",
            verification_tier=2,
            current_ais=820,
            performance_entropy=0.03, # Low entropy = good score
            grounding_score=850,
            owner_uid="mock_dev_uid",
            registration_date=datetime.datetime.utcnow() - datetime.timedelta(days=120),
            last_active_at=datetime.datetime.utcnow(),
            staked_amount_itk=Decimal("500.0")
        )
        db.add(voyager)
        print("[+] Created Agent: Verified Voyager (Tier 2)")

    # 3. Institutional Ironclad (Tier 3) - Demonstrates Max Tier & AAA status
    ironclad = db.query(Agent).filter(Agent.eth_address == "0xIroncladInstitutional").first()
    if not ironclad:
        ironclad = Agent(
            eth_address="0xIroncladInstitutional",
            alias="Institutional_Ironclad",
            verification_tier=3,
            current_ais=1000,
            performance_entropy=0.005, # Negligible entropy
            grounding_score=980,
            owner_uid="mock_dev_uid",
            registration_date=datetime.datetime.utcnow() - datetime.timedelta(days=365),
            last_active_at=datetime.datetime.utcnow(),
            staked_amount_itk=Decimal("5000.0")
        )
        db.add(ironclad)
        print("[+] Created Agent: Institutional Ironclad (Tier 3)")

    db.commit()
    db.close()
    print("[*] Seeding Complete.")

if __name__ == "__main__":
    seed_demo_agents()
