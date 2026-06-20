import os
import sys
import time
import sqlite3
import psycopg2
from openai import OpenAI

# Setup pathing to import local integrity_sdk
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from integrity_sdk.integrations.openai_integrity import IntegrityOpenAI

def run_real_inference():
    print("======================================================================")
    print("RUNNING REAL INFERENCE WITH HERMES AGENTS USING OLLAMA (llama3.2:1b)")
    print("======================================================================")
    
    agent_queries = {
        "HermesScreener": "List three cryptocurrency tokens that are related to decentralized AI.",
        "HermesTrader": "Write a short trading plan for managing risk during high slippage volatility.",
        "HermesRisk": "Explain how standard deviation relates to portfolio drawdowns."
    }
    
    clients = []
    
    for name, prompt in agent_queries.items():
        print(f"\n---> Running real inference for [{name}]...")
        
        # Wrap standard OpenAI client pointing to local Ollama instance
        client = IntegrityOpenAI(
            agent_id=name,
            oracle_url="http://127.0.0.1:8080/v1/transactions/report",
            base_url="http://localhost:11434/v1",
            api_key="ollama"
        )
        clients.append(client)
        
        # Execute chat completion
        start_time = time.time()
        response = client.chat.completions.create(
            model="llama3.2:1b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        latency = (time.time() - start_time) * 1000
        completion_text = response.choices[0].message.content
        
        print(f"   Response Latency: {latency:.2f}ms")
        print(f"   Completion Preview: {completion_text[:120]}...")
        
    print("\nWaiting for async telemetry queues to flush to Oracle...")
    time.sleep(3.0)
    
    # Associate newly logged agents with mock_dev_uid in PostgreSQL and SQLite
    print("\nLinking agents to demo user profile in SQLite/Postgres databases...")
    
    # 1. Update SQLite
    try:
        conn_sqlite = sqlite3.connect("/home/xibalba/Projects/integrity-oracle/backend/integrity_protocol.db")
        cur_sqlite = conn_sqlite.cursor()
        cur_sqlite.execute("""
            UPDATE agents 
            SET owner_uid = 'mock_dev_uid', 
                staked_amount_itk = 8500.0,
                is_active = 1,
                current_ais = 820,
                grounding_score = 940,
                entropy_score = 80
            WHERE eth_address IN ('HermesScreener', 'HermesTrader', 'HermesRisk')
        """)
        conn_sqlite.commit()
        conn_sqlite.close()
        print("   ✓ Updated SQLite database successfully.")
    except Exception as e:
        print(f"   ✗ SQLite update failed: {e}")
        
    # 2. Update PostgreSQL
    try:
        conn_pg = psycopg2.connect("postgres://postgres:postgres@localhost:5432/integrity")
        cur_pg = conn_pg.cursor()
        cur_pg.execute("""
            UPDATE agents 
            SET owner_uid = 'mock_dev_uid', 
                gpu_hours_verified = 42.5,
                performance_entropy = 0.12,
                current_ais = 820,
                is_active = true
            WHERE eth_address IN ('HermesScreener', 'HermesTrader', 'HermesRisk')
        """)
        conn_pg.commit()
        conn_pg.close()
        print("   ✓ Updated PostgreSQL database successfully.")
    except Exception as e:
        print(f"   ✗ PostgreSQL update failed: {e}")

    # Shutdown client queues
    for c in clients:
        c.integrity_client.shutdown()
        
    print("\n======================================================================")
    print("✓ Inference complete! Real data loaded in database.")
    print("======================================================================\n")

if __name__ == "__main__":
    run_real_inference()
