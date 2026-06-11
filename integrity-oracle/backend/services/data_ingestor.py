import time
import uuid
import datetime
import requests
import os
from sqlalchemy.orm import Session
from database import SessionLocal, Agent, TransactionLog, TelemetryLog, ReputationSnapshot
from verification_engine import AutonomousVerificationEngine
from scoring_engine import TriMetricScoringEngine
from blockchain_service import IntegrityBlockchainService

RUST_API_URL = os.getenv("RUST_API_URL", "http://localhost:8080")

# Xibalba Solutions: Data Ingestion & Analytics Engine (v1.2)
# This service transforms raw transaction data into verified AIS metrics.

class IntegrityDataIngestor:
    def __init__(self):
        self.verifier = AutonomousVerificationEngine()
        self.scorer = TriMetricScoringEngine()
        self.blockchain = IntegrityBlockchainService()

    def _create_reputation_snapshot(self, db: Session, agent: Agent, scores: dict):
        """
        Creates a daily snapshot of the agent's reputation scores if one doesn't exist for today.
        """
        today = datetime.datetime.utcnow().date()
        existing_snapshot = db.query(ReputationSnapshot).filter(
            ReputationSnapshot.agent_id == agent.agent_id,
            ReputationSnapshot.timestamp >= today,
            ReputationSnapshot.timestamp < today + datetime.timedelta(days=1)
        ).first()

        if not existing_snapshot:
            # Ensure integer scores for snapshot
            ais_score = int(scores.get("integrity_score", agent.current_ais))
            entropy_score = int(scores.get("entropy_score", 0))
            grounding_score = int(scores.get("grounding_score", agent.grounding_score))
            sacrifice_score = int(scores.get("sacrifice_score", 0))

            snapshot = ReputationSnapshot(
                agent_id=agent.agent_id,
                timestamp=datetime.datetime.utcnow(),
                ais_score=ais_score,
                entropy_score=entropy_score,
                grounding_score=grounding_score,
                sacrifice_score=sacrifice_score
            )
            db.add(snapshot)
            print(f"[SNAPSHOT] Created daily snapshot for agent {agent.alias}: AIS={ais_score}")
        else:
            print(f"[SNAPSHOT] Daily snapshot already exists for agent {agent.alias}. Skipping.")

    def process_new_transaction(self,
                                agent_address: str,
                                tx_hash: str,
                                contract_value: float,
                                latency_ms: int,
                                accuracy: float,
                                tokens_processed: int,
                                model_class="SMALL"):
        """
        Main entry point for incoming performance reports.
        Delegates scoring to the Rust service and updates the agent's state.
        """
        # Fetch historical performance to calculate variance for the Rust service
        db = SessionLocal()
        try:
            agent = db.query(Agent).filter(Agent.eth_address == agent_address).first()
            if not agent:
                # If agent doesn't exist, the Rust service will create it.
                # We can proceed with a default performance variance.
                performance_variance = 0.5 
            else:
                history = db.query(TransactionLog).filter(TransactionLog.agent_id == agent.agent_id).limit(100).all()
                latencies = [t.completion_time_ms for t in history] + [latency_ms]
                accuracies = [float(t.data_quality_score) for t in history] + [accuracy]
                performance_variance = self.verifier.calculate_performance_entropy(latencies, accuracies)

            # Construct payload for the Rust service
            payload = {
                "agent_id": agent_address,
                "deal_id": tx_hash,
                "deal_amount": contract_value,
                "latency_ms": latency_ms,
                "accuracy_score": accuracy,
                "hitl_intervention": False, # This can be enhanced later
                "gpu_hours_used": 0.1, # Mock value, align with Rust logic
                "performance_variance": performance_variance,
                "verification_tier": agent.verification_tier if agent else 1
            }

            print(f"[HYBRID] Calling Rust service with payload: {payload}")
            response = requests.post(f"{RUST_API_URL}/v1/transactions/report", json=payload)
            response.raise_for_status() # Raise an exception for bad status codes
            
            rust_scores = response.json()
            print(f"[HYBRID] Received response from Rust: {rust_scores}")

            # The Rust service already updated the agent's core metrics (AIS, etc.)
            # and logged the transaction. Here, we just sync our view and create the snapshot.
            agent = db.query(Agent).filter(Agent.eth_address == agent_address).first()
            if agent:
                 # The rust service already sets these, this is just to return a compatible dict
                scores = {
                    "integrity_score": rust_scores.get("ais_score"),
                    "entropy_score": rust_scores.get("entropy"),
                    "grounding_score": rust_scores.get("grounding"),
                    "sacrifice_score": rust_scores.get("sacrifice"),
                }
                self._create_reputation_snapshot(db, agent, scores)
                db.commit() # Commit snapshot
                return scores
            else:
                # This case should be handled by the Rust service creating the agent.
                # If we get here, something went wrong.
                print(f"[HYBRID] Error: Agent {agent_address} not found after Rust service call.")
                return None

        except requests.exceptions.RequestException as e:
            print(f"[HYBRID] CRITICAL: Failed to call Rust service: {e}")
            # Optional: Implement a fallback to the Python scoring logic if the Rust service is down.
            return None
        finally:
            db.close()

    def process_telemetry_batch(self, agent_address: str, events: list):
        """
        Processes a batch of telemetry events by delegating each one to the Rust service.
        """
        all_scores = []
        for event in events:
            # Construct a transaction-like payload for each telemetry event
            # This is a simplification; in a real-world scenario, the Rust service
            # might have a dedicated batch endpoint.
            try:
                scores = self.process_new_transaction(
                    agent_address=agent_address,
                    tx_hash=f"tel_{uuid.uuid4().hex[:16]}",
                    contract_value=event.get('contract_value', 0.0),
                    latency_ms=event.get('latency_ms', 0),
                    accuracy=event.get('accuracy', 1.0),
                    tokens_processed=event.get('tokens_out', 0)
                )
                if scores:
                    all_scores.append(scores)
            except Exception as e:
                print(f"[HYBRID] Error processing batch event for {agent_address}: {e}")
        
        # Return the scores from the last successful event in the batch
        return all_scores[-1] if all_scores else None

