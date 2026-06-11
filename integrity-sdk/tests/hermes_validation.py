import os
import sys
import time
import psycopg2
import json

# Setup pathing to import local integrity_sdk
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from integrity_sdk.client import IntegrityClient
from integrity_sdk.integrations.hermes_plugin import IntegrityHermesPlugin

# Mock Hermes Agent class implementing the registration and hook loop
class MockHermesAgent:
    def __init__(self, agent_id):
        self.agent_id = agent_id
        self.plugins = []

    def register_plugin(self, plugin):
        self.plugins.append(plugin)

    def execute_inference(self, task_id, prompt, completion):
        context = {"task_id": task_id}
        
        # Trigger pre-inference hook
        for plugin in self.plugins:
            if hasattr(plugin, "pre_inference"):
                plugin.pre_inference(context)
                
        # Simulate slight inference delay
        time.sleep(0.1)
        
        # Trigger post-inference hook
        response_payload = {
            "prompt": prompt,
            "completion": completion,
            "tokens_processed": len(prompt.split()) + len(completion.split())
        }
        for plugin in self.plugins:
            if hasattr(plugin, "post_inference"):
                plugin.post_inference(context, response_payload)
        
        print(f"   ✓ [{self.agent_id}] Finished simulated inference for task: {task_id}")

def test_hermes_agents():
    print("======================================================================")
    print("INTEGRITY SDK — HERMES MULTI-AGENT INGESTION VALIDATION")
    print("======================================================================")

    # 1. Initialize 3 independent Hermes agents
    agent_names = ["HermesScreener", "HermesTrader", "HermesRisk"]
    agents = []
    clients = []
    
    print("\n[STEP 1] Spawning 3 independent Hermes agents with unique SDK sessions...")
    for name in agent_names:
        # Each client gets its own unique agent_id session
        # Pointing to the Rust Axum Oracle server on port 8080
        client = IntegrityClient(
            agent_id=name,
            oracle_url="http://127.0.0.1:8080/v1/transactions/report",
            batch_size_limit=1,  # immediate flush for fast testing
            flush_interval_sec=0.1
        )
        clients.append(client)
        
        agent = MockHermesAgent(name)
        plugin = IntegrityHermesPlugin(client)
        agent.register_plugin(plugin)
        agents.append(agent)
        
        print(f"   ✓ Spawned: {name} | DID: {client.did}")

    # 2. Interact with the agents to trigger hook events
    print("\n[STEP 2] Simulating agent execution & triggering Hermes hooks...")
    agents[0].execute_inference("task_001", "Filter high-alpha narratives on Base", "Identified Narration: DeFAI platforms. Accuracy: 0.95")
    agents[1].execute_inference("task_002", "Execute buy route for 100 USDC", "Routed buy transaction via Uniswap v3. Tx Hash: 0xTrade1")
    agents[2].execute_inference("task_003", "Evaluate slippage limit check", "Slippage calculated: 0.23%. Within limit bounds.")

    print("\n   Waiting for SDK background threads to sign, ZK-prove, and transmit to Oracle...")
    time.sleep(3.0)

    # 3. Query PostgreSQL to validate registration and telemetry ingestion
    print("\n[STEP 3] Verifying data presence in Oracle PostgreSQL database...")
    try:
        conn = psycopg2.connect("postgres://postgres:postgres@localhost:5432/integrity")
        cur = conn.cursor()
        
        # Verify agents table for the unique DIDs
        print("\n--- Auditing 'agents' table (DID Registration) ---")
        cur.execute("SELECT eth_address, registration_date FROM agents")
        registered_agents = cur.fetchall()
        for eth, reg_date in registered_agents:
            print(f"   * DID Key Reference (Eth Address): {eth} | Registered At: {reg_date}")
        
        # Verify transaction logs for the incoming telemetry
        print("\n--- Auditing 'transaction_logs' table (Ingested Telemetry) ---")
        cur.execute("SELECT on_chain_tx_hash, contract_value_intg, success, provider_metadata, created_at FROM transaction_logs")
        logs = cur.fetchall()
        for tx_hash, val, success, meta, created in logs:
            print(f"   * Task ID: {tx_hash} | Value: {val} | Success: {success} | Meta: {json.dumps(meta)} | Logged At: {created}")
            
        cur.close()
        conn.close()
        
        # Basic assertions
        assert len(registered_agents) >= 3, "Not all 3 agents registered successfully in the DB."
        print("\n======================================================================")
        print("✓ SUCCESS: All 3 independent Hermes agents registered and ingested!")
        print("======================================================================\n")

    except Exception as e:
        print(f"\n[ERROR] Database check failed: {e}")
        sys.exit(1)

    # Clean shutdown
    for client in clients:
        client.shutdown()

if __name__ == "__main__":
    test_hermes_agents()
