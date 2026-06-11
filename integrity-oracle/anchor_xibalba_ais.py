import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "backend", "services"))

from blockchain_service import IntegrityBlockchainService
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env")

def main():
    blockchain = IntegrityBlockchainService()
    
    agent_address = "0x79eDf9d21F55a658636DFb3465Ba9bbA009f9D84"
    ais_score = 600
    tier = 1
    
    print(f"Anchoring AIS for {agent_address}...")
    print(f"AIS: {ais_score}, Tier: {tier}")
    
    tx_hash = blockchain.update_agent_reputation(agent_address, ais_score, tier)
    
    if tx_hash:
        print(f"✅ AIS Anchored successfully! Tx Hash: {tx_hash}")
    else:
        print("❌ AIS Anchoring failed.")

if __name__ == "__main__":
    main()
