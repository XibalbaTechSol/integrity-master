import time
import uuid
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, Agent, TransactionLog, TelemetryLog
from verification_engine import AutonomousVerificationEngine
from scoring_engine import TriMetricScoringEngine
from blockchain_service import IntegrityBlockchainService

# Xibalba Solutions: Data Ingestion & Analytics Engine (v1.2)
# This service transforms raw transaction data into verified AIS metrics.

class IntegrityDataIngestor:
    def __init__(self):
        self.verifier = AutonomousVerificationEngine()
        self.scorer = TriMetricScoringEngine()
        self.blockchain = IntegrityBlockchainService()

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
        Persists data to PostgreSQL and updates agent scores.
        """
        db = SessionLocal()
        try:
            # 1. Fetch or Initialize Agent Record
            agent = db.query(Agent).filter(Agent.eth_address == agent_address).first()
            
            if not agent:
                agent = Agent(
                    eth_address=agent_address,
                    current_ais=0,
                    gpu_hours_verified=0,
                    performance_entropy=0,
                    penalty_points=0.0
                )
                db.add(agent)
                db.commit()
                db.refresh(agent)

            # 2. Log the raw transaction
            new_tx = TransactionLog(
                agent_id=agent.agent_id,
                on_chain_tx_hash=tx_hash,
                contract_value_intg=contract_value,
                completion_time_ms=latency_ms,
                data_quality_score=accuracy
                # Note: tokens and model_class can be stored in metadata if needed
            )
            db.add(new_tx)
            db.commit()

            # 3. Fetch Agent's Historical Performance for recalculation
            history = db.query(TransactionLog).filter(TransactionLog.agent_id == agent.agent_id).all()
            latencies = [t.completion_time_ms for t in history]
            accuracies = [float(t.data_quality_score) for t in history]
            
            # 4. Calculate New Autonomous Metrics
            performance_variance = self.verifier.calculate_performance_entropy(latencies, accuracies)
            
            # 4b. Calculate Real HGI from Telemetry Logs
            telemetry_history = db.query(TelemetryLog).filter(TelemetryLog.agent_id == agent.agent_id).limit(100).all()
            hgi_raw = self.verifier.calculate_human_grounding_index([
                {
                    "was_intervened": h.was_intervened,
                    "intervention_depth": float(h.intervention_depth),
                    "response_time_ms": h.latency_ms
                } for h in telemetry_history
            ]) if telemetry_history else 0.0

            # 4c. Sacrifice: Mock GPU logic for now
            tx_metadata = [{
                "tokens_processed": 100000, 
                "model_class": "SMALL",
                "claimed_gpu_hours": 0.1 
            } for _ in history]
            total_gpu_hours = self.verifier.verify_computational_sacrifice(tx_metadata)

            # 5. Refresh Scores via Scoring Engine
            days_since_active = (datetime.datetime.utcnow().replace(tzinfo=None) - agent.last_active_at.replace(tzinfo=None)).total_seconds() / 86400
            
            scores = self.scorer.calculate_ais(
                avg_partner_ais=500, # Default/Fallback
                xibalba_audit_score=1.0, 
                gpu_hours_verified=float(total_gpu_hours),
                hgi_raw=hgi_raw,
                performance_variance=performance_variance,
                staked_ratio=0.5, # Mock
                agent_age_days=(datetime.datetime.utcnow().replace(tzinfo=None) - agent.registration_date.replace(tzinfo=None)).days + 1,
                total_volume_intg=float(db.query(TransactionLog.contract_value_intg).filter(TransactionLog.agent_id == agent.agent_id).count()), # Placeholder volume calc
                days_since_active=days_since_active,
                penalty_points=float(agent.penalty_points),
                verification_tier=agent.verification_tier
            )

            # 6. Update Agent State in DB
            agent.current_ais = scores["integrity_score"]
            agent.grounding_score = scores["grounding_score"]
            agent.performance_entropy = performance_variance
            agent.gpu_hours_verified = total_gpu_hours
            agent.last_active_at = datetime.datetime.utcnow()
            agent.sync_pending = True # Flag for Async Oracle Worker
            
            db.commit()

            return scores

        finally:
            db.close()

    def process_telemetry_batch(self, agent_address: str, events: list):
        """
        Processes a batch of telemetry events (HGI signals).
        """
        db = SessionLocal()
        try:
            agent = db.query(Agent).filter(Agent.eth_address == agent_address).first()
            if not agent:
                agent = Agent(eth_address=agent_address)
                db.add(agent)
                db.commit()
                db.refresh(agent)

            telemetry_entries = []
            for e in events:
                new_entry = TelemetryLog(
                    agent_id=agent.agent_id,
                    event_type=e.get('event_type', 'inference'),
                    latency_ms=e.get('latency_ms', 0),
                    tokens_in=e.get('tokens_in', 0),
                    tokens_out=e.get('tokens_out', 0),
                    was_intervened=e.get('was_intervened', False),
                    intervention_depth=e.get('intervention_depth', 0.0),
                    model=e.get('model'),
                    event_metadata=e.get('metadata')
                )
                telemetry_entries.append(new_entry)
            
            db.bulk_save_objects(telemetry_entries)
            db.commit()

            # Trigger a score recalculation after telemetry ingestion
            history = db.query(TelemetryLog).filter(TelemetryLog.agent_id == agent.agent_id).limit(100).all()
            hgi_raw = self.verifier.calculate_human_grounding_index([
                {
                    "was_intervened": h.was_intervened,
                    "intervention_depth": float(h.intervention_depth),
                    "response_time_ms": h.latency_ms
                } for h in history
            ])

            # Also need current transaction history for entropy
            tx_history = db.query(TransactionLog).filter(TransactionLog.agent_id == agent.agent_id).limit(100).all()
            latencies = [t.completion_time_ms for t in tx_history]
            accuracies = [float(t.data_quality_score) for t in tx_history]
            performance_entropy = self.verifier.calculate_performance_entropy(latencies, accuracies)

            # Recalculate AIS
            days_since_active = (datetime.datetime.utcnow().replace(tzinfo=None) - agent.last_active_at.replace(tzinfo=None)).total_seconds() / 86400
            scores = self.scorer.calculate_ais(
                avg_partner_ais=500,
                xibalba_audit_score=1.0,
                gpu_hours_verified=float(agent.gpu_hours_verified),
                hgi_raw=hgi_raw,
                performance_variance=performance_entropy,
                staked_ratio=0.5,
                agent_age_days=(datetime.datetime.utcnow().replace(tzinfo=None) - agent.registration_date.replace(tzinfo=None)).days + 1,
                total_volume_intg=float(len(tx_history)),
                days_since_active=days_since_active,
                penalty_points=float(agent.penalty_points),
                verification_tier=agent.verification_tier
            )

            agent.current_ais = scores["integrity_score"]
            agent.grounding_score = scores["grounding_score"]
            agent.performance_entropy = performance_entropy
            agent.last_active_at = datetime.datetime.utcnow()
            agent.sync_pending = True # Flag for Async Oracle Worker
            db.commit()

            return scores
        finally:
            db.close()
