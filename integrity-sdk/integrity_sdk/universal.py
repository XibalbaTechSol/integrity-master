from typing import Any, Optional
from .client import IntegrityClient

class Integrity:
    """
    The Universal Facade for the Integrity Protocol SDK.
    Provides a single entry point for wrapping any agent, LLM client, or framework.
    """
    
    _default_client: Optional[IntegrityClient] = None

    @classmethod
    def init(cls, **kwargs) -> IntegrityClient:
        """Initializes the global Integrity client."""
        cls._default_client = IntegrityClient(**kwargs)
        return cls._default_client

    @classmethod
    def get_client(cls) -> IntegrityClient:
        """Returns the global client, initializing if necessary."""
        if cls._default_client is None:
            cls.init()
        return cls._default_client

    @classmethod
    def wrap(cls, obj: Any, **kwargs) -> Any:
        """
        Universally wrap any object (OpenAI, LangChain, Hermes, etc.) 
        to add Integrity Protocol capabilities.
        """
        # 1. Detect OpenAI
        try:
            from openai import OpenAI, AsyncOpenAI
            if isinstance(obj, (OpenAI, AsyncOpenAI)):
                from .integrations.openai_integrity import IntegrityOpenAI
                return IntegrityOpenAI(obj, **kwargs)
        except ImportError:
            pass

        # 2. Detect LangChain
        try:
            from langchain.base_language import BaseLanguageModel
            if isinstance(obj, BaseLanguageModel):
                from .integrations.langchain_callback import IntegrityCallbackHandler
                # For LangChain, we often add callbacks rather than wrapping the object
                # but we can return an object that manages it.
                pass
        except ImportError:
            pass

        # 3. Detect Hermes/Custom Agent (like the one in antigravity-harness)
        if hasattr(obj, 'register_plugin'):
            from .integrations.hermes_plugin import IntegrityHermesPlugin
            sub_client = cls.get_client().spawn_subagent(subagent_id=getattr(obj, 'name', 'generic_agent'))
            plugin = IntegrityHermesPlugin(sub_client)
            obj.register_plugin(plugin)
            return obj

        return obj

    @classmethod
    def log(cls, metadata: dict, **kwargs):
        """Quickly log telemetry to the global client."""
        cls.get_client().log_telemetry(metadata, **kwargs)

    @classmethod
    def register(cls, **kwargs) -> dict:
        """Register the current agent with the protocol."""
        return cls.get_client().register_agent(**kwargs)

    @classmethod
    def handshake(cls, **kwargs) -> dict:
        """Perform a trust handshake between agents."""
        return cls.get_client().handshake(**kwargs)
