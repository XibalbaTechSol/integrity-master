#!/usr/bin/env python3
import os
import sys
import argparse
import subprocess
import requests
import json
import logging
import time as time_mod
from typing import Dict, Any, Optional

# Xibalba Solutions: Integrity Protocol Global CLI (v1.1)
# "Form-First Engineering. Mathematical Certainty."

logging.basicConfig(level=logging.INFO, format='[INTEGRITY] %(message)s')
logger = logging.getLogger("integrity")

DEFAULT_BACKEND_URL = "https://integrity-protocol-backend.onrender.com"
DEFAULT_RPC_URL = "https://sepolia.base.org"
SDK_DIR = os.path.dirname(os.path.realpath(__file__))
PROJECT_ROOT = "/home/xibalba/Projects/integrity-protocol"

class IntegrityCLI:
    def __init__(self):
        self.backend_url = DEFAULT_BACKEND_URL
        self.rpc_url = DEFAULT_RPC_URL
        self.status = {}
        self.manifest_path = None
        self.config = {}

    def _find_manifest(self):
        curr = os.getcwd()
        while curr != "/":
            p = os.path.join(curr, ".integrity.yaml")
            if os.path.exists(p):
                self.manifest_path = p
                try:
                    import yaml
                    with open(p, "r") as f:
                        self.config = yaml.safe_load(f) or {}
                except ImportError:
                    with open(p, "r") as f:
                        try:
                            self.config = json.load(f)
                        except:
                            pass
                return True
            curr = os.path.dirname(curr)
        return False

    def _check_hermes_sync(self):
        try:
            result = subprocess.run(["which", "hermes_sync"], capture_output=True, text=True)
            exists = result.returncode == 0
            self.status["hermes_sync"] = "OK" if exists else "MISSING"
            return exists
        except Exception:
            self.status["hermes_sync"] = "ERROR"
            return False

    def _check_backend(self):
        url = self.config.get("backend_url", self.backend_url)
        try:
            resp = requests.get(f"{url}/health", timeout=5)
            healthy = resp.status_code == 200
            self.status["integrity_backend"] = "OK" if healthy else f"FAILED ({resp.status_code})"
            return healthy
        except Exception as e:
            self.status["integrity_backend"] = f"OFFLINE ({str(e)})"
            return False

    def _check_bridge(self):
        try:
            result = subprocess.run(["ps", "aux"], capture_output=True, text=True)
            running = "hermes_integrity_bridge.py" in result.stdout
            self.status["integrity_bridge"] = "RUNNING" if running else "STOPPED"
            return running
        except Exception:
            self.status["integrity_bridge"] = "ERROR"
            return False

    def _check_web3(self):
        url = self.config.get("rpc_url", self.rpc_url)
        payload = {"jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1}
        try:
            resp = requests.post(url, json=payload, timeout=5)
            success = resp.status_code == 200 and "result" in resp.json()
            self.status["base_sepolia_rpc"] = "OK" if success else "RPC_ERROR"
            return success
        except Exception:
            self.status["base_sepolia_rpc"] = "OFFLINE"
            return False

    def _fix_bridge(self):
        logger.info("Attempting to fix Integrity Bridge...")
        try:
            env = os.environ.copy()
            if "AGENT_PRIVATE_KEY" not in env:
                env["AGENT_PRIVATE_KEY"] = "0x" + "a"*64
            
            env["PYTHONPATH"] = f"{env.get('PYTHONPATH', '')}:{SDK_DIR}"
            script_path = os.path.join(PROJECT_ROOT, "backend/scripts/hermes_integrity_bridge.py")
            
            if os.path.exists(script_path):
                # Check if uv is available
                use_uv = subprocess.run(["which", "uv"], capture_output=True).returncode == 0
                cmd = ["uv", "run", script_path] if use_uv else [sys.executable, script_path]
                
                subprocess.Popen(
                    cmd,
                    env=env,
                    stdout=open(os.path.expanduser("~/bridge.log"), "a"),
                    stderr=open(os.path.expanduser("~/bridge.log"), "a"),
                    start_new_session=True
                )
                time_mod.sleep(2)
                return self._check_bridge()
            else:
                logger.error(f"Bridge script not found at {script_path}")
                return False
        except Exception as e:
            logger.error(f"Failed to fix bridge: {e}")
            return False

    def _fix_manifest(self):
        if not self.manifest_path:
            return False
        logger.info("Updating manifest SDK path...")
        self.config["sdk_path"] = SDK_DIR
        try:
            with open(self.manifest_path, "w") as f:
                import yaml
                yaml.dump(self.config, f, default_flow_style=False)
            return True
        except ImportError:
            with open(self.manifest_path, "w") as f:
                json.dump(self.config, f, indent=4)
            return True
        except Exception as e:
            logger.error(f"Failed to fix manifest: {e}")
            return False

    def doctor(self, quiet=False, fix=False):
        if not quiet:
            logger.info("--- 🛡️ Initializing Integrity Protocol Doctor ---")
        
        manifest_found = self._find_manifest()
        self._check_hermes_sync()
        self._check_backend()
        self._check_bridge()
        self._check_web3()
        
        self.status["manifest_discovery"] = "FOUND" if manifest_found else "NOT_FOUND"
        
        if manifest_found:
            sdk_path = self.config.get("sdk_path")
            if sdk_path != SDK_DIR:
                self.status["manifest_discovery"] = f"OUTDATED_PATH ({sdk_path})"
            else:
                self.status["manifest_discovery"] = "VALID"

        if fix:
            if self.status["integrity_bridge"] == "STOPPED":
                if self._fix_bridge():
                    self.status["integrity_bridge"] = "RESTARTED"
            
            if "OUTDATED_PATH" in self.status["manifest_discovery"]:
                if self._fix_manifest():
                    self.status["manifest_discovery"] = "FIXED"

        if not quiet:
            print("\n" + "="*50)
            print(f"{'COMPONENT':<25} | {'STATUS':<20}")
            print("-" * 50)
            for comp, stat in self.status.items():
                icon = "✅" if any(x in stat for x in ["OK", "RUNNING", "FOUND", "VALID", "RESTARTED", "FIXED"]) else "❌"
                print(f"{comp:<25} | {icon} {stat}")
            print("="*50 + "\n")
            
            overall = all(any(x in v for x in ["OK", "RUNNING", "FOUND", "VALID", "RESTARTED", "FIXED"]) 
                         for k, v in self.status.items() if k != "manifest_discovery")
            if overall:
                logger.info("✨ SYSTEM INTEGRITY VERIFIED.")
            else:
                logger.warning("⚠️ SYSTEM DEGRADED.")
        
        return all(any(x in v for x in ["OK", "RUNNING", "FOUND", "VALID", "RESTARTED", "FIXED"]) for v in self.status.values())

    def init(self):
        manifest_path = os.path.join(os.getcwd(), ".integrity.yaml")
        if os.path.exists(manifest_path):
            logger.warning(f"Manifest already exists at {manifest_path}. Overwriting...")
        
        config = {
            "sdk_path": SDK_DIR,
            "oracle_address": "0x43867c4E0C06D6722883492576b533e46c7689B0",
            "rpc_url": DEFAULT_RPC_URL,
            "backend_url": DEFAULT_BACKEND_URL,
            "vault_id": "default"
        }
        
        try:
            import yaml
            with open(manifest_path, "w") as f:
                yaml.dump(config, f, default_flow_style=False)
            logger.info(f"✨ Manifest created at {manifest_path}")
        except ImportError:
            with open(manifest_path, "w") as f:
                json.dump(config, f, indent=4)
            logger.info(f"✨ Manifest created (JSON fallback) at {manifest_path}")
        
        print(f"\nTo use the SDK in this project, add this to your code:")
        print(f"import sys\nsys.path.append('{SDK_DIR}')\nimport integrity_sdk\n")

    def config_get(self, key):
        if not self._find_manifest():
            return
        val = self.config.get(key)
        if val:
            print(val)

def main():
    parser = argparse.ArgumentParser(description="Integrity Protocol CLI")
    subparsers = parser.add_subparsers(dest="command")

    # Doctor
    doctor_parser = subparsers.add_parser("doctor", help="Check protocol health")
    doctor_parser.add_argument("--quiet", action="store_true", help="Minimize output")
    doctor_parser.add_argument("--fix", action="store_true", help="Attempt to fix issues")

    # Init
    init_parser = subparsers.add_parser("init", help="Initialize project manifest")

    # Config
    config_parser = subparsers.add_parser("config", help="Manage manifest configuration")
    config_subparsers = config_parser.add_subparsers(dest="config_command")
    get_parser = config_subparsers.add_parser("get", help="Get a config value")
    get_parser.add_argument("key", help="The config key to retrieve")

    args = parser.parse_args()

    cli = IntegrityCLI()
    if args.command == "doctor":
        success = cli.doctor(quiet=args.quiet, fix=args.fix)
        sys.exit(0 if success else 1)
    elif args.command == "init":
        cli.init()
    elif args.command == "config":
        if args.config_command == "get":
            cli.config_get(args.key)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
