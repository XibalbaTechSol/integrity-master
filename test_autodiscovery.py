from integrity_sdk.universal import Integrity
import time
import os

print("Starting Autodiscovery Test...")

# Clear the cache to ensure it triggers
cache_path = os.path.expanduser("~/.integrity_discovery_cache.json")
if os.path.exists(cache_path):
    os.remove(cache_path)

# Initialize the global client with autodiscovery enabled
client = Integrity.init(enable_autodiscovery=True, oracle_url="http://127.0.0.1:8080")

# Wait 5 seconds for the daemon thread to pick up directories
time.sleep(5)

print("Test complete.")
