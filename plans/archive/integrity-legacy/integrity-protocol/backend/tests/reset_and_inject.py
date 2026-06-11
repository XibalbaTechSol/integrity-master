from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
import requests

# We must import from services so we need to add it to sys.path
import sys
sys.path.append("./services")
from database import TransactionLog, TelemetryLog, Agent

engine = create_engine("postgresql://xibalba_admin:integrity_secret_123@localhost:5434/integrity_protocol")
SessionLocal = sessionmaker(bind=engine)

def reset():
    db = SessionLocal()
    agent = db.query(Agent).filter(Agent.eth_address == "0xTestAgentV8").first()
    if agent:
        db.query(TransactionLog).filter(TransactionLog.agent_id == agent.agent_id).delete()
        db.query(TelemetryLog).filter(TelemetryLog.agent_id == agent.agent_id).delete()
        agent.penalty_points = 0.0
        db.commit()
    db.close()

if __name__ == "__main__":
    reset()
    print("[*] Logs cleared.")
