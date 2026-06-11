import os
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

rpc_url = os.getenv("ETH_RPC_URL", "https://sepolia.base.org")
w3 = Web3(Web3.HTTPProvider(rpc_url))

itk_address = "0xF448c05074D435d256D6fbc1fC059019B86A5408"
master_addr = "0x67ba5d723e1f5517aff7eb980e2f73a9e17ad556"
alpha_addr = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"

abi = [{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]
token = w3.eth.contract(address=w3.to_checksum_address(itk_address), abi=abi)

print(f"Network: {rpc_url}")
print(f"Token: {itk_address}")
print(f"Master Balance: {w3.from_wei(token.functions.balanceOf(w3.to_checksum_address(master_addr)).call(), 'ether')} ITK")
print(f"Alpha Balance: {w3.from_wei(token.functions.balanceOf(w3.to_checksum_address(alpha_addr)).call(), 'ether')} ITK")
