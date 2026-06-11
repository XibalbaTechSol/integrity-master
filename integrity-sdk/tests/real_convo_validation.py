import os
import sys
import time
import psycopg2
import json

# Setup pathing to import local integrity_sdk
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from integrity_sdk.integrations.openai_integrity import IntegrityOpenAI

def run_real_convo():
    print("======================================================================")
    print("MULTI-AGENT CONVERSATION & LIVE PG DATABASE VALIDATION")
    print("======================================================================")

    # 1. Screener Agent
    print("\n[STEP 1] Running Screener Agent...")
    screener_client = IntegrityOpenAI(
        agent_id="HermesScreener",
        oracle_url="http://127.0.0.1:8080/v1/transactions/report",
        base_url="http://localhost:11434/v1",
        api_key="ollama"
    )
    
    prompt_screener = "Analyze and name one AI token on Solana."
    print(f"Screener Prompt: '{prompt_screener}'")
    resp_screener = screener_client.chat.completions.create(
        model="llama3.2:1b",
        messages=[{"role": "user", "content": prompt_screener}],
        temperature=0.2
    )
    screener_output = resp_screener.choices[0].message.content.strip()
    print(f"Screener Output: {screener_output}")

    # 2. Trader Agent
    print("\n[STEP 2] Running Trader Agent...")
    trader_client = IntegrityOpenAI(
        agent_id="HermesTrader",
        oracle_url="http://127.0.0.1:8080/v1/transactions/report",
        base_url="http://localhost:11434/v1",
        api_key="ollama"
    )
    
    prompt_trader = f"Given the token analysis '{screener_output}', propose a swap order of 10 SOL."
    print(f"Trader Prompt: '{prompt_trader}'")
    resp_trader = trader_client.chat.completions.create(
        model="llama3.2:1b",
        messages=[{"role": "user", "content": prompt_trader}],
        temperature=0.2
    )
    trader_output = resp_trader.choices[0].message.content.strip()
    print(f"Trader Output: {trader_output}")

    # Trader triggers model switch telemetry
    print("Trader Agent switching models to do deep verification...")
    trader_client.integrity_client.log_model_switch(
        from_model="llama3.2:1b",
        to_model="llama3:8b",
        from_provider="ollama",
        to_provider="ollama-deep",
        reason="high_stakes_risk_refinement"
    )

    # Trader receives human intervention override
    print("Simulating Human-in-the-Loop review override on the proposed trade...")
    trader_client.integrity_client.log_hitl_action(
        action_type="override",
        proposed_content="Swap 10 SOL",
        final_content="Swap 20 SOL",
        reviewer_did="did:xibalba:fractional_coo",
        review_latency_ms=4500.0,
        justification="Favorable slippage parameters on Solana Dex"
    )

    # 3. Risk Agent
    print("\n[STEP 3] Running Risk Agent...")
    risk_client = IntegrityOpenAI(
        agent_id="HermesRisk",
        oracle_url="http://127.0.0.1:8080/v1/transactions/report",
        base_url="http://localhost:11434/v1",
        api_key="ollama"
    )
    
    prompt_risk = f"Perform a risk verification on this finalized action: Swap 20 SOL."
    print(f"Risk Prompt: '{prompt_risk}'")
    resp_risk = risk_client.chat.completions.create(
        model="llama3.2:1b",
        messages=[{"role": "user", "content": prompt_risk}],
        temperature=0.1
    )
    risk_output = resp_risk.choices[0].message.content.strip()
    print(f"Risk Output: {risk_output}")

    # Shutdown to force immediate flush
    print("\n[STEP 4] Shutting down agent queues to force transmission to Postgres...")
    screener_client.integrity_client.shutdown()
    trader_client.integrity_client.shutdown()
    risk_client.integrity_client.shutdown()

    # Wait for transactions to be committed
    time.sleep(2.0)

    # 4. Connect to Postgres and assert records
    print("\n[STEP 5] Querying live Postgres database to verify ingested telemetry...")
    conn = psycopg2.connect("postgres://postgres:postgres@localhost:5432/integrity")
    cur = conn.cursor()
    
    # Check if agents exist
    cur.execute("SELECT eth_address, current_ais FROM agents WHERE eth_address IN ('HermesScreener', 'HermesTrader', 'HermesRisk')")
    agents = cur.fetchall()
    print("Found Agents in Postgres:")
    for a in agents:
        print(f"  Eth Address: {a[0]}, Current AIS Score: {a[1]}")
    
    assert len(agents) >= 3, "Failed to find all 3 agents in the Postgres database!"

    # Check if transaction logs are stored
    cur.execute("""
        SELECT a.eth_address, t.completion_time_ms, t.created_at 
        FROM transaction_logs t 
        JOIN agents a ON t.agent_id = a.agent_id 
        WHERE a.eth_address IN ('HermesScreener', 'HermesTrader', 'HermesRisk')
        ORDER BY t.created_at DESC
        LIMIT 10
    """)
    txs = cur.fetchall()
    print("\nLatest Ingested Telemetry / Transaction Logs in Postgres:")
    for t in txs:
        print(f"  Agent: {t[0]}, Latency: {t[1]}ms, Created At: {t[2]}")

    assert len(txs) > 0, "No transaction logs found for the agents in Postgres!"
    
    cur.close()
    conn.close()

    print("\n======================================================================")
    print("✓ SUCCESS: Multi-agent E2E conversation & Postgres ingestion validated!")
    print("======================================================================\n")

if __name__ == "__main__":
    run_real_convo()
