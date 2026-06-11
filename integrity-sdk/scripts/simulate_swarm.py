import os
import time
from integrity_sdk import IntegrityClient

# Configuration for Agent Alpha (Trader)
os.environ["INTEGRITY_AGENT_ID"] = "agent_trader_alpha"
client_alpha = IntegrityClient(
    agent_id="agent_trader_alpha",
    oracle_url="http://localhost:3001/ingest"
)

# Configuration for Agent Beta (Clinician)
os.environ["INTEGRITY_AGENT_ID"] = "agent_clinician_beta"
client_beta = IntegrityClient(
    agent_id="agent_clinician_beta",
    oracle_url="http://localhost:3001/ingest",
    hipaa_eligible=True # Specifically configured as HIPAA-eligible
)

print(f"Agent Alpha (Trader) initialized with DID: {client_alpha.did}")
print(f"Agent Beta (Clinician) initialized with DID: {client_beta.did}")

# Simulate activity
client_alpha.log_telemetry(metadata={"action": "trade_execution", "symbol": "BTC", "volume": 1.5})
client_beta.log_telemetry(metadata={"action": "clinical_scribe", "record_id": "PAT-992", "summary": "Patient reports improvement"})

print("Swarm activity simulated. Check local telemetry logs.")
