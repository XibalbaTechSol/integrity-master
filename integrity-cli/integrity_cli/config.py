import json
import os
from pathlib import Path
from typing import Any, Dict, Optional

CONFIG_DIR = Path.home() / ".integrity-cli"
CONFIG_FILE = CONFIG_DIR / "config.json"

DEFAULT_CONFIG = {
    "ORACLE_URL": "http://localhost:8000",
    "AUTH_TOKEN": "mock_demo_token"
}

def load_config() -> Dict[str, Any]:
    """Load configuration from the config file or return defaults."""
    if not CONFIG_FILE.exists():
        return DEFAULT_CONFIG
    
    try:
        with open(CONFIG_FILE, "r") as f:
            config = json.load(f)
            # Ensure all default keys exist
            for key, val in DEFAULT_CONFIG.items():
                if key not in config:
                    config[key] = val
            return config
    except (json.JSONDecodeError, OSError):
        return DEFAULT_CONFIG

def save_config(config: Dict[str, Any]):
    """Save configuration to the config file."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=4)

def get_config_value(key: str) -> Optional[Any]:
    """Get a specific configuration value."""
    config = load_config()
    return config.get(key)

def set_config_value(key: str, value: Any):
    """Set a specific configuration value."""
    config = load_config()
    config[key] = value
    save_config(config)
