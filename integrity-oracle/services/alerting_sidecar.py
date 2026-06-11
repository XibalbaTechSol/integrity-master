import os
import requests
import time
from typing import Dict, Any

class AlertingSidecar:
    """
    Monitors incoming signals in the Oracle and triggers webhooks on risk threshold breaches.
    """
    def __init__(self, webhook_url: str, thresholds: Dict[str, float]):
        self.webhook_url = webhook_url
        self.thresholds = thresholds

    def check_signals(self, agent_id: str, signals: Dict[str, float]):
        for sig_name, value in signals.items():
            if sig_name in self.thresholds and value >= self.thresholds[sig_name]:
                self._trigger_alert(agent_id, sig_name, value)

    def _trigger_alert(self, agent_id: str, sig_name: str, value: float):
        payload = {
            "text": f"🚨 [Integrity Alert] Agent {agent_id} triggered {sig_name}: {value:.4f}"
        }
        try:
            requests.post(self.webhook_url, json=payload, timeout=5.0)
            print(f"[AlertingSidecar] Alert sent for agent {agent_id}")
        except Exception as e:
            print(f"[AlertingSidecar] Alert dispatch failed: {e}")
