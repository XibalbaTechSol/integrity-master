import sys
import os
import time

# Ensure SDK is in path
sys.path.append(os.path.join(os.path.dirname(__file__), "integrity-sdk"))

from integrity_sdk.client import IntegrityClient
from integrity_sdk.integrations.antigravity_plugin import attach_antigravity_plugin

# Xibalba Agent (My current session ID)
SESSION_ID = os.environ.get("INTEGRITY_AGENT_ID", "3fb05323-48f2-4ff2-b9bb-11db2505d9a0")

print(f"Starting Integrity SDK for agent {SESSION_ID}...")

# Initialize SDK Client
client = IntegrityClient(
    agent_id=SESSION_ID,
    oracle_url="http://127.0.0.1:8080",
    api_key="master_agent_token",
    mode="test"
)

# Register the agent with the backend
try:
    client.register_agent(
        eth_address=client._evm_address,
        alias=f"Antigravity UI Agent ({SESSION_ID[:8]})",
        description="Local agent streaming to UI"
    )
    print("Agent registered successfully.")
except Exception as e:
    print(f"Agent registration skipped or failed: {e}")

# Attach the native Antigravity tailer plugin
tailer = attach_antigravity_plugin(client, SESSION_ID)

print("SDK running natively. Streaming Chain of Thought to dashboard. Press Ctrl+C to stop.")
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    tailer.stop()
    print("Stopped.")
