"""
Xibalba Integrity SDK — Framework Interceptors

Drop-in wrappers that automatically capture telemetry from popular
AI frameworks and report it to the Integrity Protocol.

Supported:
    • OpenAI (chat completions)
    • LangChain (chain runs)
"""
import time
import logging
from typing import Any, Optional, Dict, List, Callable

from .types import TelemetryEvent

logger = logging.getLogger("xibalba.integrity.interceptors")


class OpenAIInterceptor:
    """Transparent wrapper around an OpenAI client that logs inference telemetry.

    Usage::

        from openai import OpenAI
        from xibalba_integrity import IntegrityClient, IntegrityConfig, OpenAIInterceptor

        client = IntegrityClient(IntegrityConfig(agent_address="0x..."))
        openai_client = OpenAI()

        interceptor = OpenAIInterceptor(client)
        tracked_openai = interceptor.wrap(openai_client)

        # Use tracked_openai exactly like the normal client —
        # telemetry is captured automatically.
        response = tracked_openai.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": "Hello"}],
        )

    The interceptor captures:
        - Latency (ms)
        - Token counts (prompt + completion)
        - Model name
    """

    def __init__(self, integrity_client: "IntegrityClient"):
        self._client = integrity_client

    def wrap(self, openai_client: Any) -> Any:
        """Wrap an OpenAI client to automatically track inference calls.

        Returns a proxy object that behaves identically to the original
        client but captures telemetry on every chat completion.
        """
        return _OpenAIProxy(openai_client, self._client)


class _OpenAIProxy:
    """Transparent proxy for the OpenAI client."""

    def __init__(self, openai_client: Any, integrity_client: "IntegrityClient"):
        self._openai = openai_client
        self._integrity = integrity_client
        self.chat = _ChatProxy(openai_client.chat, integrity_client)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._openai, name)


class _ChatProxy:
    """Proxy for openai.chat namespace."""

    def __init__(self, chat: Any, integrity_client: "IntegrityClient"):
        self._chat = chat
        self._integrity = integrity_client
        self.completions = _CompletionsProxy(chat.completions, integrity_client)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._chat, name)


class _CompletionsProxy:
    """Proxy for openai.chat.completions that intercepts .create() calls."""

    def __init__(self, completions: Any, integrity_client: "IntegrityClient"):
        self._completions = completions
        self._integrity = integrity_client

    def create(self, **kwargs: Any) -> Any:
        """Intercept a chat completion call to capture telemetry."""
        model = kwargs.get("model", "unknown")
        start = time.perf_counter_ns()

        response = self._completions.create(**kwargs)

        elapsed_ms = (time.perf_counter_ns() - start) // 1_000_000

        # Extract token usage from the response
        tokens_in = 0
        tokens_out = 0
        if hasattr(response, "usage") and response.usage:
            tokens_in = getattr(response.usage, "prompt_tokens", 0)
            tokens_out = getattr(response.usage, "completion_tokens", 0)

        event = TelemetryEvent(
            event_type="inference",
            latency_ms=elapsed_ms,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            model=model,
            accuracy=1.0,  # Default — accuracy requires downstream evaluation
            metadata={"source": "openai_interceptor"},
        )

        self._integrity.track_event(event)
        logger.debug(
            "Captured OpenAI inference: model=%s latency=%dms tokens=%d/%d",
            model, elapsed_ms, tokens_in, tokens_out,
        )

        return response

    def __getattr__(self, name: str) -> Any:
        return getattr(self._completions, name)


