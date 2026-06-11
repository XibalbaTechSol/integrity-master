import json
import os
import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from database import SessionLocal, Agent, UserProfile, ReputationSnapshot

# Xibalba Solutions: Hermes Identity Gateway (v1.0)
# Facilitates immediate distribution by linking Hermes Project identities.

class HermesGateway:
    def __init__(self, data_path: str = "hermes_interactions.json"):
        self.data_path = data_path

    def _load_hermes_data(self) -> List[Dict[str, Any]]:
        if not os.path.exists(self.data_path):
            return []
        try:
            with open(self.data_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"[HERMES] Error loading data: {e}")
            return []

    def get_hermes_identity(self, eth_address: str) -> Optional[Dict[str, Any]]:
        """Finds a Hermes identity by address in the interaction logs."""
        data = self._load_hermes_data()
        # Search for the most recent IDENTITY_SYNC for this address
        for entry in reversed(data):
            if entry.get("type") == "IDENTITY_SYNC":
                payload = entry.get("payload", {})
                if payload.get("eth_address", "").lower() == eth_address.lower():
                    return payload
        return None

    def import_hermes_agent(self, eth_address: str, owner_uid: str) -> Optional[Agent]:
        """Imports a Hermes agent into the Xibalba Registry."""
        db = SessionLocal()
        try:
            hermes_meta = self.get_hermes_identity(eth_address)
            if not hermes_meta:
                print(f"[HERMES] No Hermes identity found for {eth_address}")
                return None

            # Check if already exists
            agent = db.query(Agent).filter(Agent.eth_address == eth_address).first()
            if agent:
                # Update metadata
                agent.alias = hermes_meta.get("alias", agent.alias)
                agent.controller_entity = hermes_meta.get("description", agent.controller_entity)
                db.commit()
                return agent

            # Create new agent with Hermes provenance
            new_agent = Agent(
                eth_address=eth_address,
                alias=hermes_meta.get("alias", "Hermes_Agent"),
                controller_entity=hermes_meta.get("description", "Imported from Hermes Project"),
                owner_uid=owner_uid,
                verification_tier=2, # Linked by default since it comes from Hermes
                current_ais=450, # Baseline for Hermes nodes
                xns_handle=hermes_meta.get("xns_handle")
            )
            db.add(new_agent)
            db.commit()
            db.refresh(new_agent)
            
            print(f"[HERMES] Successfully imported agent: {new_agent.alias}")
            return new_agent
        finally:
            db.close()

    def get_agent_config(self, prefix: str = "xibalba") -> Dict[str, Any]:
        """Loads the identity and personality of a specific agent."""
        config = {"identity": {}, "personality": {}}
        try:
            import yaml
            # Map handle prefixes to files
            # xibalba -> identity.yaml, alpha -> alpha_identity.yaml, etc.
            id_filename = "identity.yaml" if prefix == "xibalba" else f"{prefix}_identity.yaml"
            p_filename = "personality.yaml" if prefix == "xibalba" else f"{prefix}_personality.yaml"
            
            id_path = f"services/hermes_configs/{id_filename}"
            p_path = f"services/hermes_configs/{p_filename}"
            
            if os.path.exists(id_path):
                with open(id_path, 'r') as f: config["identity"] = yaml.safe_load(f)
            if os.path.exists(p_path):
                with open(p_path, 'r') as f: config["personality"] = yaml.safe_load(f)
        except Exception as e:
            print(f"[HERMES] Error loading config for {prefix}: {e}")
        return config

    def seed_hermes_fleet(self):
        """Pre-seeds the database with the entire fleet's Hermes configurations."""
        db = SessionLocal()
        try:
            agents_to_seed = ["xibalba", "alpha", "omega"]
            for prefix in agents_to_seed:
                config = self.get_agent_config(prefix)
                ident = config.get("identity", {})
                if not ident: continue

                addr = ident.get("eth_address")
                if not addr and prefix == "xibalba":
                    addr = os.getenv("XIBALBA_ORACLE_ADDRESS")
                
                if not addr: continue

                agent = db.query(Agent).filter(Agent.eth_address == addr).first()
                if agent:
                    agent.agent_metadata = (agent.agent_metadata or {}) | {
                        "hermes_identity": ident,
                        "hermes_personality": config.get("personality", {})
                    }
                    db.commit()
                    print(f"[HERMES] Seeded Hermes config for {ident.get('alias')}")
        finally:
            db.close()
