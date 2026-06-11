import psycopg2
import uuid
import random
from datetime import datetime, timedelta
import json

# Connection string confirmed in test_conn.py
CONN_STR = "postgres://postgres:postgres@localhost:5432/integrity"

def get_connection():
    return psycopg2.connect(CONN_STR)

def clear_data(cur):
    print("Clearing existing data...")
    cur.execute("DELETE FROM ownership_claims")
    cur.execute("DELETE FROM agent_daily_snapshots")
    cur.execute("DELETE FROM xibalba_audits")
    cur.execute("DELETE FROM transaction_logs")
    cur.execute("DELETE FROM agents")

def seed_agents(cur):
    print("Seeding agents...")
    agents = []
    # Mix of tiers
    aliases = [
        ("Sovereign_Slacker", 1, 450, 0.15),
        ("Verified_Voyager", 2, 820, 0.03),
        ("Institutional_Ironclad", 3, 1000, 0.005),
        ("Quantum_Quill", 2, 750, 0.05),
        ("Cyber_Sentinel", 3, 950, 0.01),
        ("Data_Drifter", 1, 300, 0.25),
        ("Neural_Knight", 2, 880, 0.02),
        ("Ghost_Protocol", 3, 990, 0.008),
        ("Binary_Bard", 1, 550, 0.12),
        ("Silicon_Sage", 2, 790, 0.04)
    ]
    
    for alias, tier, ais, entropy in aliases:
        agent_id = str(uuid.uuid4())
        eth_address = f"0x{uuid.uuid4().hex[:40]}"
        owner_address = f"0x{uuid.uuid4().hex[:40]}"
        metadata = {
            "alias": alias,
            "verification_tier": tier,
            "grounding_score": random.randint(300, 1000),
            "staked_amount_itk": float(tier * 500 + random.randint(0, 500)),
            "owner_uid": f"user_{random.randint(100, 999)}"
        }
        
        cur.execute("""
            INSERT INTO agents (
                agent_id, eth_address, owner_address, current_ais, 
                performance_entropy, gpu_hours_verified, metadata
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING agent_id
        """, (
            agent_id, eth_address, owner_address, ais, 
            entropy, random.uniform(10, 500), json.dumps(metadata)
        ))
        agents.append({
            "id": agent_id,
            "eth": eth_address,
            "owner": owner_address,
            "tier": tier
        })
    return agents

def seed_transactions(cur, agents):
    print("Seeding transactions...")
    for _ in range(100):
        agent = random.choice(agents)
        tx_hash = f"0x{uuid.uuid4().hex}{uuid.uuid4().hex[:30]}"
        success = random.random() > 0.1 # 90% success rate
        value = random.uniform(1, 100)
        staked = agent['tier'] * 100
        
        cur.execute("""
            INSERT INTO transaction_logs (
                agent_id, on_chain_tx_hash, contract_value_intg, 
                staked_amount_intg, success, completion_time_ms, 
                data_quality_score, verified_by_xibalba
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            agent['id'], tx_hash, value, staked, success,
            random.randint(50, 2000), random.uniform(0.7, 1.0) if success else 0.0,
            random.random() > 0.5
        ))

def seed_audits(cur, agents):
    print("Seeding audits...")
    audit_types = ['AUTOMATED', 'MANUAL_DEEP_DIVE', 'PLATINUM']
    for agent in random.sample(agents, 5):
        cur.execute("""
            INSERT INTO xibalba_audits (
                agent_id, audit_type, verification_score, notes, expires_at
            ) VALUES (%s, %s, %s, %s, %s)
        """, (
            agent['id'], random.choice(audit_types), random.uniform(0.8, 1.0),
            "High integrity verified by Xibalba Sentinel.",
            datetime.now() + timedelta(days=90)
        ))

def seed_snapshots(cur, agents):
    print("Seeding daily snapshots...")
    for agent in agents:
        for i in range(7):
            date = datetime.now().date() - timedelta(days=i)
            cur.execute("""
                INSERT INTO agent_daily_snapshots (
                    agent_id, snapshot_date, tx_count_24h, ais_at_snapshot
                ) VALUES (%s, %s, %s, %s)
                ON CONFLICT (agent_id, snapshot_date) DO NOTHING
            """, (
                agent['id'], date, random.randint(0, 20), 
                random.randint(300, 1000)
            ))

def seed_claims(cur, agents):
    print("Seeding ownership claims...")
    for agent in random.sample(agents, 3):
        cur.execute("""
            INSERT INTO ownership_claims (
                agent_id, agent_wallet, owner_wallet, challenge_message, 
                signature, is_active
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            agent['id'], agent['eth'], agent['owner'],
            f"I own {agent['eth']}", "0x" + "f" * 130, True
        ))

def main():
    conn = get_connection()
    cur = conn.cursor()
    try:
        clear_data(cur)
        agents = seed_agents(cur)
        seed_transactions(cur, agents)
        seed_audits(cur, agents)
        seed_snapshots(cur, agents)
        seed_claims(cur, agents)
        conn.commit()
        print("Database seeded successfully!")
    except Exception as e:
        conn.rollback()
        print(f"Error seeding database: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