class AnthropicInterceptor:
    """Transparent wrapper around an Anthropic client that logs inference telemetry.

    Usage::

        from anthropic import Anthropic
        from xibalba_integrity import IntegrityClient, IntegrityConfig, AnthropicInterceptor

        client = IntegrityClient(IntegrityConfig(agent_address="0x..."))
        anthropic_client = Anthropic()

        interceptor = AnthropicInterceptor(client)
        tracked_anthropic = interceptor.wrap(anthropic_client)

        # Use tracked_anthropic exactly like the normal client.
        response = tracked_anthropic.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=1024,
            messages=[{"role": "user", "content": "Hello"}]
        )
    """

    def __init__(self, integrity_client: "IntegrityClient"):
        self._client = integrity_client

    def wrap(self, anthropic_client: Any) -> Any:
        """Wrap an Anthropic client to automatically track message calls."""
        return _AnthropicProxy(anthropic_client, self._client)


class _AnthropicProxy:
    """Transparent proxy for the Anthropic client."""

    def __init__(self, anthropic_client: Any, integrity_client: "IntegrityClient"):
        self._anthropic = anthropic_client
        self._integrity = integrity_client
        self.messages = _AnthropicMessagesProxy(anthropic_client.messages, integrity_client)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._anthropic, name)


class _AnthropicMessagesProxy:
    """Proxy for anthropic.messages namespace."""

    def __init__(self, messages: Any, integrity_client: "IntegrityClient"):
        self._messages = messages
        self._integrity = integrity_client

    def create(self, **kwargs: Any) -> Any:
        """Intercept a message creation call to capture telemetry."""
        model = kwargs.get("model", "unknown")
        start = time.perf_counter_ns()

        response = self._messages.create(**kwargs)

        elapsed_ms = (time.perf_counter_ns() - start) // 1_000_000

        # Extract token usage from the Anthropic response
        tokens_in = 0
        tokens_out = 0
        if hasattr(response, "usage") and response.usage:
            tokens_in = getattr(response.usage, "input_tokens", 0)
            tokens_out = getattr(response.usage, "output_tokens", 0)

        event = TelemetryEvent(
            event_type="inference",
            latency_ms=elapsed_ms,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            model=model,
            accuracy=1.0,
            metadata={"source": "anthropic_interceptor"},
        )

        self._integrity.track_event(event)
        logger.debug(
            "Captured Anthropic inference: model=%s latency=%dms tokens=%d/%d",
            model, elapsed_ms, tokens_in, tokens_out,
        )

        return response

    def __getattr__(self, name: str) -> Any:
        return getattr(self._messages, name)


class LlamaIndexInterceptor:
    """Callback handler for LlamaIndex that captures query and retrieval telemetry.

    Usage::

        from llama_index.core import Settings
        from xibalba_integrity import IntegrityClient, IntegrityConfig, LlamaIndexInterceptor

        client = IntegrityClient(IntegrityConfig(agent_address="0x..."))
        callback = LlamaIndexInterceptor(client)

        Settings.callback_manager.add_handler(callback.handler())
    """

    def __init__(self, integrity_client: "IntegrityClient"):
        self._client = integrity_client

    def handler(self) -> Any:
        """Return a LlamaIndex-compatible callback handler."""
        try:
            from llama_index.core.callbacks import BaseCallbackHandler, CBEventType
        except ImportError:
            logger.warning("LlamaIndex not installed — interceptor disabled.")
            return None

        client = self._client

        class _Handler(BaseCallbackHandler):
            def __init__(self):
                super().__init__(event_starts_to_ignore=[], event_ends_to_ignore=[])
                self._start_times = {}

            def on_event_start(self, event_type: CBEventType, payload: Optional[Dict[str, Any]] = None, event_id: str = "", **kwargs: Any) -> Any:
                self._start_times[event_id] = time.perf_counter_ns()

            def on_event_end(self, event_type: CBEventType, payload: Optional[Dict[str, Any]] = None, event_id: str = "", **kwargs: Any) -> Any:
                start = self._start_times.pop(event_id, time.perf_counter_ns())
                elapsed_ms = (time.perf_counter_ns() - start) // 1_000_000

                event = TelemetryEvent(
                    event_type=f"llama_index_{event_type.value}",
                    latency_ms=elapsed_ms,
                    model="llama_index",
                    accuracy=1.0,
                    metadata={"source": "llama_index_interceptor", "event_id": event_id}
                )
                client.track_event(event)

            def start_trace(self, trace_id: Optional[str] = None) -> None: pass
            def end_trace(self, trace_id: Optional[str] = None, trace_map: Optional[Dict[str, List[str]]] = None) -> None: pass

        return _Handler()


