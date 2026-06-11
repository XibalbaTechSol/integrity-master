import sys
import os
import argparse
from dotenv import load_dotenv

# Ensure we can find the blockchain service
sys.path.append(os.path.join(os.path.dirname(__file__), "services"))

from blockchain_service import IntegrityBlockchainService

def main():
    parser = argparse.ArgumentParser(description="Integrity Protocol Faucet Worker")
    parser.add_argument("address", help="The EVM address to receive tokens")
    parser.add_argument("--amount", type=float, default=100000.0, help="Amount of ITK to drop")
    args = parser.parse_args()

    # Load environment variables from the oracle root
    env_path = os.path.join(os.path.dirname(__file__), "..", "oracle", ".env")
    load_dotenv(env_path)

    print(f"[*] Faucet Worker: Dropping {args.amount} ITK to {args.address}...")
    
    blockchain = IntegrityBlockchainService()
    result = blockchain.faucet_drop(args.address, args.amount)
    
    if result.get("status") == "success":
        print(f"[+] Success! Tx: {result.get('tx_hash')}")
        sys.exit(0)
    else:
        print(f"[-] Failed: {result.get('message')}")
        sys.exit(1)

if __name__ == "__main__":
    main()
