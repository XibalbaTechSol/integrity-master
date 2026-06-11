import os
import time
import json
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

# Xibalba Solutions: On-Chain Economic Validator (v8.3)
class EconomicValidator:
    def __init__(self):
        self.rpc_url = os.getenv("ETH_RPC_URL", "https://sepolia.base.org")
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        self.itk_address = os.getenv("ITK_TOKEN_ADDRESS")
        self.master_key = os.getenv("XIBALBA_ORACLE_PRIVATE_KEY")
        self.master_addr = Account.from_key(self.master_key).address
        
        self.itk_abi = [
            {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
            {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
            {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}
        ]
        
        self.token = self.w3.eth.contract(address=self.w3.to_checksum_address(self.itk_address), abi=self.itk_abi)

    def get_balance(self, address):
        bal = self.token.functions.balanceOf(self.w3.to_checksum_address(address)).call()
        return self.w3.from_wei(bal, 'ether')

    def validate_round_trip(self, target_addr, amount_itk):
        print(f"🚀 STARTING ROUND-TRIP VALIDATION: Master -> {target_addr} -> Master")
        
        # 1. Master -> Target
        bal_master_start = self.get_balance(self.master_addr)
        bal_target_start = self.get_balance(target_addr)
        
        print(f"[*] Initial Balances: Master={bal_master_start}, Target={bal_target_start}")
        
        print(f"[*] Dispatching {amount_itk} ITK to Target...")
        tx_hash = self.send_tokens(self.master_key, target_addr, amount_itk)
        print(f"[*] Tx: {tx_hash}")
        
        # Wait and verify
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        if receipt.status != 1:
            print("❌ Tx 1 Failed!")
            return

        bal_target_mid = self.get_balance(target_addr)
        print(f"[*] Mid Balance (Target): {bal_target_mid} ITK (Delta: {bal_target_mid - bal_target_start})")
        
        print("✅ STEP 1 COMPLETE: Master successfully sent tokens.")

    def send_tokens(self, from_key, to_addr, amount_itk):
        from_addr = Account.from_key(from_key).address
        amount_wei = self.w3.to_wei(amount_itk, 'ether')
        nonce = self.w3.eth.get_transaction_count(from_addr)
        
        tx = self.token.functions.transfer(
            self.w3.to_checksum_address(to_addr),
            amount_wei
        ).build_transaction({
            'from': from_addr,
            'nonce': nonce,
            'gas': 100000,
            'gasPrice': self.w3.eth.gas_price
        })
        
        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=from_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        return tx_hash.hex()

if __name__ == "__main__":
    validator = EconomicValidator()
    # Using Alpha Sentinel address from demo fleet
    ALPHA_ADDR = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
    
    try:
        validator.validate_round_trip(ALPHA_ADDR, 5.0)
    except Exception as e:
        print(f"Error: {e}")
