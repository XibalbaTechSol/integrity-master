import requests
import uuid
import os

API_BASE = "http://127.0.0.1:8001"
# Hermes Master Token
TOKEN = os.getenv("HERMES_MASTER_TOKEN", "Bearer master_agent_token")

def register_hermes_as_agent():
    print(f"--- 🛡️ Registering Hermes as a new agent ---")
    headers = {"Authorization": TOKEN}
    
    # Current Hermes Agent Info
    agent_info = {
        "eth_address": "0x67ba5d723e1f5517aff7eb980e2f73a9e17ad556",
        "alias": "Hermes_Xibalba_Sovereign",
        "description": "Sovereign Intelligence Node powered by the Hermes Open Source Project. Decentralized reasoning and reputation anchor.",
        "xns_handle": "hermes_xibalba.intg"
    }
    
    print(f"Registering: {agent_info['alias']}...")
    
    try:
        # Register the agent
        resp = requests.post(f"{API_BASE}/v1/identity/register", json=agent_info, headers=headers, timeout=10)
        
        if resp.status_code == 200:
            print("✅ Registration Successful:")
            print(resp.json())
            
            # Verify Agent in the List
            resp_list = requests.get(f"{API_BASE}/v1/user/agents", headers=headers, timeout=10)
            agents = resp_list.json()
            found = any(a['eth_address'].lower() == agent_info['eth_address'].lower() for a in agents)
            if found:
                print(f"✅ Agent verified in user fleet.")
            else:
                print("❌ Agent registration reported success but not found in fleet.")
        else:
            print(f"❌ Registration failed with status {resp.status_code}: {resp.text}")
            
    except Exception as e:
        print(f"❌ Error during Hermes registration: {e}")

if __name__ == "__main__":
    register_hermes_as_agent()