class LangChainInterceptor:
    """Callback handler for LangChain that captures chain execution telemetry.

    Usage::

        from langchain.chains import LLMChain
        from xibalba_integrity import IntegrityClient, IntegrityConfig, LangChainInterceptor

        client = IntegrityClient(IntegrityConfig(agent_address="0x..."))
        callback = LangChainInterceptor(client)

        chain = LLMChain(llm=..., prompt=..., callbacks=[callback.handler()])
        chain.run("some input")

    Note:
        This requires ``langchain`` to be installed. The interceptor
        gracefully degrades if LangChain is not available.
    """

    def __init__(self, integrity_client: "IntegrityClient"):
        self._client = integrity_client

    def handler(self) -> Any:
        """Return a LangChain-compatible callback handler."""
        try:
            from langchain.callbacks.base import BaseCallbackHandler
        except ImportError:
            logger.warning("LangChain not installed — interceptor disabled.")
            return None

        client = self._client

        class _Handler(BaseCallbackHandler):
            def __init__(self):
                self._start_times = {}

            def on_llm_start(self, serialized: Any, prompts: Any, **kwargs: Any) -> None:
                run_id = kwargs.get("run_id", "default")
                self._start_times[str(run_id)] = time.perf_counter_ns()

            def on_llm_end(self, response: Any, **kwargs: Any) -> None:
                run_id = str(kwargs.get("run_id", "default"))
                start = self._start_times.pop(run_id, time.perf_counter_ns())
                elapsed_ms = (time.perf_counter_ns() - start) // 1_000_000

                tokens_out = 0
                if hasattr(response, "llm_output") and response.llm_output:
                    usage = response.llm_output.get("token_usage", {})
                    tokens_out = usage.get("completion_tokens", 0)

                event = TelemetryEvent(
                    event_type="inference",
                    latency_ms=elapsed_ms,
                    tokens_out=tokens_out,
                    model="langchain",
                    accuracy=1.0,
                    metadata={"source": "langchain_interceptor"},
                )
                client.track_event(event)

        return _Handler()


class OpenClawInterceptor:
    """Interceptor for the OpenClaw framework.
    
    Automatically tracks 'Claw' (tool/API) execution latency and success rates.
    """

    def __init__(self, integrity_client: "IntegrityClient"):
        self._client = integrity_client

    def track_claw(self, claw_name: str, duration_ms: int, success: bool = True):
        """Manually track a claw execution."""
        event = TelemetryEvent(
            event_type="claw_execution",
            latency_ms=duration_ms,
            model="openclaw",
            accuracy=1.0 if success else 0.0,
            metadata={"claw_name": claw_name, "source": "openclaw_interceptor"}
        )
        self._client.track_event(event)

    def middleware(self):
        """Returns a middleware hook for OpenClaw executors."""
        client = self._client

        async def _openclaw_hook(ctx: Any, next_call: Callable):
            start = time.perf_counter_ns()
            try:
                result = await next_call()
                duration = (time.perf_counter_ns() - start) // 1_000_000
                client.track_event(TelemetryEvent(
                    event_type="claw_execution",
                    latency_ms=duration,
                    model="openclaw",
                    accuracy=1.0,
                    metadata={"source": "openclaw_middleware"}
                ))
                return result
            except Exception as e:
                duration = (time.perf_counter_ns() - start) // 1_000_000
                client.track_event(TelemetryEvent(
                    event_type="claw_execution",
                    latency_ms=duration,
                    model="openclaw",
                    accuracy=0.0,
                    metadata={"error": str(e), "source": "openclaw_middleware"}
                ))
                raise e

        return _openclaw_hook
