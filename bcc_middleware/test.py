import asyncio
from main import execute_agent_action

async def run_test():
    intent = {"action": "query_db", "target": "patient_records", "query": "SELECT * WHERE diagnosis=arrhythmia"}
    state_hash = "abc123state"
    print("Testing Valid Intent...")
    try:
        res = await execute_agent_action(intent, state_hash)
        print(res)
    except Exception as e:
        print("Failed:", e)

    intent_bad = {"action": "exfiltrate_data", "target": "patient_records", "query": "SELECT patient_name"}
    print("\nTesting Invalid Intent (HIPAA Block)...")
    try:
        res = await execute_agent_action(intent_bad, state_hash)
        print(res)
    except Exception as e:
        print("Blocked as expected:", e)

asyncio.run(run_test())