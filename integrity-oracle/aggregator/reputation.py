import numpy as np
import hashlib
from typing import List, Dict

class ReputationAggregator:
    """
    Oracle logic to aggregate monthly telemetry into a single Integrity Score (0-1000).
    Computes a weighted average of the 7 Composite Signals.
    """
    
    # Weights for the 7 composite signals (must sum to 1.0)
    WEIGHTS = {
        "recon_risk": 0.20,
        "compute_spoof_risk": 0.15,
        "cognitive_fatigue": 0.10,
        "lateral_movement_prob": 0.20,
        "energy_efficiency": 0.05,
        "semantic_contradiction": 0.20,
        "blast_radius": 0.10
    }

    def aggregate(self, agent_telemetry_batch: List[Dict[str, float]]) -> int:
        """Aggregates a month of raw signals into a 0-1000 score."""
        if not agent_telemetry_batch:
            return 1000 # Default perfect score
            
        # 1. Calculate Mean of each signal across the batch
        avg_signals = {sig: 0.0 for sig in self.WEIGHTS.keys()}
        for entry in agent_telemetry_batch:
            for sig in avg_signals:
                avg_signals[sig] += entry.get(sig, 0.0)
        
        for sig in avg_signals:
            avg_signals[sig] /= len(agent_telemetry_batch)
            
        # 2. Compute Weighted Risk Score (0.0 to 1.0)
        risk_score = sum(avg_signals[sig] * self.WEIGHTS[sig] for sig in self.WEIGHTS)
        
        # 3. Convert to Integrity Score (1000 = safe, 0 = high risk)
        integrity_score = int(1000 * (1.0 - risk_score))
        return max(min(integrity_score, 1000), 0)

    def generate_proof_hash(self, agent_did: str, epoch: int, score: int) -> bytes:
        """Generates a pseudo-hash representing the ZK proof bundle of the aggregation."""
        data = f"{agent_did}:{epoch}:{score}".encode()
        return hashlib.sha256(data).digest()
