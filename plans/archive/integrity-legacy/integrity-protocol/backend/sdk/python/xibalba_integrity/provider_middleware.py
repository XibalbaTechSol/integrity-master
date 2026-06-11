"""
Xibalba Integrity SDK — Inference Provider Middleware (v1.0)

Specialized middleware for Inference Providers (vLLM, FastAPI, Flask)
to automatically report internal performance and GPU sacrifice metrics.
"""
import time
import logging
import uuid
import hashlib
from typing import Any, Callable, Dict, Optional

# Standard ASGI middleware approach for FastAPI/Starlette
try:
    from starlette.middleware.base import BaseHTTPMiddleware
    from starlette.requests import Request
    from starlette.responses import Response
except ImportError:
    BaseHTTPMiddleware = object # Graceful fallback if not installed

logger = logging.getLogger("xibalba.integrity.provider")

class XibalbaProviderMiddleware:
    """
    Middleware for Inference Providers to capture internal telemetry
    and inject the Integrity Seal into the response.

    Usage (FastAPI):
    ```python
    from fastapi import FastAPI
    from xibalba_integrity import XibalbaProviderMiddleware, IntegrityClient, IntegrityConfig
    
    app = FastAPI()
    client = IntegrityClient(IntegrityConfig(agent_address="0xProviderAddress"))
    
    # Add the middleware to capture all inference calls
    app.add_middleware(XibalbaProviderMiddleware, integrity_client=client)
    ```

    Features:
    - Automatically injects 'X-Xibalba-Seal' into the response headers.
    - Captures server-side latency (more accurate than client-side).
    - Bridges 'GPU-Hour Sacrifice' metrics from the inference engine.
    """

    def __init__(self, app: Any, integrity_client: "IntegrityClient", provider_alias: str = "XibalbaProvider"):
        self.app = app
        self.integrity_client = integrity_client
        self.provider_alias = provider_alias

    async def __call__(self, scope: Any, receive: Any, send: Any) -> Any:
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        start_time = time.perf_counter()
        deal_id = f"xib_deal_{uuid.uuid4().hex[:12]}"
        
        # We need to capture the response to inject headers
        async def send_wrapper(message: Dict[str, Any]) -> None:
            if message["type"] == "http.response.start":
                # 1. Calculate Server-Side Hash (Integrity Seal)
                # In a production env, this would be cryptographically signed by the provider.
                duration_ms = int((time.perf_counter() - start_time) * 1000)
                
                # Deterministic Seal generation
                seal_hash = hashlib.sha256(f"{deal_id}-{duration_ms}-{self.provider_alias}".encode()).hexdigest()
                
                # 2. Inject the Seal into Headers
                headers = list(message.get("headers", []))
                headers.append((b"x-xibalba-seal", seal_hash.encode()))
                headers.append((b"x-xibalba-deal-id", deal_id.encode()))
                message["headers"] = headers
                
                # 3. Report Telemetry to Xibalba (Async/Buffered)
                # This captures the true internal performance before the network latency.
                self.integrity_client.track_event({
                    "event_type": "provider_inference",
                    "latency_ms": duration_ms,
                    "model": "certified_provider_llm", # Dynamic extraction would go here
                    "metadata": {
                        "deal_id": deal_id,
                        "provider_alias": self.provider_alias,
                        "gpu_hours_sacrifice": 0.05 # Mock for the MVP
                    }
                })
                # Periodically flush in production or use a background task
                # self.integrity_client.flush_telemetry()
                
            await send(message)

        await self.app(scope, receive, send_wrapper)

# --- Legacy Support for Flask/Sync Frameworks ---

class FlaskProviderMiddleware:
    """Wrapper for Flask/WSGI style apps."""
    def __init__(self, app: Any, integrity_client: "IntegrityClient"):
        self.app = app
        self.integrity_client = integrity_client

    def wsgi_app(self, environ: Dict[str, Any], start_response: Callable) -> Any:
        start_time = time.time()
        
        def custom_start_response(status, headers, exc_info=None):
            duration_ms = int((time.time() - start_time) * 1000)
            headers.append(('X-Xibalba-Seal', hashlib.sha256(str(duration_ms).encode()).hexdigest()))
            return start_response(status, headers, exc_info)

        return self.app(environ, custom_start_response)
