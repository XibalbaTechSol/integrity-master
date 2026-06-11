import json
import requests
import threading
import time
import os
from typing import Optional, Any

from .batcher import TelemetryBatcher
from .prover import NoirProver


class IntegrityClient:
    """
    Main entry point for Edge Agents to interact with the Integrity Protocol.
    Manages background batching, DID-based signing, and async submission
    to the Axum Oracle.
    """
    def __init__(
        self,
        agent_id: str,
        oracle_url: str = "http://localhost:3001/ingest",
        batch_size_limit: int = 50,
        flush_interval_sec: float = 5.0,
        did: Optional[str] = None,
        subagent_id: Optional[str] = None,
        enable_full_recording: bool = False,
    ):
        self.agent_id = agent_id
        self.subagent_id = subagent_id
        self.enable_full_recording = enable_full_recording
        self.oracle_url = oracle_url
        self.batcher = TelemetryBatcher(
            batch_size_limit=batch_size_limit,
            flush_interval_sec=flush_interval_sec,
        )
        self.prover = NoirProver(agent_id=agent_id)

        # ---- DID / hardware binding ----------------------------------
        self._did: Optional[str] = did
        self._keypair = None
        self._hardware_fingerprint: Optional[str] = None

        try:
            from .did import load_or_create_did, get_hardware_fingerprint

            if self._did is None:
                self._did, self._keypair = load_or_create_did()
            else:
                _, self._keypair = load_or_create_did()

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
            else:
                self._hmac_secret = b"integrity_protocol_sqlite_cache_shared_secret"
        except Exception as exc:
            # DID subsystem is best-effort; agent must not crash if
            # hardware reads or key generation fail.
            self._hmac_secret = b"integrity_protocol_sqlite_cache_shared_secret"
            print(f"[IntegrityClient] DID init skipped: {exc}")

        self._running = True
        self._init_sqlite_cache()
        self._worker_thread = threading.Thread(
            target=self._background_worker, daemon=True
        )
        self._worker_thread.start()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @property
    def did(self) -> Optional[str]:
        """The agent's decentralised identifier, or None."""
        return self._did

    @property
    def hardware_fingerprint(self) -> Optional[str]:
        return self._hardware_fingerprint

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

        payload = {
            "entropy": entropy,
            "grounding": grounding,
            "timestamp": time.time(),
            "metadata": metadata,
        }
        self.batcher.add_telemetry(payload)

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
    # Background worker
    # ------------------------------------------------------------------

    def _init_sqlite_cache(self) -> None:
        import sqlite3
        try:
            self._cache_dir = os.path.expanduser("~/.integrity")
            os.makedirs(self._cache_dir, exist_ok=True)
            self._cache_db_path = os.path.join(self._cache_dir, "offline_moat.db")
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

            # Compile a list of all raw metadata in the batch
            raw_metadata_list = [item.get("metadata", {}) for item in batch]

            # 2. Construct base payload
            payload = {
                "agent_id": self.agent_id,
                "zk_proof": proof_data["zk_proof"],
                "nonce": proof_data["nonce"],
                "batch_size": proof_data["batch_size"],
                "avg_entropy": avg_entropy,
                "avg_grounding": avg_grounding,
                "metadata": raw_metadata_list,
            }

            # 3. Attach DID identity + signature if available
            if self._did is not None:
                payload["agent_did"] = self._did

            if self._hardware_fingerprint is not None:
                payload["hardware_fingerprint"] = self._hardware_fingerprint

            # Sign ONLY the core deterministic fields to avoid floating point serialization variance
            sig_payload = {
                "agent_id": payload["agent_id"],
                "zk_proof": payload["zk_proof"],
                "nonce": payload["nonce"],
                "batch_size": payload["batch_size"],
            }
            if self._did is not None:
                sig_payload["agent_did"] = self._did
            if self._hardware_fingerprint is not None:
                sig_payload["hardware_fingerprint"] = self._hardware_fingerprint

            serialized_payload = json.dumps(sig_payload, sort_keys=True, separators=(",", ":"))
            print(f"[DEBUG SDK] CANONICAL JSON: {serialized_payload}")
            sig = self._sign_payload(serialized_payload.encode())
            if sig is not None:
                payload["signature"] = sig

            # 4. Transmit to Oracle via HTTP ingestion
            response = requests.post(
                self.oracle_url, json=payload, timeout=5.0
            )
            response.raise_for_status()
        except Exception as e:
            print(f"[IntegrityClient] Transmission failed, caching locally: {e}")
            self._cache_payload_locally(payload)

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

