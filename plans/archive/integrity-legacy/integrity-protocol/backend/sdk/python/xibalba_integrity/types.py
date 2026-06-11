"""
Xibalba Integrity SDK — Type Definitions
"""
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from enum import Enum


class RiskTier(Enum):
    """Insurance risk classification derived from AIS."""
    AAA = "AAA"  # 800+ AIS — Lowest risk
    AA  = "AA"   # 700-799
    BBB = "BBB"  # 600-699
    CCC = "CCC"  # 400-599
    D   = "D"    # Below 400 — Uninsurable


@dataclass
class IntegrityConfig:
    """Configuration for the Integrity SDK client.

    Args:
        api_url: URL of the Xibalba Solutions backend.
        agent_address: Ethereum address of the agent using this SDK.
        api_key: API key issued by Xibalba Solutions (optional for dev mode).
        rpc_url: Ethereum JSON-RPC provider URL (for on-chain reads).
        private_key: Agent wallet private key (for on-chain writes). Never logged.
        protocol_address: Deployed IntegrityProtocol.sol contract address.
        token_address: Deployed IntegrityToken.sol (ITK) contract address.
        auto_anchor: If True, automatically anchor hashes on-chain after reporting.
        strict_provenance: If True, all payloads MUST be signed by private_key.
        timeout: HTTP request timeout in seconds.
    """
    api_url: str = "http://localhost:8001"
    agent_address: str = ""
    api_key: str = ""
    rpc_url: str = "http://127.0.0.1:8545"
    private_key: str = ""
    protocol_address: str = ""
    token_address: str = ""
    auto_anchor: bool = False
    strict_provenance: bool = False
    timeout: int = 30


@dataclass
class DealResult:
    """Result from initiating or completing a deal."""
    deal_id: str = ""
    integrity_hash: str = ""
    entropy_score: int = 0
    grounding_score: int = 0
    integrity_score: int = 0
    status: str = ""
    tx_hash: Optional[str] = None
    raw: Dict[str, Any] = field(default_factory=dict)


@dataclass
class HandshakeResult:
    """Result from a pre-transaction trust handshake."""
    target_address: str = ""
    ais: int = 0
    entropy_score: int = 0
    grounding_score: int = 0
    trust_decision: str = ""  # TRUSTED / CAUTION / REJECTED
    handshake_hash: str = ""
    risk_tier: RiskTier = RiskTier.D
    raw: Dict[str, Any] = field(default_factory=dict)


@dataclass
class VerificationResult:
    """Result from verifying a deal hash against the blockchain."""
    verified: bool = False
    deal_id: str = ""
    integrity_score: int = 0
    agent: str = ""
    performer: str = ""
    reason: str = ""
    raw: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentProfile:
    """On-chain agent profile from ReputationRegistry."""
    address: str = ""
    ais: int = 300
    total_staked: int = 0
    is_verified: bool = False
    job_count: int = 0
    last_update: int = 0


@dataclass
class TelemetryEvent:
    """A single telemetry data point captured by an interceptor."""
    event_type: str = ""       # "inference" | "tool_call" | "handshake"
    latency_ms: int = 0
    tokens_in: int = 0
    tokens_out: int = 0
    model: str = ""
    accuracy: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)
    tee_attestation: Optional[str] = None
    previous_response: Optional[str] = None
    expected_tokens: Optional[int] = None
    expected_latency_ms: Optional[int] = None

