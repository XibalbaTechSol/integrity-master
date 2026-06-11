import sys
import os
from sqlalchemy import inspect

# Add the services directory to path
sys.path.append(os.path.join(os.getcwd(), "Projects/integrity-protocol/services"))
from database import engine, Base

def verify_schema():
    print("--- 🏛️ Task 2.1: PostgreSQL Integrity Audit ---")
    
    # Check if we are using SQLite or Postgres for this audit
    db_url = str(engine.url)
    print(f"Database URL: {db_url}")
    
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    print(f"Existing Tables: {existing_tables}")
    
    # Expected tables from protocol_specs.md and database.py
    expected_tables = ["agents", "transaction_logs", "user_profiles", "global_settings", "telemetry_logs", "reputation_snapshots"]
    
    success = True
    for table in expected_tables:
        if table in existing_tables:
            print(f"✅ Table '{table}' exists.")
            # Check columns for 'agents' as it's the most critical
            if table == "agents":
                cols = [c["name"] for c in inspector.get_columns(table)]
                critical_cols = ["agent_id", "eth_address", "current_ais", "performance_entropy", "gpu_hours_verified", "is_active"]
                for c_col in critical_cols:
                    if c_col in cols:
                        print(f"  ✅ Column '{c_col}' found.")
                    else:
                        print(f"  ❌ Column '{c_col}' MISSING.")
                        success = False
        else:
            print(f"❌ Table '{table}' is MISSING.")
            success = False
            
    if success:
        print("\n🏆 Task 2.1 Validation: SUCCESS")
    else:
        print("\n⚠️ Task 2.1 Validation: FAILED")
    return success

if __name__ == "__main__":
    if verify_schema():
        sys.exit(0)
    else:
        sys.exit(1)
