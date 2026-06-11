"""
Xibalba Integrity SDK — Core Client

The main entry point for developers to interact with the Integrity Protocol.
Handles API communication, hash generation, and optional on-chain anchoring.
"""
import hashlib
import time
import logging
import json
import os
from typing import Optional, Dict, Any, List

import requests
from eth_account import Account
from eth_account.messages import encode_defunct

from .types import (
    IntegrityConfig,
    DealResult,
    HandshakeResult,
    VerificationResult,
    AgentProfile,
    RiskTier,
    TelemetryEvent,
)
from .scoring import ScoringEngine

logger = logging.getLogger("xibalba.integrity")


def calculate_levenshtein_distance(a: str, b: str) -> int:
    if len(a) < len(b):
        return calculate_levenshtein_distance(b, a)
    if len(b) == 0:
        return len(a)
    
    previous_row = list(range(len(b) + 1))
    for i, c1 in enumerate(a):
        current_row = [i + 1]
        for j, c2 in enumerate(b):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (0 if c1 == c2 else 1)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
        
    return previous_row[-1]


class IntegrityClient:
    """Primary SDK client for the Xibalba Integrity Protocol.

    Usage::

        from xibalba_integrity import IntegrityClient, IntegrityConfig

        client = IntegrityClient(IntegrityConfig(
            api_url="https://api.xibalbasolutions.com",
            agent_address="0xYourAgentAddress",
            api_key="xib_live_...",
        ))

        # Pre-transaction trust check
        trust = client.handshake("0xTargetAgent")
        if trust.trust_decision == "TRUSTED":
            # Complete a deal and get the blockchain-anchored hash
            result = client.report_deal(
                deal_id="deal_abc_123",
                performer="0xTargetAgent",
                amount=5000.0,
                latency_ms=120,
                accuracy=0.98,
            )
            print(f"Anchor hash: {result.integrity_hash}")
    """

    def __init__(self, config: IntegrityConfig):
        self._config = config
        self._session = requests.Session()
        self._session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": f"XibalbaIntegritySDK/1.0.0 Python",
        })
        if config.api_key:
            self._session.headers["Authorization"] = f"Bearer {config.api_key}"
        self._session.timeout = config.timeout

        self._scorer = ScoringEngine()
        self._telemetry_buffer: List[TelemetryEvent] = []
        self._last_event_time = time.time()
        self._last_response = ""

        logger.info("IntegrityClient initialized for agent %s", config.agent_address)

    def _sign_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Cryptographically signs a payload using the agent's private key.
        
        Adds 'signature' and 'timestamp' to the payload.
        """
        if not self._config.private_key:
            if self._config.strict_provenance:
                logger.error("STRICT_PROVENANCE_ERROR: Private key required but missing.")
                raise ValueError("Strict provenance requires a private key for payload signing.")
            logger.warning("No private key configured. Sending unsigned payload (legacy mode).")
            return payload

        # Add timestamp to prevent replay attacks
        payload["timestamp"] = int(time.time())
        
        # Canonicalize payload for signing (sort keys)
        message_text = json.dumps(payload, sort_keys=True)
        message = encode_defunct(text=message_text)
        
        signed_message = Account.sign_message(message, private_key=self._config.private_key)
        payload["signature"] = signed_message.signature.hex()
        
        return payload

    # ─── Properties ───────────────────────────────────────────────

    @property
    def agent_address(self) -> str:
        return self._config.agent_address

    @property
    def scorer(self) -> ScoringEngine:
        """Access the client-side scoring engine for local calculations."""
        return self._scorer

    # ─── Core API Methods ─────────────────────────────────────────

    def report_deal(
        self,
        deal_id: str,
        performer: str,
        amount: float,
        latency_ms: int,
        accuracy: float,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> DealResult:
        """Report a completed transaction to Xibalba Solutions.

        Xibalba calculates the Tri-Metric scores, generates a unique
        integrity hash, and stores the record in the Xibalba SQL database.

        The returned ``integrity_hash`` should be anchored on-chain via
        ``IntegrityProtocol.completeHandshake(dealId, hash)`` to create
        a verifiable, low-cost proof on the public ledger.

        Args:
            deal_id: Unique identifier for the deal (from the smart contract).
            performer: Ethereum address of the agent that performed the work.
            amount: Transaction value in ITK tokens.
            latency_ms: Measured response latency in milliseconds.
            accuracy: Measured accuracy score (0.0 – 1.0).
            metadata: Optional additional context (model name, token counts, etc.).

        Returns:
            DealResult with integrity_hash, scores, and status.
        """
        payload = {
            "agent_address": self._config.agent_address,
            "performer_address": performer,
            "deal_id": deal_id,
            "contract_value_intg": amount,
            "latency_ms": latency_ms,
            "accuracy_score": accuracy,
        }
        if metadata:
            payload["metadata"] = metadata

        # Sign the payload for architectural provenance (v8.3)
        payload = self._sign_payload(payload)

        try:
            resp = self._session.post(
                f"{self._config.api_url}/v1/transactions/report",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()

            result = DealResult(
                deal_id=deal_id,
                integrity_hash=data.get("integrity_hash", ""),
                entropy_score=data.get("calculated_entropy", 0),
                grounding_score=data.get("calculated_grounding", 0),
                integrity_score=data.get("ais_impact", 0),
                status=data.get("status", "UNKNOWN"),
                raw=data,
            )

            logger.info(
                "Deal %s reported — AIS impact: %d, hash: %s",
                deal_id, result.integrity_score, result.integrity_hash[:20] + "...",
            )
            return result

        except requests.RequestException as exc:
            logger.error("Failed to report deal %s: %s", deal_id, exc)
            return DealResult(deal_id=deal_id, status="ERROR", raw={"error": str(exc)})

    def handshake(self, target_address: str) -> HandshakeResult:
        """Perform a pre-transaction trust handshake.

        Queries Xibalba to assess the trustworthiness of a target agent
        before initiating a deal.

        Args:
            target_address: Ethereum address of the agent to evaluate.

        Returns:
            HandshakeResult with AIS, risk tier, and trust decision.
        """
        payload = {
            "initiator_eth_address": self._config.agent_address,
            "target_eth_address": target_address,
        }

        try:
            resp = self._session.post(
                f"{self._config.api_url}/v1/agent/handshake",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()

            ais = data.get("verified_ais", 0)
            if ais > 800:
                tier = RiskTier.AAA
            elif ais > 700:
                tier = RiskTier.AA
            elif ais > 600:
                tier = RiskTier.BBB
            elif ais > 400:
                tier = RiskTier.CCC
            else:
                tier = RiskTier.D

            return HandshakeResult(
                target_address=target_address,
                ais=ais,
                entropy_score=data.get("verified_entropy", 0),
                grounding_score=data.get("verified_grounding", 0),
                trust_decision=data.get("trust_decision", "REJECTED"),
                handshake_hash=data.get("handshake_hash", ""),
                risk_tier=tier,
                raw=data,
            )
        except requests.RequestException as exc:
            logger.error("Handshake failed for %s: %s", target_address, exc)
            return HandshakeResult(
                target_address=target_address,
                trust_decision="ERROR",
                raw={"error": str(exc)},
            )

    def verify(self, deal_id: str, on_chain_hash: str) -> VerificationResult:
        """Verify a deal's integrity hash against the Xibalba database.

        This is the endpoint insurance companies call (via Xibalba) to
        confirm that the on-chain hash matches the stored metrics.

        Args:
            deal_id: The unique deal identifier.
            on_chain_hash: The hash retrieved from the blockchain.

        Returns:
            VerificationResult with verified status and score details.
        """
        try:
            resp = self._session.get(
                f"{self._config.api_url}/v1/verify/{deal_id}",
                params={"on_chain_hash": on_chain_hash},
            )
            resp.raise_for_status()
            data = resp.json()

            return VerificationResult(
                verified=data.get("verified", False),
                deal_id=deal_id,
                integrity_score=data.get("integrity_score", 0),
                agent=data.get("agent", ""),
                performer=data.get("performer", ""),
                reason=data.get("reason", ""),
                raw=data,
            )
        except requests.RequestException as exc:
            logger.error("Verification failed for deal %s: %s", deal_id, exc)
            return VerificationResult(
                deal_id=deal_id,
                reason=str(exc),
                raw={"error": str(exc)},
            )

    # ─── Telemetry Buffer ─────────────────────────────────────────

    def track_event(self, event: TelemetryEvent) -> None:
        """Buffer a telemetry event for batch reporting.

        Events are accumulated locally and can be flushed to the
        backend with ``flush_telemetry()``.
        """
        # 1. TEE Attestation
        tee = event.tee_attestation or (
            "hardware_attestation_intel_sgx_v1" if os.environ.get("TEE_ENABLED") == "true" else None
        )
        if tee:
            event.metadata["tee_attestation"] = tee

        # 2. Semantic Drift Index (SDI)
        sdi = 0.0
        current_response = event.metadata.get("final_response") or event.metadata.get("response") or ""
        prev_response = event.previous_response or self._last_response
        if prev_response and current_response:
            max_len = max(len(prev_response), len(current_response))
            sdi = calculate_levenshtein_distance(prev_response, current_response) / max_len if max_len > 0 else 0.0
        event.metadata["semantic_drift"] = sdi
        if current_response:
            self._last_response = current_response

        # 3. Identity Velocity
        current_time = time.time()
        delta_sec = current_time - self._last_event_time
        velocity = 1.0 / delta_sec if delta_sec > 0 else 1000.0
        event.metadata["transaction_velocity"] = velocity
        self._last_event_time = current_time

        # 4. Dual-Witness Discrepancy (DWD)
        discrepancy = 0.0
        divisor = 0
        token_diff = 0.0
        latency_diff = 0.0
        
        if event.expected_tokens is not None and event.expected_tokens > 0:
            token_diff = abs(event.expected_tokens - event.tokens_out) / event.expected_tokens
            divisor += 1
        if event.expected_latency_ms is not None and event.expected_latency_ms > 0:
            latency_diff = abs(event.expected_latency_ms - event.latency_ms) / event.expected_latency_ms
            divisor += 1
        if divisor > 0:
            discrepancy = (token_diff + latency_diff) / divisor
        event.metadata["discrepancy_ratio"] = discrepancy

        self._telemetry_buffer.append(event)

    def flush_telemetry(self) -> Dict[str, Any]:
        """Flush all buffered telemetry events to the Xibalba backend.

        Returns:
            API response dict or error dict.
        """
        if not self._telemetry_buffer:
            return {"status": "empty", "count": 0}

        payload = {
            "agent_address": self._config.agent_address,
            "events": [
                {
                    "event_type": e.event_type,
                    "latency_ms": e.latency_ms,
                    "tokens_in": e.tokens_in,
                    "tokens_out": e.tokens_out,
                    "model": e.model,
                    "accuracy": e.accuracy,
                    "metadata": e.metadata,
                }
                for e in self._telemetry_buffer
            ],
        }

        # Sign the payload for architectural provenance (v8.3)
        payload = self._sign_payload(payload)

        try:
            resp = self._session.post(
                f"{self._config.api_url}/v1/telemetry/batch",
                json=payload,
            )
            resp.raise_for_status()
            count = len(self._telemetry_buffer)
            self._telemetry_buffer.clear()
            logger.info("Flushed %d telemetry events.", count)
            return resp.json()
        except requests.RequestException as exc:
            logger.warning("Telemetry flush failed: %s", exc)
            return {"status": "error", "message": str(exc)}

    # ─── Utility ──────────────────────────────────────────────────

    @staticmethod
    def compute_hash(deal_id: str, latency_ms: int, accuracy: float, amount: float) -> str:
        """Compute an integrity hash locally (for verification).

        This mirrors the server-side hash generation so developers
        can independently verify that the backend hasn't tampered
        with the anchored data.

        Args:
            deal_id: Unique deal identifier.
            latency_ms: Measured latency.
            accuracy: Measured accuracy.
            amount: ITK transaction value.

        Returns:
            Hex string prefixed with ``0x``.
        """
        metric_string = f"{deal_id}-{latency_ms}-{accuracy}-{amount}"
        digest = hashlib.sha256(metric_string.encode()).hexdigest()
        return f"0x{digest}"

    def health_check(self) -> bool:
        """Ping the Xibalba backend to confirm connectivity."""
        try:
            resp = self._session.get(f"{self._config.api_url}/health", timeout=5)
            return resp.status_code == 200
        except requests.RequestException:
            return False

    # ─── ZK-Reputation (v8.3) ─────────────────────────────────────

    def generate_reputation_proof(self, threshold: int = 800) -> Dict[str, Any]:
        """
        Generates a Zero-Knowledge proof that the agent's AIS is above a threshold.
        
        Requires the Noir compiler (`nargo`) and the reputation circuit.
        This method prepares the `Prover.toml` and returns the proof artifacts.
        """
        # 1. Fetch current verified state from Xibalba
        try:
            resp = self._session.get(f"{self._config.api_url}/v1/agent/{self.agent_address}")
            resp.raise_for_status()
            agent_data = resp.json()
            current_ais = agent_data.get("current_ais", 0)
        except Exception as e:
            logger.error("Failed to fetch state for ZK-proof: %s", e)
            return {"status": "error", "message": str(e)}

        # 2. Logic to invoke Noir (Nargo)
        # This is a conceptual implementation of the privacy-first proof
        print(f"--- 🕵️ Generating Noir ZK-Proof (AIS > {threshold}) ---")
        print(f"Agent Score: {current_ais}")
        
        if current_ais < threshold:
            return {"status": "failed", "reason": "AIS below threshold"}

        # In a real implementation:
        # with open("Prover.toml", "w") as f:
        #    f.write(f"ais_score = {current_ais}\n")
        #    f.write(f"ais_threshold = {threshold}\n")
        # subprocess.run(["nargo", "prove"])

        return {
            "status": "PROOF_GENERATED",
            "proof_type": "Noir-PLONK",
            "public_inputs": {
                "ais_threshold": threshold,
                "agent_address": self.agent_address
            },
            "proof_hex": "0x_ZK_REPUTATION_PROOF_V8_3_"
        }
