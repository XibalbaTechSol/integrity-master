"""
openclaw_hook.py — Integrity Protocol Integration for OpenClaw

Provides middleware hooks for the OpenClaw agent runtime.
"""

from typing import Dict, Any

def get_integrity_middleware(integrity_client):
    """
    Returns an OpenClaw-compatible middleware function that logs
    telemetry to the Integrity Protocol.
    
    Usage:
        client = IntegrityClient(agent_id="openclaw-agent")
        openclaw_runtime.add_middleware(get_integrity_middleware(client))
    """
    
    def integrity_middleware(request: Dict[str, Any], response: Dict[str, Any], next_middleware) -> Dict[str, Any]:
        """Intercepts the response and extracts data before passing control."""
        import time
        start_time = time.time()
        
        # Pass control to next in chain (or actual execution)
        final_response = next_middleware(request, response)
        
        latency_ms = (time.time() - start_time) * 1000
        
        # Log telemetry async without blocking the response
        try:
            integrity_client.log_inference(
                provider="openclaw",
                raw_data=final_response,
                latency_ms=latency_ms,
                extra_metadata={
                    "framework": "openclaw",
                    "action": request.get("action_type", "unknown")
                }
            )
        except Exception as e:
            print(f"[OpenClaw Integrity Middleware] Failed to log telemetry: {e}")
            
        return final_response

    return integrity_middleware
