import os
import sys
import subprocess
import requests
import json
import logging
import time as time_mod
from typing import Dict, Any

# Xibalba Solutions: Hermes Protocol Health Check (v1.1)
# "Form-First Engineering. Absolute System Integrity."

logging.basicConfig(level=logging.INFO, format='[HEALTH] %(message)s')
logger = logging.getLogger("hermes_health")

class HermesHealthCheck:
    def __init__(self):
        self.backend_url = "https://integrity-protocol-backend.onrender.com"
        self.rpc_url = "https://sepolia.base.org"
        self.status = {}

    def check_hermes_sync(self):
        """Checks if the hermes_sync tool is in the PATH."""
        try:
            result = subprocess.run(["which", "hermes_sync"], capture_output=True, text=True)
            exists = result.returncode == 0
            self.status["hermes_sync"] = "OK" if exists else "MISSING"
            return exists
        except Exception:
            self.status["hermes_sync"] = "ERROR"
            return False

    def check_integrity_backend(self):
        """Pings the Integrity Protocol backend."""
        try:
            resp = requests.get(f"{self.backend_url}/health", timeout=5)
            healthy = resp.status_code == 200
            self.status["integrity_backend"] = "OK" if healthy else f"FAILED ({resp.status_code})"
            return healthy
        except Exception as e:
            self.status["integrity_backend"] = f"OFFLINE ({str(e)})"
            return False

    def check_bridge_daemon(self):
        """Checks if the hermes_integrity_bridge is running and attempts self-healing."""
        try:
            # Check for process
            result = subprocess.run(["ps", "aux"], capture_output=True, text=True)
            running = "hermes_integrity_bridge.py" in result.stdout
            
            if not running:
                logger.warning("Integrity Bridge is STOPPED. Attempting self-healing...")
                # Try to restart
                # Use a safe mock key if AGENT_PRIVATE_KEY is missing for dev
                env = os.environ.copy()
                if "AGENT_PRIVATE_KEY" not in env:
                    env["AGENT_PRIVATE_KEY"] = "0x" + "a"*64 # Dummy 64-char hex key
                
                sdk_path = os.path.join(os.getcwd(), "backend/sdk/python")
                env["PYTHONPATH"] = f"{env.get('PYTHONPATH', '')}:{sdk_path}"
                
                subprocess.Popen(
                    [sys.executable, "backend/scripts/hermes_integrity_bridge.py"],
                    env=env,
                    stdout=open("bridge.log", "a"),
                    stderr=open("bridge.log", "a"),
                    start_new_session=True
                )
                time_mod.sleep(2)
                
                # Check again
                result = subprocess.run(["ps", "aux"], capture_output=True, text=True)
                running = "hermes_integrity_bridge.py" in result.stdout
                
            self.status["integrity_bridge"] = "RUNNING" if running else "STOPPED"
            return running
        except Exception as e:
            logger.error(f"Bridge health check failed: {e}")
            self.status["integrity_bridge"] = "ERROR"
            return False

    def check_web3_connectivity(self):
        """Validates connection to Base Sepolia RPC."""
        payload = {
            "jsonrpc": "2.0",
            "method": "eth_blockNumber",
            "params": [],
            "id": 1
        }
        try:
            resp = requests.post(self.rpc_url, json=payload, timeout=5)
            success = resp.status_code == 200 and "result" in resp.json()
            self.status["base_sepolia_rpc"] = "OK" if success else "RPC_ERROR"
            return success
        except Exception:
            self.status["base_sepolia_rpc"] = "OFFLINE"
            return False

    def run_all(self):
        # Mandatory Directory Check
        project_root = "/home/xibalba/Projects/integrity-protocol"
        if os.getcwd() != project_root:
            logger.error(f"Health Check Bypassed: Current directory ({os.getcwd()}) is not project root.")
            return False

        logger.info("--- 🛡️ Initializing Hermes Protocol Health Check ---")
        self.check_hermes_sync()
        self.check_integrity_backend()
        self.check_bridge_daemon()
        self.check_web3_connectivity()
        
        print("\n" + "="*50)
        print(f"{'COMPONENT':<25} | {'STATUS':<20}")
        print("-" * 50)
        for comp, stat in self.status.items():
            icon = "✅" if "OK" in stat or "RUNNING" in stat else "❌"
            print(f"{comp:<25} | {icon} {stat}")
        print("="*50 + "\n")
        
        overall = all("OK" in v or "RUNNING" in v for v in self.status.values())
        if overall:
            logger.info("✨ SYSTEM INTEGRITY VERIFIED. Hermes is fully operational.")
        else:
            logger.warning("⚠️ SYSTEM DEGRADED. Some components require attention.")
        
        return overall

if __name__ == "__main__":
    checker = HermesHealthCheck()
    success = checker.run_all()
    sys.exit(0 if success else 1)
