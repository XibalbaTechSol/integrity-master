import os
import time
import json
import requests
from web3 import Web3

# Base Sepolia config
RPC_URL = os.environ.get("BASE_SEPOLIA_RPC", "https://sepolia.base.org")
PRIVATE_KEY = os.environ.get("ORACLE_PRIVATE_KEY")
ORACLE_REGISTRY_ADDRESS = os.environ.get("ORACLE_REGISTRY_ADDRESS")

# Dummy ABI to let the script compile/run conceptually
ORACLE_REGISTRY_ABI = json.loads("""[
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"sourceId","type":"uint256"},{"indexed":false,"internalType":"string","name":"name","type":"string"},{"indexed":false,"internalType":"string","name":"uri","type":"string"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"staked","type":"uint256"}],"name":"SourceAdded","type":"event"}
]""")

def fetch_wikipedia_data():
    """Fetches real data from Wikipedia API"""
    url = "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=info&titles=Artificial_intelligence"
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        pages = data.get("query", {}).get("pages", {})
        for page_id, info in pages.items():
            return {
                "title": info.get("title"),
                "lastrevid": info.get("lastrevid"),
                "length": info.get("length")
            }
    except Exception as e:
        print(f"[ERROR] Wikipedia fetch failed: {e}")
    return None

def listen_for_registrations(w3, contract):
    """Listens to the OracleRegistry contract for new registrations."""
    print("[DAEMON] Listening for new Oracle Node registrations...")
    # In a real daemon, we'd use w3.eth.filter or websockets.
    # We will poll blocks conceptually.
    
    last_block = w3.eth.block_number
    while True:
        try:
            current_block = w3.eth.block_number
            if current_block > last_block:
                events = contract.events.SourceAdded.get_logs(fromBlock=last_block+1, toBlock=current_block)
                for event in events:
                    args = event["args"]
                    print(f"[EVENT] New Oracle Registered! ID: {args['sourceId']} Name: {args['name']} URI: {args['uri']}")
                    
                    if "wikipedia" in args['uri'].lower():
                        print("[DAEMON] Wikipedia Node detected! Commencing Wikipedia fetch sequence...")
                        wiki_data = fetch_wikipedia_data()
                        if wiki_data:
                            print(f"[DAEMON] Fetched Wikipedia Payload: {wiki_data}")
                            # TODO: Actually post this payload to the Rollup/L2 via another transaction
                last_block = current_block
            time.sleep(2)
        except Exception as e:
            print(f"[ERROR] Daemon loop exception: {e}")
            time.sleep(5)

if __name__ == "__main__":
    print("[DAEMON] Starting World Awareness Oracle Daemon...")
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        print("[ERROR] Cannot connect to Base Sepolia RPC.")
        exit(1)
        
    print(f"[DAEMON] Connected to Base Sepolia at block {w3.eth.block_number}")
    
    # We can skip contract loading if the address is missing for now, 
    # to let the daemon start conceptually in dev mode.
    if not ORACLE_REGISTRY_ADDRESS:
        print("[WARN] ORACLE_REGISTRY_ADDRESS not set. Running in dummy mode.")
        while True:
            print("[DAEMON] Dummy mode - periodic Wikipedia test fetch:")
            print(fetch_wikipedia_data())
            time.sleep(10)
    else:
        contract = w3.eth.contract(address=ORACLE_REGISTRY_ADDRESS, abi=ORACLE_REGISTRY_ABI)
        listen_for_registrations(w3, contract)

