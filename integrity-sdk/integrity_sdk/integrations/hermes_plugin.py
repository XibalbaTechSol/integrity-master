"""
hermes_plugin.py — Integrity Protocol Integration for Hermes Framework

Integrates into the Hermes agent loop via hooks.
Automatically logs telemetry payloads to the Integrity Oracle.
"""

from typing import Dict, Any

class IntegrityHermesPlugin:
    """
    Plugin for Hermes framework agents.
    
    Usage:
        client = IntegrityClient(agent_id="hermes-node")
        agent.register_plugin(IntegrityHermesPlugin(client))
    """
    
    def __init__(self, integrity_client):
        self.client = integrity_client
        self.name = "IntegrityProtocolLogger"

    def pre_inference(self, context: Dict[str, Any]) -> None:
        """Called by Hermes before the LLM inference step."""
        context["_integrity_start_time"] = __import__("time").time()

    def post_inference(self, context: Dict[str, Any], response: Dict[str, Any]) -> None:
        """Called by Hermes after the LLM inference step."""
        start_time = context.get("_integrity_start_time")
        latency_ms = None
        if start_time:
            latency_ms = (__import__("time").time() - start_time) * 1000

        self.client.log_inference(
            provider="hermes-native",
            raw_data=response,
            latency_ms=latency_ms,
            extra_metadata={
                "framework": "hermes",
                "task_id": context.get("task_id", "unknown")
            }
        )

    def on_error(self, error: Exception, context: Dict[str, Any]) -> None:
        """Called on execution errors."""
        self.client.log_telemetry(
            metadata={
                "framework": "hermes",
                "status": "error",
                "error_details": str(error),
                "task_id": context.get("task_id", "unknown")
            }
        )
