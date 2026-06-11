import os
import json
import time
from web3 import Web3
from scoring_engine import IntegrityEcosystemScoringEngine

# Integrity Protocol: Blockchain Listener Service (ITK-Monitor)
# This service bridges the On-Chain Ledger to the Xibalba Trust Database.

class IntegrityBlockchainListener:
    def __init__(self, rpc_url, contract_address, abi_path):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.contract_address = self.w3.to_checksum_address(contract_address)
        
        with open(abi_path, 'r') as f:
            self.abi = json.load(f)
            
        self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.abi)
        self.engine = IntegrityEcosystemScoringEngine()
        
    def log_to_database(self, agent_address, tx_hash, amount, event_type):
        """
        Placeholder for Database DAO call.
        In production, this would use the schema defined in schema.sql.
        """
        print(f"[XIBALBA DB] Logging {event_type} for Agent {agent_address}")
        print(f"  Hash: {tx_hash}")
        print(f"  Amount: {amount} ITK")
        
        # In production:
        # 1. Update transaction_logs table
        # 2. Update agents.last_active_at
        # 3. Calculate new AIS and update agents.current_ais
        
    def handle_event(self, event):
        """
        Processes incoming blockchain events.
        """
        tx_hash = event['transactionHash'].hex()
        args = event['args']
        
        # Example: VerificationFeePaid event
        if 'VerificationFeePaid' in event['event']:
            agent = args['agent']
            amount = Web3.from_wei(args['amount'], 'ether')
            self.log_to_database(agent, tx_hash, amount, "VERIFICATION_FEE")
            
        # Example: Transfer event (Used for volume/TrustFlow)
        elif 'Transfer' in event['event']:
            sender = args['from']
            receiver = args['to']
            amount = Web3.from_wei(args['value'], 'ether')
            
            # Log both sides to track TrustFlow and Volume
            self.log_to_database(sender, tx_hash, amount, "OUTGOING_TRANSFER")
            self.log_to_database(receiver, tx_hash, amount, "INCOMING_TRANSFER")

    def start_listening(self, from_block='latest'):
        """
        Polls the blockchain for new Integrity Protocol events.
        """
        print(f"[*] Xibalba Verification Node started on {self.contract_address}")
        print("[*] Monitoring for ITK Trust Events...")
        
        # In production, use a filter or a WebSocket for real-time events
        event_filter = self.contract.events.VerificationFeePaid.create_filter(from_block=from_block)
        
        while True:
            for event in event_filter.get_new_entries():
                self.handle_event(event)
            time.sleep(10) # Poll every 10 seconds

if __name__ == "__main__":
    # Mock configuration for setup (Use environment variables in production)
    RPC_URL = os.getenv("ETH_RPC_URL", "https://sepolia.infura.io/v3/YOUR_KEY")
    CONTRACT_ADDR = "0x0000000000000000000000000000000000000000" # Placeholder
    ABI_PATH = "contracts/abi.json" # Needs to be generated from compilation
    
    # listener = IntegrityBlockchainListener(RPC_URL, CONTRACT_ADDR, ABI_PATH)
    # listener.start_listening()
    print("[!] Listener initialized. Awaiting ABI and Contract Address for deployment.")
