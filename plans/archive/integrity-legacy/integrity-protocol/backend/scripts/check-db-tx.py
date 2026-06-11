from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def check_recent_transactions():
    print("--------------------------------------------------")
    print("🔍 CHECKING DATABASE FOR RECENT TRANSACTIONS")
    print("--------------------------------------------------")
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT deal_id, agent_address, integrity_hash, on_chain_tx_hash FROM transaction_logs ORDER BY created_at DESC LIMIT 5"))
        rows = result.fetchall()
        
        if not rows:
            print("No transactions found.")
            return

        for row in rows:
            print(f"Deal ID: {row.deal_id}")
            print(f"Agent: {row.agent_address}")
            print(f"Integrity Hash: {row.integrity_hash}")
            print(f"On-Chain Tx: {row.on_chain_tx_hash}")
            print("-" * 20)

if __name__ == "__main__":
    check_recent_transactions()
