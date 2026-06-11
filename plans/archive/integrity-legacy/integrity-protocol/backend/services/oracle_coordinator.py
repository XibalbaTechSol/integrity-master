import hashlib
import time
from typing import List, Dict, Any

# Xibalba Solutions: Multi-Oracle Consensus Coordinator (v1.0)
# This service aggregates AIS attestations from multiple nodes.

class MultiOracleCoordinator:
    def __init__(self, threshold: int = 2):
        self.threshold = threshold
        # In-memory storage for pending attestations (agent_address -> [attestations])
        self.pending_attestations: Dict[str, List[Dict[str, Any]]] = {}

    def submit_attestation(self, 
                          oracle_address: str, 
                          agent_address: str, 
                          ais_score: int, 
                          tier: int,
                          signature: str) -> Dict[str, Any]:
        """
        Submits an AIS attestation from an authorized oracle node.
        If the threshold of matching attestations is met, the AIS is finalized.
        """
        if agent_address not in self.pending_attestations:
            self.pending_attestations[agent_address] = []
        
        attestation = {
            "oracle": oracle_address,
            "ais": ais_score,
            "tier": tier,
            "sig": signature,
            "timestamp": time.time()
        }
        
        self.pending_attestations[agent_address].append(attestation)
        
        # Check for consensus
        matching_count = sum(1 for a in self.pending_attestations[agent_address] 
                             if a["ais"] == ais_score and a["tier"] == tier)
        
        if matching_count >= self.threshold:
            # Consensus reached
            # Trigger on-chain update
            try:
                from blockchain_service import IntegrityBlockchainService
                blockchain = IntegrityBlockchainService()
                blockchain.update_ais_on_chain(agent_address, ais_score, tier)
                print(f"[CONSENSUS] Anchored AIS {ais_score} for {agent_address} on-chain.")
            except Exception as e:
                print(f"[CONSENSUS] Failed to anchor on-chain: {e}")

            self.pending_attestations[agent_address] = [] # Clear
            return {
                "status": "CONSENSUS_REACHED",
                "final_ais": ais_score,
                "attestations": matching_count
            }
        
        return {
            "status": "PENDING_CONSENSUS",
            "current_count": matching_count,
            "required": self.threshold
        }

    def get_noir_public_inputs(self, agent_address: str, ais_score: int) -> Dict[str, Any]:
        """
        Generates the public input set for the Noir ZK-Reputation Circuit.
        """
        return {
            "ais_threshold": 800, # Default for high-trust
            "max_risk_days": 30,
            "agent_address": agent_address,
            "state_root": "0x" + hashlib.sha256(str(ais_score).encode()).hexdigest()[:64]
        }
