# Xibalba Solutions: Integrity Protocol SDK
# https://xibalbasolutions.com
#
# The official Python SDK for integrating AI agents with the
# Integrity Protocol — a decentralized trust layer for the Agentic Web.

__version__ = "1.0.0"
__author__ = "Xibalba Solutions"

from .client import IntegrityClient
from .interceptors import (
    OpenAIInterceptor, 
    LangChainInterceptor, 
    AnthropicInterceptor,
    LlamaIndexInterceptor
)
from .provider_middleware import XibalbaProviderMiddleware
from .types import (
    DealResult,
    HandshakeResult,
    VerificationResult,
    AgentProfile,
    IntegrityConfig,
)

__all__ = [
    "IntegrityClient",
    "OpenAIInterceptor",
    "LangChainInterceptor",
    "AnthropicInterceptor",
    "LlamaIndexInterceptor",
    "XibalbaProviderMiddleware",
    "DealResult",
    "HandshakeResult",
    "VerificationResult",
    "AgentProfile",
    "IntegrityConfig",
]
