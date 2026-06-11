import psycopg2

try:
    conn = psycopg2.connect("postgres://postgres:postgres@localhost:5432/integrity")
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    tables = cur.fetchall()
    print("Tables in 'integrity' database:")
    for table in tables:
        print(f"- {table[0]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
