import json
import requests
import threading
import time
import os
import uuid
import hashlib
from typing import Optional, Any, Dict, Callable, List
from dataclasses import dataclass, asdict

from .batcher import TelemetryBatcher
from .prover import NoirProver
from .telemetry.analyzer import CompositeSignalAnalyzer


@dataclass
class BCCCommitment:
    id: str  # UUID
    timestamp: float
    agent_id: str
    action_type: str
    intended_state_hash: str
    opa_policy_id: str
    opa_evaluation_result: Dict[str, Any]
    provenance_signature: Optional[str] = None
    ttl: float = 60.0 # Default 60 seconds TTL

class IntegrityClient:
    """
    Main entry point for Edge Agents to interact with the Integrity Protocol.
    Manages background batching, DID-based signing, and async submission
    to the Axum Oracle.
    """
    def __init__(
        self,
        agent_id: Optional[str] = None,
        oracle_url: str = "http://localhost:3001/ingest",
        batch_size_limit: int = 50,
        flush_interval_sec: float = 5.0,
        did: Optional[str] = None,
        subagent_id: Optional[str] = None,
        enable_full_recording: bool = False,
        extra_metadata: Optional[dict] = None,
        hipaa_eligible: bool = False,
        zdr_enabled: bool = False,
        external_web_access: bool = True,
        region: Optional[str] = None,
        ekm_provider: Optional[str] = None,
        api_domain_prefix: Optional[str] = None,
        bcc_middleware_url: Optional[str] = None,
        framework_url: Optional[str] = None,
        framework_url: Optional[str] = None,
        domain_id: str = "global",
        mode: str = "production",
        api_key: Optional[str] = None,
    ):
        self.mode = mode
        self.api_key = api_key
        self.extra_metadata = extra_metadata or {}
        self.hipaa_eligible = hipaa_eligible
        self.zdr_enabled = zdr_enabled
        self.external_web_access = external_web_access
        self.region = region
        self.ekm_provider = ekm_provider
        self.api_domain_prefix = api_domain_prefix
        self.bcc_middleware_url = bcc_middleware_url or os.getenv("INTEGRITY_BCC_URL")
        self.framework_url = framework_url or os.getenv("INTEGRITY_FRAMEWORK_URL", "http://localhost:3002")
        self.domain_id = domain_id or os.getenv("INTEGRITY_DOMAIN_ID", "global")

        # 0. Initialize OpenTelemetry High-Fidelity Transport
        from .telemetry.core import init_telemetry
        from .telemetry.host import HostTelemetrySampler
        
        otlp_endpoint = os.getenv("INTEGRITY_OTLP_ENDPOINT", "localhost:4317")
        self.agent_id = agent_id or os.getenv("INTEGRITY_AGENT_ID")
        
        # Resolve agent_id fallback logic...
        if not self.agent_id:
            try:
                import sys
                main_file = sys.argv[0]
                if main_file:
                    base_name = os.path.basename(main_file)
                    name_without_ext = os.path.splitext(base_name)[0]
                    # Filter out interactive/wrapper commands
                    if name_without_ext and name_without_ext not in ("-c", "ipython", "poetry", "uv", "pip", "setup"):
                        self.agent_id = name_without_ext
            except Exception:
                pass

        if not self.agent_id:
            try:
                cwd_name = os.path.basename(os.getcwd())
                if cwd_name:
                    self.agent_id = cwd_name
            except Exception:
                pass

        if not self.agent_id:
            try:
                import getpass
                self.agent_id = f"agent_{getpass.getuser()}"
            except Exception:
                self.agent_id = "default_agent"

        # Formally initialize OTel providers
        init_telemetry(agent_id=self.agent_id, endpoint=otlp_endpoint)
        
        # Start macroscopic host telemetry sampler
        self.host_sampler = HostTelemetrySampler(interval_sec=15.0)
        self.host_sampler.start()
        
        self.analyzer = CompositeSignalAnalyzer()
        self._active_goals = {}
        self._goal_stats = {"total_goals": 0, "successful_goals": 0, "failed_goals": 0}

        self.subagent_id = subagent_id
        self.enable_full_recording = enable_full_recording
        self.oracle_url = oracle_url
        self.batcher = TelemetryBatcher(
            batch_size_limit=batch_size_limit,
            flush_interval_sec=flush_interval_sec,
        )
        self.prover = NoirProver(agent_id=self.agent_id)
        
        # World Data Oracle Integration
        from .integrations.world_data_fetcher import WorldDataFetcher
        self.oracle_fetcher = WorldDataFetcher(self)

        # ---- DID / hardware binding ----------------------------------
        self._did: Optional[str] = did
        self._keypair = None
        self._hardware_fingerprint: Optional[str] = None
        self._evm_address: Optional[str] = None
        self._owner_address: Optional[str] = None

        try:
            from .did import load_or_create_did, get_hardware_fingerprint, derive_evm_address

            if self._did is None:
                self._did, self._keypair = load_or_create_did(self.agent_id)
            else:
                _, self._keypair = load_or_create_did(self.agent_id)

            self._hardware_fingerprint = get_hardware_fingerprint()

            # Derive a secure HMAC secret from DID keypair to lock local SQLite database against offline tampering
            if self._keypair is not None:
                if hasattr(self._keypair, "private_bytes_raw"):
                    self._hmac_secret = self._keypair.private_bytes_raw()
                else:
                    try:
                        from cryptography.hazmat.primitives import serialization
                        self._hmac_secret = self._keypair.private_bytes(
                            encoding=serialization.Encoding.Raw,
                            format=serialization.PrivateFormat.Raw,
                            encryption_algorithm=serialization.NoEncryption()
                        )
                    except Exception:
                        self._hmac_secret = b"integrity_protocol_sqlite_cache_shared_secret"

                # Derive deterministic EVM (Secp256k1) address from the master seed
                try:
                    seed_bytes = self._hmac_secret  # same 32-byte seed
                    self._evm_address = derive_evm_address(seed_bytes)
                    print(f"[IntegrityClient] Derived EVM address: {self._evm_address}")
                except Exception as evm_exc:
                    print(f"[IntegrityClient] EVM address derivation skipped: {evm_exc}")
            else:
                self._hmac_secret = b"integrity_protocol_sqlite_cache_shared_secret"
        except Exception as exc:
            # DID subsystem is best-effort; agent must not crash if
            # hardware reads or key generation fail.
            self._hmac_secret = b"integrity_protocol_sqlite_cache_shared_secret"
            print(f"[IntegrityClient] DID init skipped: {exc}")

        self.last_model = None
        self.last_provider = None
        self._lock = threading.Lock()

        self._running = True
        self._init_sqlite_cache()
        self._worker_thread = threading.Thread(
            target=self._background_worker, daemon=True
        )
        self._worker_thread.start()

    # ------------------------------------------------------------------
    # Public API - Identity & Registry
    # ------------------------------------------------------------------

    def _get_headers(self) -> dict:
        headers = {}
        if self.mode == "test" and self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def register_agent(
        self,
        eth_address: str,
        alias: str,
        xns_handle: Optional[str] = None,
        description: str = "Registered via Python SDK",
        tee_type: str = "NONE",
        tee_measurement: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Registers a new agent with the Integrity Protocol.
        """
        base_url = self._get_base_url()
        reg_url = f"{base_url}/v1/agent/register"
        if self.mode == "test":
            tee_type = "DEV_API_KEY"
            
        payload = {
            "eth_address": eth_address,
            "alias": alias,
            "xns_handle": xns_handle,
            "description": description,
            "tee_type": tee_type,
            "tee_measurement": tee_measurement
        }
        
        response = requests.post(reg_url, json=payload, headers=self._get_headers(), timeout=10.0)
        response.raise_for_status()
        return response.json()

    def handshake(
        self,
        initiator_eth_address: str,
        target_eth_address: str
    ) -> Dict[str, Any]:
        """
        Evaluates trust between two agents before executing a deal.
        """
        base_url = self._get_base_url()
        handshake_url = f"{base_url}/v1/agent/handshake"
        payload = {
            "initiator_eth_address": initiator_eth_address,
            "target_eth_address": target_eth_address,
        }
        
        response = requests.post(handshake_url, json=payload, headers=self._get_headers(), timeout=10.0)
        response.raise_for_status()
        res = response.json()
        if "trust_decision" in res and "decision" not in res:
            res["decision"] = res["trust_decision"]
        return res

    def resolve_xns(self, handle: str) -> Dict[str, Any]:
        """
        Resolves an XNS handle to a full agent profile.
        """
        base_url = self._get_base_url()
        resolve_url = f"{base_url}/v1/identity/resolve"
        response = requests.get(resolve_url, params={"handle": handle}, headers=self._get_headers(), timeout=5.0)
        response.raise_for_status()
        return response.json()

    def revoke_identity(self, reason: str, evidence_hash: Optional[str] = None) -> Dict[str, Any]:
        """
        Deactivates the agent identity and records the revocation in the global registry.
        """
        base_url = self._get_base_url()
        revoke_url = f"{base_url}/v1/identity/revoke"
        payload = {
            "agent_address": self.agent_id, # Assuming agent_id is the address
            "reason": reason,
            "evidence_hash": evidence_hash
        }
        response = requests.post(revoke_url, json=payload, headers=self._get_headers(), timeout=10.0)
        response.raise_for_status()
        return response.json()

    def anchor_state(self) -> Dict[str, Any]:
        """
        Admin: Instructs the Oracle to anchor the global protocol state on-chain.
        """
        base_url = self._get_base_url()
        anchor_url = f"{base_url}/v1/protocol/anchor"
        response = requests.post(anchor_url, headers=self._get_headers(), timeout=30.0)
        response.raise_for_status()
        return response.json()

    def report_transaction(
        self,
        deal_id: str,
        deal_amount: float,
        latency_ms: int,
        accuracy_score: float,
        gpu_hours_used: float = 0.0,
        hitl_intervention: bool = False,
        performance_variance: float = 0.05,
        verification_tier: int = 1,
        agent_id: Optional[str] = None,
        extra_payload: Optional[dict] = None
    ) -> Dict[str, Any]:
        """
        Submit a telemetry report directly to the Oracle using the Standard Ingestion Envelope.
        """
        base_url = self._get_base_url()
        report_url = f"{base_url}/v1/transactions/report"
        
        # Build the generic payload
        payload_data = {
            "deal_id": deal_id,
            "deal_amount": deal_amount,
            "latency_ms": latency_ms,
            "accuracy_score": accuracy_score,
            "gpu_hours_used": gpu_hours_used,
            "hitl_intervention": hitl_intervention,
            "performance_variance": performance_variance,
            "verification_tier": verification_tier,
        }
        if extra_payload:
            payload_data.update(extra_payload)

        envelope = {
            "agent_id": agent_id or self.wallet_address or self.agent_id,
            "domain_id": self.domain_id,
            "timestamp": int(time.time()),
            "nonce": int(time.time() * 1000),
            "payload": payload_data,
        }
        
        # 3. Attach DID identity + EVM wallet + signature if available
        if self._did is not None:
            envelope["agent_did"] = self._did

        if self._hardware_fingerprint is not None:
            envelope["hardware_fingerprint"] = self._hardware_fingerprint

        if self._evm_address is not None:
            envelope["performer_address"] = self._evm_address

        # Sign ONLY the core deterministic fields to avoid floating point serialization variance
        # Ensure agreement with Oracle's signature verification logic
        # format: deal_id-latency_ms-accuracy_score-deal_amount
        sig_payload_str = f"{deal_id}-{latency_ms}-{accuracy_score}-{deal_amount}"
        
        sig = self._sign_payload(sig_payload_str.encode('utf-8'))
        if sig is not None:
            envelope["signature"] = sig

        response = requests.post(report_url, json=envelope, headers=self._get_headers(), timeout=10.0)
        response.raise_for_status()
        return response.json()

    @property
    def did(self) -> Optional[str]:
        """The agent's decentralised identifier, or None."""
        return self._did

    @property
    def hardware_fingerprint(self) -> Optional[str]:
        return self._hardware_fingerprint

    @property
    def wallet_address(self) -> Optional[str]:
        """The agent's deterministically derived EVM (Secp256k1) wallet address, or None."""
        return self._evm_address

    @staticmethod
    def bcc_enforced(client: "IntegrityClient", action_type: str, opa_policy_id: str):
        """
        SDK Decorator to wrap functions with BCC enforcement.
        """
        def decorator(func):
            def wrapper(*args, **kwargs):
                # 1. Capture intended state based on function args/kwargs
                # Note: This is a simple implementation; production would filter sensitive keys
                intended_state = {
                    "function_name": func.__name__,
                    "args": [str(a) for a in args],
                    "kwargs": {k: str(v) for k, v in kwargs.items()}
                }

                # 2. Commit the action intent
                commitment = client.commit_action_intent(
                    action_type=action_type,
                    intended_state=intended_state,
                    opa_policy_id=opa_policy_id,
                )

                # 3. Execute with validation
                return client.validate_and_execute(
                    commitment=commitment,
                    actual_execution_context=intended_state,
                    action_function=lambda: func(*args, **kwargs)
                )
            return wrapper
        return decorator

    def spawn_subagent(self, subagent_id: str) -> "IntegrityClient":
        """
        Frictionless helper to spawn a child subagent instance that inherits
        the parent configuration, DID keys, and credentials, but isolates 
        its own telemetry tracking under a subagent namespace.
        """
        return IntegrityClient(
            agent_id=self.agent_id,
            oracle_url=self.oracle_url,
            batch_size_limit=self.batcher.batch_size_limit,
            flush_interval_sec=self.batcher.flush_interval_sec,
            did=self._did,
            subagent_id=subagent_id,
            enable_full_recording=self.enable_full_recording,
            hipaa_eligible=self.hipaa_eligible,
            zdr_enabled=self.zdr_enabled,
            external_web_access=self.external_web_access,
            region=self.region,
            ekm_provider=self.ekm_provider,
            api_domain_prefix=self.api_domain_prefix,
        )

    def _calculate_metrics(self, metadata: dict) -> tuple:
        """
        Calculates heuristic reputation metrics (entropy and grounding) from metadata.
        This allows frictionless telemetry tracking to build the data moat.
        Future updates can replace this with a more sophisticated model.
        """
        # Baseline ideal metrics
        entropy = 0.1
        grounding = 0.95
        
        if not metadata:
            return entropy, grounding
            
        # Extract predefined signals to calculate metrics
        over_sized_count = metadata.get("over_sized_count", 0)
        errors = metadata.get("errors", 0)
        warnings = metadata.get("warnings", 0)
        hallucination_flag = metadata.get("hallucination_flag", False)
        
        # Adjust based on signals
        if over_sized_count > 0:
            entropy += 0.4
            grounding -= 0.2
            
        if errors > 0:
            entropy += (0.2 * errors)
            grounding -= (0.1 * errors)
            
        if warnings > 0:
            entropy += (0.05 * warnings)
            grounding -= (0.02 * warnings)
            
        if hallucination_flag:
            entropy += 0.5
            grounding -= 0.5
            
        # Ensure values stay strictly bounded between 0.0 and 1.0
        return min(max(entropy, 0.0), 1.0), min(max(grounding, 0.0), 1.0)

    def log_model_switch(
        self,
        from_model: str,
        to_model: str,
        from_provider: Optional[str] = None,
        to_provider: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> None:
        """
        Manually logs a model/provider switch event to the telemetry queue.
        """
        metadata = {
            "event_type": "model_switch",
            "from_model": from_model,
            "to_model": to_model,
            "from_provider": from_provider or "unknown",
            "to_provider": to_provider or "unknown",
            "reason": reason or "dynamic_dispatch",
        }
        self.log_telemetry(metadata=metadata, entropy=0.1, grounding=0.95)

    def log_telemetry(
        self,
        metadata: dict = None,
        entropy: float = None,
        grounding: float = None,
        subagent_id: Optional[str] = None,
    ) -> None:
        """
        Logs a single piece of telemetry.
        Returns immediately without blocking agent inference.
        """
        metadata = metadata or {}
        
        # 0. Chain-of-Thought (CoT) & Reasoning Extraction
        import re
        text_out = metadata.get("text_output") or metadata.get("completion")
        reasoning_content = metadata.get("reasoning_content")
        if text_out and not reasoning_content:
            # Check for <thought> or <reasoning> tags (common in reasoning models)
            match = re.search(r"<(thought|reasoning)>(.*?)</\1>", text_out, re.DOTALL | re.IGNORECASE)
            if match:
                reasoning_content = match.group(2).strip()
                metadata["reasoning_content"] = reasoning_content
                # Strip thought tags from output to keep downstream data clean
                clean_text = re.sub(r"<(thought|reasoning)>.*?</\1>", "", text_out, flags=re.DOTALL | re.IGNORECASE).strip()
                metadata["clean_text_output"] = clean_text
                # Track reasoning trace metrics
                metadata["reasoning_length_chars"] = len(reasoning_content)
                metadata["reasoning_length_words"] = len(reasoning_content.split())
        
        # Check for model switch to avoid recursion and log switch event
        if metadata.get("event_type") != "model_switch":
            model_name = metadata.get("model_name") or metadata.get("model")
            provider_name = metadata.get("provider") or metadata.get("framework")
            if model_name:
                with self._lock:
                    if self.last_model and self.last_model != model_name:
                        self.log_model_switch(
                            from_model=self.last_model,
                            to_model=model_name,
                            from_provider=self.last_provider,
                            to_provider=provider_name,
                            reason="automatic_telemetry_detect"
                        )
                    self.last_model = model_name
                    self.last_provider = provider_name

        # Calculate dynamic inference quality metrics if available in metadata
        import math
        
        # 1. Token logprobs statistics
        logprobs = metadata.get("token_logprobs")
        if logprobs:
            probs = []
            total_logprob = 0.0
            min_prob = 1.0
            for lp in logprobs:
                prob = math.exp(lp)
                probs.append(prob)
                total_logprob += lp
                if prob < min_prob:
                    min_prob = prob
            
            avg_logprob = total_logprob / len(logprobs) if logprobs else 0.0
            mean_conf = math.exp(avg_logprob)
            perplexity = math.exp(-avg_logprob)
            
            metadata["mean_token_confidence"] = round(mean_conf * 100, 2)  # Percentage representation
            metadata["min_token_probability"] = round(min_prob * 100, 2)   # Percentage representation
            metadata["perplexity"] = round(perplexity, 4)
            
            # Map low confidence to higher entropy
            if mean_conf < 0.85:
                entropy = entropy if entropy is not None else min(1.0, (entropy or 0.1) + 0.3)
                grounding = grounding if grounding is not None else max(0.0, (grounding or 0.95) - 0.15)
        
        # 2. Vocabulary diversity (Type-Token Ratio)
        text_out = metadata.get("text_output")
        if text_out:
            words = text_out.lower().split()
            ttr = len(set(words)) / len(words) if words else 1.0
            metadata["vocabulary_diversity"] = round(ttr, 4)
            
        # 3. Structural compliance
        parsing_err = metadata.get("parsing_errors", 0)
        missing_keys = metadata.get("missing_keys", 0)
        if "parsing_errors" in metadata or "missing_keys" in metadata:
            compliance = max(0.0, 1.0 - (parsing_err * 0.5) - (missing_keys * 0.1))
            metadata["structural_compliance"] = round(compliance, 4)

        resolved_subagent_id = subagent_id or self.subagent_id
        if resolved_subagent_id:
            metadata["subagent_id"] = resolved_subagent_id

        # Frictionless metric calculation based on metadata signals
        if entropy is None or grounding is None:
            calc_entropy, calc_grounding = self._calculate_metrics(metadata)
            entropy = entropy if entropy is not None else calc_entropy
            grounding = grounding if grounding is not None else calc_grounding

        # Update and Compute Composite Signals
        self.analyzer.record_inference(
            prompt=metadata.get("prompt_text", ""),
            completion=metadata.get("text_output", ""),
            metrics={"grounding": grounding, "entropy": entropy, **metadata},
            host_snapshot=self.host_sampler.get_current_metrics()
        )
        composite_signals = self.analyzer.compute_all_signals(self.host_sampler.get_current_metrics())

        payload = {
            "entropy": entropy,
            "grounding": grounding,
            "timestamp": time.time(),
            "metadata": {**metadata, **composite_signals},
            "gpu_hours_used": metadata.get("gpu_hours_used", 0.0),
        }
        self.batcher.add_telemetry(payload)

    def _calculate_edit_distance(self, s1: str, s2: str) -> int:
        """Helper to compute Levenshtein distance between two strings."""
        if len(s1) > len(s2):
            s1, s2 = s2, s1
        distances = range(len(s1) + 1)
        for i2, c2 in enumerate(s2):
            distances_ = [i2+1]
            for i1, c1 in enumerate(s1):
                if c1 == c2:
                    distances_.append(distances[i1])
                else:
                    distances_.append(1 + min((distances[i1], distances[i1 + 1], distances_[-1])))
            distances = distances_
        return distances[-1]

    def commit_action_intent(
        self,
        action_type: str,
        intended_state: Dict[str, Any],
        opa_policy_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> BCCCommitment:
        """
        Generates a cryptographically signed commitment of an agent's intended action state.
        """
        # 1. Deterministic Serialization & Hashing
        canonical_state = json.dumps(intended_state, sort_keys=True, separators=(",", ":"))
        state_hash = hashlib.sha256(canonical_state.encode()).hexdigest()

        # 2. Mock OPA Evaluation (In production, this calls an OPA service)
        # For now, we assume success unless specified otherwise for testing
        opa_result = {
            "allow": True,
            "reason": "Default policy allow (Integrity SDK Mock)",
            "policy_id": opa_policy_id
        }

        commitment = BCCCommitment(
            id=str(uuid.uuid4()),
            timestamp=time.time(),
            agent_id=self.agent_id,
            action_type=action_type,
            intended_state_hash=state_hash,
            opa_policy_id=opa_policy_id,
            opa_evaluation_result=opa_result
        )

        # 3. Cryptographic Provenance Signature
        # We sign the commitment fields to prevent pre-commitment tampering
        sig_payload = asdict(commitment)
        # Remove signature and TTL from signing payload
        sig_payload.pop("provenance_signature")
        sig_payload.pop("ttl")
        
        serialized_commitment = json.dumps(sig_payload, sort_keys=True, separators=(",", ":"))
        commitment.provenance_signature = self._sign_payload(serialized_commitment.encode())

        # 4. Log the commitment to the telemetry stream for auditing
        self.log_telemetry(
            metadata={
                "event_type": "bcc_commitment",
                "commitment_id": commitment.id,
                "action_type": action_type,
                "intended_state": intended_state,
                "opa_result": opa_result,
                "metadata": metadata or {}
            },
            entropy=0.0,
            grounding=1.0 # Commitment is authoritative
        )

        return commitment

    def validate_and_execute(
        self,
        commitment: BCCCommitment,
        actual_execution_context: Dict[str, Any],
        action_function: Callable,
    ) -> Any:
        """
        Validates the execution context against the commitment before running the action.
        """
        # 1. Check TTL
        if time.time() > commitment.timestamp + commitment.ttl:
            raise RuntimeError(f"BCC_EXPIRED: Commitment {commitment.id} has expired.")

        # 2. Remote Validation (Institutional Mode)
        if self.bcc_middleware_url:
            try:
                payload = {
                    "commitment": asdict(commitment),
                    "actual_context": actual_execution_context
                }
                response = requests.post(
                    f"{self.bcc_middleware_url}/v1/bcc/intercept",
                    json=payload,
                    timeout=5.0
                )
                if response.status_code == 200:
                    result = response.json()
                    if not result.get("authorized"):
                        raise RuntimeError(f"BCC_MIDDLEWARE_REJECTION: {result.get('reason')}")
                    # If authorized, we can continue to local hash check
                else:
                    print(f"[IntegrityClient] BCC Middleware error {response.status_code}. Falling back to local.")
            except Exception as e:
                if "BCC_MIDDLEWARE_REJECTION" in str(e):
                    raise
                print(f"[IntegrityClient] BCC Middleware unreachable: {e}. Falling back to local.")

        # 3. Verify Intent Integrity (Re-hash actual vs intended)
        # In a real BCC, we compare critical keys in actual_execution_context 
        # against what was hashed in intended_state_hash.
        # For the SDK, we expect actual_execution_context to match intended_state logic.
        actual_canonical = json.dumps(actual_execution_context, sort_keys=True, separators=(",", ":"))
        actual_hash = hashlib.sha256(actual_canonical.encode()).hexdigest()

        if actual_hash != commitment.intended_state_hash:
            self.log_telemetry(
                metadata={
                    "event_type": "bcc_validation_failure",
                    "commitment_id": commitment.id,
                    "expected_hash": commitment.intended_state_hash,
                    "actual_hash": actual_hash,
                    "drift_detected": True
                },
                entropy=1.0, # Maximum entropy (disorder)
                grounding=0.0 # Zero grounding
            )
            raise RuntimeError(f"BCC_INTENT_DRIFT: Actual execution context deviates from signed intent!")

        # 3. Execute Action
        try:
            result = action_function()
            
            # 4. Log Success
            self.log_telemetry(
                metadata={
                    "event_type": "bcc_execution_success",
                    "commitment_id": commitment.id,
                    "action_type": commitment.action_type
                },
                entropy=0.0,
                grounding=1.0
            )
            return result
        except Exception as e:
            # 5. Log Failure
            self.log_telemetry(
                metadata={
                    "event_type": "bcc_execution_failure",
                    "commitment_id": commitment.id,
                    "error": str(e)
                },
                entropy=0.5,
                grounding=0.0
            )
            raise

    def log_compliance_event(
        self,
        event_type: str,
        status: str,
        details: Optional[str] = None,
        extra_metadata: Optional[dict] = None
    ) -> None:
        """
        Logs a compliance-specific event (e.g., ZDR activation, geographic boundary check).
        """
        from .telemetry.conventions import IntegrityAttributes
        metadata = {
            "event_type": "compliance_audit",
            "compliance_event": event_type,
            "status": status,
            "details": details,
            IntegrityAttributes.COMPLIANCE_HIPAA_ELIGIBLE: self.hipaa_eligible,
            IntegrityAttributes.COMPLIANCE_ZDR_ENABLED: self.zdr_enabled,
        }
        if extra_metadata:
            metadata.update(extra_metadata)
            
        self.log_telemetry(
            metadata=metadata,
            entropy=0.0,
            grounding=1.0 # Compliance events are authoritative
        )

    def log_hitl_action(
        self,
        action_type: str,
        proposed_content: Optional[str] = None,
        final_content: Optional[str] = None,
        reviewer_did: Optional[str] = None,
        review_latency_ms: Optional[float] = None,
        justification: Optional[str] = None,
        extra_metadata: Optional[dict] = None
    ) -> None:
        """
        Logs a human-in-the-loop (HITL) review, approval, or override action.
        """
        edit_distance = None
        if proposed_content is not None and final_content is not None:
            try:
                edit_distance = self._calculate_edit_distance(proposed_content, final_content)
            except Exception:
                pass

        metadata = {
            "event_type": "human_in_the_loop",
            "action_type": action_type,
            "reviewer_did": reviewer_did or "unknown_reviewer",
            "review_latency_ms": review_latency_ms,
            "justification": justification,
            "edit_distance": edit_distance,
        }
        if proposed_content is not None:
            metadata["proposed_length"] = len(proposed_content)
        if final_content is not None:
            metadata["final_length"] = len(final_content)

        if extra_metadata:
            metadata.update(extra_metadata)

        # HITL actions represent a manual override or verification; grounding is set to 1.0 (authoritative)
        self.log_telemetry(
            metadata=metadata,
            entropy=0.0,
            grounding=1.0
        )

    def log_inference(
        self,
        provider: str,
        raw_data: Any,
        latency_ms: Optional[float] = None,
        ttft_ms: Optional[float] = None,
        extra_metadata: Optional[dict] = None,
        entropy: Optional[float] = None,
        grounding: Optional[float] = None,
        subagent_id: Optional[str] = None,
    ) -> None:
        """
        Parses, normalizes, and logs inference-level telemetry from any LLM provider pipeline.
        Extracts prompt/completion tokens, pricing, latency, and hardware environments.
        """
        from .extractor import InferenceMetadataExtractor
        
        metadata = InferenceMetadataExtractor.normalize(
            provider=provider,
            raw_data=raw_data,
            latency_ms=latency_ms,
            ttft_ms=ttft_ms,
            enable_full_recording=self.enable_full_recording
        )
        
        if extra_metadata:
            metadata.update(extra_metadata)
            
        self.log_telemetry(
            metadata=metadata,
            entropy=entropy,
            grounding=grounding,
            subagent_id=subagent_id
        )

    # ------------------------------------------------------------------
    # Ownership Claim (MetaMask Association)
    # ------------------------------------------------------------------

    def generate_claim_challenge(self, owner_address: str) -> str:
        """
        Generates a deterministic challenge message for MetaMask signing.
        The human operator signs this message in MetaMask to prove they
        own the wallet and want to claim this agent.

        Parameters
        ----------
        owner_address : str
            The human's MetaMask wallet address (0x...)

        Returns
        -------
        str
            The challenge message to be signed via personal_sign in MetaMask.
        """
        if self._evm_address is None:
            raise RuntimeError("Agent has no derived EVM address. Cannot generate claim challenge.")

        timestamp = int(time.time())
        challenge = (
            f"I, {owner_address.lower()}, claim ownership of agent "
            f"{self._evm_address.lower()} on the Xibalba Integrity Protocol. "
            f"Timestamp: {timestamp}"
        )
        return challenge

    def claim_ownership(
        self,
        owner_address: str,
        signature: str,
        challenge: Optional[str] = None,
    ) -> dict:
        """
        Submits an ownership claim to the Oracle, binding this agent's
        derived wallet to the human operator's MetaMask address.

        Parameters
        ----------
        owner_address : str
            The human's MetaMask wallet address (0x...)
        signature : str
            The EIP-191 personal_sign hex signature from MetaMask
        challenge : str, optional
            The challenge message that was signed. If not provided,
            generates a new one (note: this won't match an already-signed challenge).

        Returns
        -------
        dict
            Response from the Oracle with claim status.

        Raises
        ------
        RuntimeError
            If the agent has no derived EVM address.
        requests.HTTPError
            If the Oracle rejects the claim.
        """
        if self._evm_address is None:
            raise RuntimeError("Agent has no derived EVM address. Cannot claim ownership.")

        if challenge is None:
            challenge = self.generate_claim_challenge(owner_address)

        # Build the Oracle base URL (strip the telemetry path)
        base_url = self.oracle_url.rsplit('/v1/', 1)[0] if '/v1/' in self.oracle_url else self.oracle_url.rstrip('/')
        claim_url = f"{base_url}/v1/agents/claim"

        payload = {
            "agent_wallet": self._evm_address,
            "owner_wallet": owner_address,
            "challenge": challenge,
            "signature": signature,
            "timestamp": int(time.time()),
        }

        response = requests.post(claim_url, json=payload, timeout=10.0)
        response.raise_for_status()
        result = response.json()

        self._owner_address = owner_address
        print(f"[IntegrityClient] Ownership claimed: {self._evm_address} -> {owner_address}")

        return result

    @property
    def owner_address(self) -> Optional[str]:
        """The MetaMask wallet address that owns this agent, if claimed."""
        return getattr(self, '_owner_address', None)

    def get_ais_score(self) -> int:
        """
        Retrieves the agent's current AIS (Agent Intelligence Score)
        from the Oracle via a local cache or API call.
        """
        try:
            # Query the Oracle for the agent's current status
            base_url = self._get_base_url()
            identifier = self.wallet_address or self.agent_id
            response = requests.get(f"{base_url}/v1/agent/{identifier}", timeout=2.0)
            if response.status_code == 200:
                data = response.json()
                return data.get("current_ais", 500) # Default to neutral
        except Exception:
            pass
        return 500 # Default score if oracle is unreachable

    # ------------------------------------------------------------------
    # Background worker
    # ------------------------------------------------------------------

    def _init_sqlite_cache(self) -> None:
        import sqlite3
        try:
            self._cache_dir = os.path.expanduser("~/.integrity")
            os.makedirs(self._cache_dir, exist_ok=True)
            self._cache_db_path = os.path.join(self._cache_dir, f"offline_moat_{self.agent_id}.db")
            conn = sqlite3.connect(self._cache_db_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS offline_telemetry (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    payload TEXT NOT NULL,
                    timestamp REAL NOT NULL,
                    integrity_hash TEXT NOT NULL
                )
            """)
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[IntegrityClient] SQLite cache init failed: {e}")

    def _cache_payload_locally(self, payload: dict) -> None:
        import sqlite3
        import hmac
        import hashlib
        try:
            payload_str = json.dumps(payload, sort_keys=True)
            # Row-level integrity hashing using private HMAC seed
            integrity_hash = hmac.new(self._hmac_secret, payload_str.encode(), hashlib.sha256).hexdigest()

            conn = sqlite3.connect(self._cache_db_path)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO offline_telemetry (payload, timestamp, integrity_hash) VALUES (?, ?, ?)",
                (payload_str, time.time(), integrity_hash)
            )
            conn.commit()
            conn.close()
            print(f"[IntegrityClient] Telemetry cached locally inside SQLite.")
        except Exception as ex:
            print(f"[IntegrityClient] Failed to write to SQLite cache: {ex}")

    def _sync_offline_cache(self) -> None:
        import sqlite3
        import hmac
        import hashlib
        try:
            conn = sqlite3.connect(self._cache_db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT id, payload, integrity_hash FROM offline_telemetry ORDER BY id ASC LIMIT 10")
            rows = cursor.fetchall()
            if not rows:
                conn.close()
                return

            print(f"[IntegrityClient] Detected {len(rows)} offline telemetry records. Attempting sync...")
            for row_id, payload_str, stored_hash in rows:
                # 1. Verify offline database row integrity (Devils Advocate fix)
                computed_hash = hmac.new(self._hmac_secret, payload_str.encode(), hashlib.sha256).hexdigest()
                if not hmac.compare_digest(computed_hash, stored_hash):
                    print(f"[WARN] Local SQLite database tampering detected! Discarding tampered row {row_id}.")
                    cursor.execute("DELETE FROM offline_telemetry WHERE id = ?", (row_id,))
                    continue

                payload = json.loads(payload_str)
                response = requests.post(self.oracle_url, json=payload, timeout=5.0)
                response.raise_for_status()
                cursor.execute("DELETE FROM offline_telemetry WHERE id = ?", (row_id,))
            conn.commit()
            conn.close()
            print(f"[IntegrityClient] Successfully synchronized offline cache with Oracle.")
        except Exception:
            pass

    def _background_worker(self) -> None:
        """
        Runs in the background, checking if the batcher should flush.
        If so, generates a ZK proof and transmits it to the Oracle.
        """
        last_sync_time = time.time()
        while self._running:
            if self.batcher.should_flush():
                batch = self.batcher.get_batch_and_clear()
                self._process_and_send(batch)
            
            # Periodically try to sync offline cache (every 10 seconds)
            if time.time() - last_sync_time > 10.0:
                self._sync_offline_cache()
                last_sync_time = time.time()

            time.sleep(0.5)

    def _sign_payload(self, payload_bytes: bytes) -> Optional[str]:
        """Sign raw bytes with the DID keypair; returns hex or None."""
        if self._keypair is None:
            return None
        try:
            sig = self._keypair.sign(payload_bytes)
            return sig.hex()
        except Exception:
            return None

    def _process_and_send(self, batch: list) -> None:
        try:
            # 1. Generate ZK Proof for the batch
            proof_data = self.prover.generate_proof(batch)

            # Calculate batch statistics
            total_entropy = sum(item.get("entropy", 0.0) for item in batch)
            total_grounding = sum(item.get("grounding", 0.0) for item in batch)
            avg_entropy = total_entropy / len(batch) if batch else 0.0
            avg_grounding = total_grounding / len(batch) if batch else 0.0
            total_gpu_hours = sum(item.get("gpu_hours_used", 0.0) for item in batch)

            # Compile a list of all raw metadata in the batch
            raw_metadata_list = [item.get("metadata", {}) for item in batch]

            # 2. Construct base payload
            from .telemetry.conventions import IntegrityAttributes
            payload_data = {
                "zk_proof": proof_data["zk_proof"],
                "nonce": proof_data["nonce"],
                "batch_size": proof_data["batch_size"],
                "avg_entropy": avg_entropy,
                "avg_grounding": avg_grounding,
                "gpu_hours_used": total_gpu_hours,
                "metadata": raw_metadata_list,
                # Compliance attributes
                IntegrityAttributes.COMPLIANCE_HIPAA_ELIGIBLE: self.hipaa_eligible,
                IntegrityAttributes.COMPLIANCE_ZDR_ENABLED: self.zdr_enabled,
                IntegrityAttributes.COMPLIANCE_EXTERNAL_WEB_ACCESS: self.external_web_access,
                IntegrityAttributes.COMPLIANCE_DATA_RESIDENCY_REGION: self.region,
                IntegrityAttributes.COMPLIANCE_API_DOMAIN_PREFIX: self.api_domain_prefix,
                IntegrityAttributes.COMPLIANCE_EKM_PROVIDER: self.ekm_provider,
            }

            # Merge global extra_metadata if provided
            if self.extra_metadata:
                payload_data.update(self.extra_metadata)

            envelope = {
                "agent_id": self.wallet_address or self.agent_id,
                "domain_id": self.domain_id,
                "timestamp": int(time.time()),
                "nonce": proof_data["nonce"],
                "zk_proof": proof_data["zk_proof"],
                "payload": payload_data,
            }

            # 3. Attach DID identity + EVM wallet + signature if available
            if self._did is not None:
                envelope["agent_did"] = self._did

            if self._hardware_fingerprint is not None:
                envelope["hardware_fingerprint"] = self._hardware_fingerprint

            if self._evm_address is not None:
                envelope["performer_address"] = self._evm_address

            # Sign ONLY the core deterministic fields to avoid floating point serialization variance
            sig_payload = {
                "agent_id": envelope["agent_id"],
                "zk_proof": envelope.get("zk_proof"),
                "nonce": envelope.get("nonce"),
                "batch_size": payload_data.get("batch_size"),
            }
            if self._did is not None:
                sig_payload["agent_did"] = self._did
            if self._hardware_fingerprint is not None:
                sig_payload["hardware_fingerprint"] = self._hardware_fingerprint
            if self._evm_address is not None:
                sig_payload["performer_address"] = self._evm_address

            serialized_payload = json.dumps(sig_payload, sort_keys=True, separators=(",", ":"))
            print(f"[DEBUG SDK] CANONICAL JSON: {serialized_payload}")
            sig = self._sign_payload(serialized_payload.encode())
            if sig is not None:
                envelope["signature"] = sig

            # 4. Transmit to Oracle via HTTP ingestion
            if self.oracle_url.endswith("/ingest") or self.oracle_url.endswith("/ingest/"):
                transmit_url = self.oracle_url
            else:
                base_url = self._get_base_url()
                transmit_url = f"{base_url}/v1/transactions/report"

            response = requests.post(
                transmit_url, json=envelope, timeout=5.0
            )
            response.raise_for_status()
        except Exception as e:
            print(f"[IntegrityClient] Transmission failed, caching locally: {e}")
            self._cache_payload_locally(envelope if 'envelope' in locals() else {})

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def shutdown(self):
        """Clean shutdown ensuring all remaining batches are flushed."""
        self._running = False
        self._worker_thread.join(timeout=2.0)
        # Drain any remaining items (may require multiple flushes)
        while True:
            batch = self.batcher.get_batch_and_clear()
            if not batch:
                break
            self._process_and_send(batch)

    def get_owner_agents(self, owner_address: str) -> dict:
        """Retrieves all agents owned by a specific human wallet address."""
        base_url = self._get_base_url()
        url = f"{base_url}/v1/owner/{owner_address}/agents"
        
        response = requests.get(url, timeout=10.0)
        response.raise_for_status()
        return response.json()

    # --- Institutional & Economic Expansion ---

    def stake_itk(self, amount: float) -> dict:
        """Stakes ITK tokens for the current agent."""
        url = f"{self._get_base_url()}/v1/agent/{self._evm_address}/stake"
        response = requests.post(url, json={"amount_itk": amount}, timeout=10.0)
        response.raise_for_status()
        return response.json()

    def unstake_itk(self, amount: float) -> dict:
        """Unstakes ITK tokens for the current agent."""
        url = f"{self._get_base_url()}/v1/agent/{self._evm_address}/unstake"
        response = requests.post(url, json={"amount_itk": amount}, timeout=10.0)
        response.raise_for_status()
        return response.json()

    def get_credit_profile(self) -> dict:
        """Retrieves the credit profile and active loans for the agent."""
        url = f"{self._get_framework_url()}/v1/agent/{self._evm_address}/credit/profile"
        response = requests.get(url, timeout=10.0)
        response.raise_for_status()
        return response.json()

    def borrow_itk(self, amount: float, term_days: int = 30) -> dict:
        """Applies for an institutional loan via the Integrity Protocol."""
        url = f"{self._get_framework_url()}/v1/agent/{self._evm_address}/credit/borrow"
        payload = {"amount_itk": amount, "term_days": term_days}
        response = requests.post(url, json=payload, timeout=10.0)
        response.raise_for_status()
        return response.json()

    def request_audit(self, platinum: bool = False) -> dict:
        """Formally requests an institutional certification audit."""
        url = f"{self._get_framework_url()}/v1/audit/request"
        payload = {
            "agent_address": self._evm_address,
            "audit_type": "PLATINUM" if platinum else "AUTOMATED"
        }
        response = requests.post(url, json=payload, timeout=10.0)
        response.raise_for_status()
        return response.json()

    def get_provenance(self) -> list:
        """Fetches the forensic provenance audit trail for the agent."""
        url = f"{self._get_framework_url()}/v1/agent/{self._evm_address}/provenance"
        response = requests.get(url, timeout=10.0)
        response.raise_for_status()
        return response.json()

    def initialize_goal(self, goal_id: str, description: str, metadata: dict = None) -> None:
        """Initializes stateful tracking for a long-running task/goal."""
        self._active_goals[goal_id] = {
            "description": description,
            "start_time": time.time(),
            "status": "IN_PROGRESS",
            "metadata": metadata or {},
            "steps": []
        }
        self._goal_stats["total_goals"] += 1
        self.log_telemetry(
            metadata={
                "event_type": "goal_init",
                "goal_id": goal_id,
                "description": description,
                "metadata": metadata or {}
            },
            entropy=0.1,
            grounding=0.9
        )

    def update_goal(self, goal_id: str, status: str, result_metadata: dict = None) -> None:
        """Updates the status and records results for an active goal, registering success rates."""
        if goal_id not in self._active_goals:
            return
        goal = self._active_goals[goal_id]
        goal["status"] = status
        goal["end_time"] = time.time()
        goal["duration"] = goal["end_time"] - goal["start_time"]
        
        is_success = status.upper() in ("SUCCESS", "COMPLETED", "RESOLVED")
        if is_success:
            self._goal_stats["successful_goals"] += 1
        else:
            self._goal_stats["failed_goals"] += 1

        self.log_telemetry(
            metadata={
                "event_type": "goal_update",
                "goal_id": goal_id,
                "status": status,
                "duration_sec": round(goal["duration"], 2),
                "goal_success_rate": self.get_goal_success_rate(),
                "metadata": result_metadata or {}
            },
            entropy=0.0 if is_success else 0.8,
            grounding=1.0 if is_success else 0.0
        )

    def get_goal_success_rate(self) -> float:
        """Returns the ratio of successful goals over total completed goals."""
        completed = self._goal_stats["successful_goals"] + self._goal_stats["failed_goals"]
        if completed == 0:
            return 1.0
        return round(self._goal_stats["successful_goals"] / completed, 4)

    def _get_base_url(self) -> str:
        base = self.oracle_url.rsplit('/v1/', 1)[0] if '/v1/' in self.oracle_url else self.oracle_url.rstrip('/')
        if base.endswith('/ingest'):
            base = base.rsplit('/ingest', 1)[0]
        return base

    def _get_framework_url(self) -> str:
        base = self.framework_url.rsplit('/v1/', 1)[0] if '/v1/' in self.framework_url else self.framework_url.rstrip('/')
        return base

