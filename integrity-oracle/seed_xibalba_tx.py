import psycopg2
import uuid
import random
import time

conn = psycopg2.connect("dbname=integrity user=postgres password=postgres host=localhost port=15432")
cur = conn.cursor()

agent_id = "88d5ab08-156b-45cf-9b17-32e74a9f2690"

for i in range(10):
    tx_hash = f"0x{random.getrandbits(256):064x}"
    cur.execute("""
        INSERT INTO transaction_logs (agent_id, on_chain_tx_hash, contract_value_intg, staked_amount_intg, success, completion_time_ms, data_quality_score, verified_by_xibalba)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (agent_id, tx_hash, random.uniform(10, 500), random.uniform(100, 1000), True, random.randint(100, 2000), random.uniform(0.8, 1.0), True))

conn.commit()
cur.close()
conn.close()
print("Seeded 10 tx logs for Xibalba")
