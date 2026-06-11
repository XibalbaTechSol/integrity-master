import hashlib
import json
import datetime
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from .database import Agent

# Xibalba Solutions: ZK-Compatible Merkle Service (v2.0)
# This service builds Merkle trees compatible with Noir ZK-SNARK circuits.
# Leaf: PedersenHash(agent_address, ais_score, last_slash_days)

class MerkleService:
    TREE_DEPTH = 16 # Matches Noir reputation circuit

    @staticmethod
    def calculate_reputation_root(db: Session) -> str:
        """
        Calculates the Merkle Root of all active agent reputation states.
        Uses fixed-depth and Pedersen hashing (mocked).
        """
        agents = db.query(Agent).filter(Agent.is_active == True).order_by(Agent.eth_address).all()
        
        leaves = []
        for agent in agents:
            # Calculate last_slash_days
            days = 365 # Default to 1 year if never slashed
            if agent.last_slash_date:
                delta = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc) - agent.last_slash_date
                days = delta.days
            
            # Construct leaf according to Noir spec:
            # let leaf = std::hash::pedersen_hash([agent_address, ais_score, last_slash_days]);
            leaf_hash = MerkleService.pedersen_hash([
                agent.eth_address.lower(),
                int(agent.current_ais),
                int(days)
            ])
            leaves.append(leaf_hash)
            
        if not leaves:
            # Minimal tree with dummy leaf
            leaves = [MerkleService.pedersen_hash(["0x0", 0, 0])]
            
        return MerkleService._build_tree(leaves, depth=MerkleService.TREE_DEPTH)

    @staticmethod
    def pedersen_hash(inputs: List[Any]) -> str:
        """
        Institutional-grade Pedersen Hashing (Placeholder).
        In production, this calls the barretenberg backend.
        """
        # Canonicalize inputs
        src = "|".join(str(i) for i in inputs)
        return hashlib.sha256(src.encode()).hexdigest()

    @staticmethod
    def _build_tree(leaves: List[str], depth: int) -> str:
        """
        Fixed-depth Merkle Tree construction.
        Empty slots are filled with a deterministic 'zero-leaf'.
        """
        nodes = leaves
        zero_leaf = hashlib.sha256(b"xibalba_zero_leaf").hexdigest()
        
        # Pad to reach 2^depth leaves
        target_len = 2**depth
        while len(nodes) < target_len:
            nodes.append(zero_leaf)
            
        # Build levels
        current_level = nodes
        for _ in range(depth):
            next_level = []
            for i in range(0, len(current_level), 2):
                combined = current_level[i] + current_level[i+1]
                parent = hashlib.sha256(combined.encode()).hexdigest()
                next_level.append(parent)
            current_level = next_level
            
        return current_level[0]

    @staticmethod
    def get_merkle_proof(db: Session, agent_address: str) -> Dict[str, Any]:
        """
        Generates a Merkle Proof (path + index) for a specific agent.
        """
        agents = db.query(Agent).filter(Agent.is_active == True).order_by(Agent.eth_address).all()
        
        leaves = []
        target_index = -1
        target_agent = None
        
        for idx, agent in enumerate(agents):
            days = 365
            if agent.last_slash_date:
                delta = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc) - agent.last_slash_date
                days = delta.days
                
            leaf = MerkleService.pedersen_hash([agent.eth_address.lower(), int(agent.current_ais), int(days)])
            leaves.append(leaf)
            
            if agent.eth_address.lower() == agent_address.lower():
                target_index = idx
                target_agent = agent

        if target_index == -1:
            return {"error": "Agent not found or inactive"}

        # Pad to 2^16
        zero_leaf = hashlib.sha256(b"xibalba_zero_leaf").hexdigest()
        while len(leaves) < 2**MerkleService.TREE_DEPTH:
            leaves.append(zero_leaf)

        # Build proof path
        path = []
        idx = target_index
        current_level = leaves
        
        for _ in range(MerkleService.TREE_DEPTH):
            # i ^ 1 gives the sibling index (0->1, 1->0, 2->3, 3->2)
            sibling_idx = idx ^ 1
            path.append(current_level[sibling_idx])
            
            # Move to next level
            next_level = []
            for i in range(0, len(current_level), 2):
                combined = current_level[i] + current_level[i+1]
                parent = hashlib.sha256(combined.encode()).hexdigest()
                next_level.append(parent)
            current_level = next_level
            idx //= 2

        return {
            "agent_address": agent_address,
            "ais_score": int(target_agent.current_ais),
            "merkle_index": target_index,
            "merkle_path": path,
            "state_root": current_level[0]
        }
