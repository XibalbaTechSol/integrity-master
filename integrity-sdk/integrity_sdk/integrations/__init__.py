"""
Integrity Protocol Framework Integrations

Provides native plugins and wrappers for popular agent frameworks
to seamlessly onboard them into the Integrity Protocol ecosystem.
"""

from .langchain_callback import IntegrityLangChainCallback
from .hermes_plugin import IntegrityHermesPlugin
from .openclaw_hook import get_integrity_middleware
from .openai_integrity import IntegrityOpenAI

__all__ = [
    "IntegrityLangChainCallback",
    "IntegrityHermesPlugin",
    "get_integrity_middleware",
    "IntegrityOpenAI"
]
