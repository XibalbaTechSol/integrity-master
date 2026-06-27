import os
import json
import time
import threading
from typing import Set
from .client import IntegrityClient

class AutodiscoveryDaemon:
    """
    Background daemon that monitors local execution environments to auto-discover
    and auto-register AI agents and subagents with the Oracle Registry.
    """
    def __init__(self, oracle_url: str = "http://localhost:8080", poll_interval: int = 10):
        self.oracle_url = oracle_url
        self.poll_interval = poll_interval
        self.brain_dir = os.path.expanduser("~/.gemini/antigravity-cli/brain")
        self.cache_file = os.path.expanduser("~/.integrity_discovery_cache.json")
        self.registered_agents: Set[str] = self._load_cache()
        self._running = False
        self._thread = None

    def _load_cache(self) -> Set[str]:
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r') as f:
                    return set(json.load(f).get("registered_agents", []))
            except Exception:
                pass
        return set()

    def _save_cache(self):
        try:
            with open(self.cache_file, 'w') as f:
                json.dump({"registered_agents": list(self.registered_agents)}, f)
        except Exception as e:
            print(f"[Autodiscovery] Failed to save cache: {e}")

    def start(self):
        if not self._running:
            self._running = True
            self._thread = threading.Thread(target=self._loop, daemon=True)
            self._thread.start()
            print("[Autodiscovery] Daemon started.", flush=True)

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=2)

    def _loop(self):
        while self._running:
            self.scan_and_register()
            time.sleep(self.poll_interval)

    def scan_and_register(self):
        if not os.path.exists(self.brain_dir):
            return

        new_agents = 0
        for entry in os.listdir(self.brain_dir):
            agent_id = entry.strip()
            
            # Skip non-UUID like formats if desired, but here we just check if it's a dir
            dir_path = os.path.join(self.brain_dir, entry)
            if not os.path.isdir(dir_path):
                continue
                
            if agent_id not in self.registered_agents:
                success = self._register_agent(agent_id, dir_path)
                if success:
                    self.registered_agents.add(agent_id)
                    new_agents += 1

        if new_agents > 0:
            self._save_cache()

    def _register_agent(self, agent_id: str, dir_path: str) -> bool:
        """Attempts to register the agent with the Oracle."""
        try:
            # We can use the standard client for registration
            client = IntegrityClient(agent_id=agent_id, oracle_url=self.oracle_url)
            
            # Extract possible metadata if available in the brain dir
            eth_address = getattr(client, 'evm_address', None) or getattr(client, 'eth_address', "0x0000000000000000000000000000000000000000")
            alias = f"Autodiscovered_Agent_{agent_id[:8]}"
            client.register_agent(eth_address=eth_address, alias=alias)
            print(f"[Autodiscovery] Successfully registered agent: {agent_id}")
            return True
        except Exception as e:
            print(f"[Autodiscovery] Failed to register agent {agent_id}: {e}")
            return False

if __name__ == "__main__":
    daemon = AutodiscoveryDaemon()
    daemon.scan_and_register()
    print("One-shot scan complete.")
