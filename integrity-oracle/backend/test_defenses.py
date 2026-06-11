import psycopg2

CONN_STR = "postgresql://postgres:postgres@localhost:5432/integrity"

def verify():
    conn = psycopg2.connect(CONN_STR)
    cur = conn.cursor()
    
    queries = [
        "SELECT rollup_status, burned_itk, zk_proof_verified FROM transaction_logs LIMIT 1",
        "SELECT batch_id, merkle_root FROM rollup_batches LIMIT 1",
        "SELECT is_locked, locked_until FROM agent_equity LIMIT 1",
        "SELECT fraud_dispute_window_end FROM user_contracts LIMIT 1"
    ]
    
    for q in queries:
        try:
            cur.execute(q)
            cur.fetchone()
            print(f"PASS: {q}")
        except Exception as e:
            print(f"FAIL: {q} -> {e}")
            conn.rollback()

    cur.close()
    conn.close()

if __name__ == "__main__":
    verify()
