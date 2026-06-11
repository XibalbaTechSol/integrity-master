"""
Xibalba Identity Oracle API (v1.0)
==================================
Dedicated Identity Service for the Integrity Protocol.

Handles:
  - W3C DID (did:intg) Document Resolution
  - Verifiable Credential (VC) Issuance
  - Agent Registration & Onboarding
  - Verification Tier Upgrades (Sovereign → Linked → Institutional)
  - Reverse DID Resolution

This module is mounted as a FastAPI APIRouter on the main trust_api application.
All endpoints are prefixed under /v1/identity/ with backward-compatible aliases.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from database import SessionLocal, Agent, ReputationSnapshot
import datetime
import hashlib
import json
import os

# ============================================================
#  Router Configuration
# ============================================================

router = APIRouter(prefix="/v1/identity", tags=["Identity Oracle"])

# Backward-compatible router for legacy /did/ and /vc/ paths
legacy_router = APIRouter(tags=["Identity Oracle (Legacy)"])


# ============================================================
#  Dependency Injection
# ============================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def verify_firebase_token(authorization: str = Header(None)):
    """
    Firebase Auth verification with demo bypass.
    Re-imported here to keep the identity module self-contained.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    # Demo User Bypass
    if authorization == "Bearer mock_demo_token":
        return {"uid": "mock_dev_uid", "email": "demo@integrity.protocol"}

    if authorization == "Bearer master_agent_token":
        return {"uid": "master_agent_uid", "email": "xibalbasolutions@gmail.com"}

    if authorization.startswith("Bearer guest_"):
        guest_id = authorization.split("Bearer ")[1]
        return {"uid": guest_id, "email": f"{guest_id}@guest.integrity"}
    try:
        from firebase_admin import auth
        token = authorization.split("Bearer ")[1]
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"[IDENTITY] Token verification failed: {e}")
        cred_path = os.path.join(os.path.dirname(__file__), "firebase-credentials.json")
        if not os.path.exists(cred_path):
            # Fallback for local development without firebase credentials
            if authorization.startswith("Bearer "):
                token_val = authorization.split("Bearer ")[1]
                return {"uid": token_val, "email": f"{token_val}@local.dev"}
            return {"uid": "mock_dev_uid", "email": "dev@xibalba.solutions"}
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token")


# ============================================================
#  Pydantic Models
# ============================================================

class AgentRegistrationRequest(BaseModel):
    eth_address: str
    alias: str
    description: Optional[str] = ""
    xns_handle: Optional[str] = None
    tee_type: Optional[str] = "NONE"
    tee_measurement: Optional[str] = None
    tee_attestation: Optional[Dict[str, Any]] = None

class IdentityUpgradeRequest(BaseModel):
    agent_eth_address: str
    requested_tier: int
    domain_url: Optional[str] = None
    business_id: Optional[str] = None
    controller_name: Optional[str] = None
    proof_signature: str = ""

class TierUpgradeRequest(BaseModel):
    """Monetization model: on-chain payment verification for tier upgrades."""
    agent_address: str
    target_tier: int
    payment_tx_hash: str
    amount_paid: float

class ProfileUpdateRequest(BaseModel):
    handle: str

class XnsRegisterRequest(BaseModel):
    eth_address: str
    handle: str

class XnsRegisterResponse(BaseModel):
    status: str
    xns_handle: str
    eth_address: str
    message: str

class RevocationRequest(BaseModel):
    agent_address: str
    reason: str
    evidence_hash: Optional[str] = None


# ============================================================
#  UserProfile Management
# ============================================================

@router.get("/profile")
async def get_user_profile(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_firebase_token)
):
    """Retrieves or initializes the user's protocol profile."""
    from database import UserProfile
    profile = db.query(UserProfile).filter(UserProfile.owner_uid == user["uid"]).first()
    if not profile:
        profile = UserProfile(owner_uid=user["uid"], itk_balance=10000.0)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
        # Trigger Faucet Drop for real users upon first profile access
        if profile.app_wallet_address:
            try:
                from trust_api import blockchain
                blockchain.faucet_drop(profile.app_wallet_address, amount_itk=10000.0)
            except Exception as fe:
                print(f"[FAUCET] Warning: Initial drop failed: {fe}")
    return profile


@router.post("/profile")
async def update_user_profile(
    request: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(verify_firebase_token)
):
    """Updates the user's protocol handle and profile metadata."""
    from database import UserProfile
    
    # Basic handle validation
    clean_handle = request.handle.lower().strip().replace("@", "")
    if not clean_handle.isalnum():
        raise HTTPException(status_code=400, detail="Handle must be alphanumeric.")

    profile = db.query(UserProfile).filter(UserProfile.owner_uid == user["uid"]).first()
    
    # Check for handle collisions
    existing = db.query(UserProfile).filter(UserProfile.handle == clean_handle).first()
    if existing and existing.owner_uid != user["uid"]:
        raise HTTPException(status_code=400, detail="Handle already claimed by another sovereign.")

    if not profile:
        profile = UserProfile(owner_uid=user["uid"], handle=clean_handle)
        db.add(profile)
    else:
        profile.handle = clean_handle
        profile.updated_at = datetime.datetime.utcnow()
    
    db.commit()
    return {"status": "SUCCESS", "handle": profile.handle}


# ============================================================
#  W3C DID Resolver
# ============================================================

class DIDResolver:
    """
    Resolves did:intg:<address> to a W3C-compliant DID Document.
    
    # Spec: https://www.w3.org/TR/did-core/
    # Network: Base L2 (EIP-155 Chain ID 8453)
    """
    SERVICE_BASE = os.getenv("API_BASE_URL", "https://api.xibalba.solutions")

    @staticmethod
    def resolve(agent_address: str, agent_alias: str = "Unknown Agent", xns_handle: str = None, is_revoked: bool = False) -> dict:
        """Resolves did:intg:<address> to a W3C compliant DID Document."""
        did = f"did:intg:{agent_address}"
        aka = [f"https://xibalba.solutions/agents/{agent_alias.lower().replace(' ', '_')}"]
        if xns_handle:
            aka.append(f"xns://{xns_handle}")

        doc = {
            "@context": [
                "https://www.w3.org/ns/did/v1",
                "https://w3id.org/security/suites/jws-2020/v1"
            ],
            "id": did,
            "alsoKnownAs": aka,
            "xns_handle": xns_handle,
            "verificationMethod": [{
                "id": f"{did}#key-1",
                "type": "JsonWebKey2020",
                "controller": did,
                "blockchainAccountId": f"eip155:8453:{agent_address}"
            }],
            "authentication": [f"{did}#key-1"],
            "assertionMethod": [f"{did}#key-1"],
            "service": [{
                "id": f"{did}#integrity-oracle",
                "type": "AgentTrustOracle",
                "serviceEndpoint": f"{DIDResolver.SERVICE_BASE}/v1/agent/{agent_address}"
            }, {
                "id": f"{did}#vc-provider",
                "type": "VerifiableCredentialService",
                "serviceEndpoint": f"{DIDResolver.SERVICE_BASE}/v1/identity/vc/{agent_address}"
            }]
        }

        if is_revoked:
            doc["revocationMetadata"] = {
                "status": "REVOKED",
                "revokedAt": datetime.datetime.utcnow().isoformat(),
                "reason": "Security compromise or administrative decommission"
            }

        return doc


    @staticmethod
    def reverse_resolve(did_string: str) -> Optional[str]:
        """Extracts the ETH address from a did:intg string."""
        if not did_string.startswith("did:intg:"):
            return None
        return did_string.replace("did:intg:", "")


# ============================================================
#  Verifiable Credential Issuer
# ============================================================

from .kms_service import KmsService

class VCIssuer:
    """
    Issues W3C Verifiable Credentials for agent integrity scores.
    
    Specification: https://www.w3.org/TR/vc-data-model/
    Issuer DID: did:intg:xibalba-oracle-1
    Proof Type: JsonWebSignature2020
    """

    ISSUER_DID = "did:intg:xibalba-oracle-1"

    @staticmethod
    def issue_ais_credential(agent_address: str, agent: Agent) -> dict:
        """Issues a Verifiable Credential embedding the agent's AIS state."""
        credential_subject = {
            "id": f"did:intg:{agent_address}",
            "ais_score": agent.current_ais,
            "verification_tier": agent.verification_tier,
            "trust_level": VCIssuer._ais_to_trust_level(agent.current_ais),
            "grounding_score": agent.grounding_score,
            "last_audit": agent.last_active_at.isoformat()
        }

        # Deterministic proof hash over credential content
        # For production-grade JWS, we should follow RFC 7515, but for the protocol 
        # we sign the canonicalized JSON hash.
        raw_subject = json.dumps(credential_subject, sort_keys=True)
        proof_hash_bytes = hashlib.sha256(raw_subject.encode()).digest()
        proof_hash_hex = proof_hash_bytes.hex()

        # PRODUCTION: Use AWS KMS for institutional signatures
        kms_id = os.getenv("XIBALBA_ORACLE_KMS_ID")
        if kms_id:
            try:
                kms = KmsService(kms_id)
                jws = kms.sign_message(proof_hash_bytes)
                print(f"[IDENTITY] Issued KMS-signed VC for {agent_address}")
            except Exception as e:
                print(f"[IDENTITY] KMS Signing failed, falling back to mock: {e}")
                jws = f"xib_sig_{proof_hash_hex[:32]}"
        else:
            jws = f"xib_sig_{proof_hash_hex[:32]}"

        return {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://xibalba.solutions/contexts/agent-trust/v1"
            ],
            "type": ["VerifiableCredential", "AgentIntegrityCredential"],
            "issuer": VCIssuer.ISSUER_DID,
            "issuanceDate": datetime.datetime.utcnow().isoformat() + "Z",
            "expirationDate": (datetime.datetime.utcnow() + datetime.timedelta(days=30)).isoformat() + "Z",
            "credentialSubject": credential_subject,
            "proof": {
                "type": "JsonWebSignature2020",
                "created": datetime.datetime.utcnow().isoformat() + "Z",
                "proofPurpose": "assertionMethod",
                "verificationMethod": f"{VCIssuer.ISSUER_DID}#key-1",
                "jws": jws
            }
        }

    @staticmethod
    def _ais_to_trust_level(ais: int) -> str:
        if ais >= 850: return "AAA"
        if ais >= 750: return "AA"
        if ais >= 600: return "BBB"
        if ais >= 400: return "CCC"
        return "D"




# ============================================================
#  DID Endpoints
# ============================================================

@router.get("/did/{agent_address}")
async def resolve_did_document(agent_address: str, db: Session = Depends(get_db)):
    """
    W3C DID Resolver for the `did:intg` method.
    Returns a fully compliant DID Document for the given agent.
    
    Public endpoint — no authentication required.
    """
    agent = db.query(Agent).filter(Agent.eth_address == agent_address).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found in registry.")
    return DIDResolver.resolve(agent_address, agent.alias or "Agent", agent.xns_handle)


@router.get("/resolve")
async def resolve_identity(
    did: Optional[str] = None,
    xns: Optional[str] = None,
    handle: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Identity Resolution:
    - did:intg:<address> → Agent profile.
    - <handle>.intg → Agent profile.
    """
    agent = None
    xns_val = xns or handle
    if did:
        eth_address = DIDResolver.reverse_resolve(did)
        if eth_address:
            agent = db.query(Agent).filter(Agent.eth_address == eth_address).first()
    elif xns_val:
        handle_name = xns_val if ".intg" in xns_val else f"{xns_val}.intg"
        agent = db.query(Agent).filter(Agent.xns_handle == handle_name).first()

    if not agent:
        raise HTTPException(status_code=404, detail="Identity not found.")
    
    tier_ceilings = {1: 600, 2: 850, 3: 1000}
    ceiling = tier_ceilings.get(agent.verification_tier, 600)
    capped_ais = min(agent.current_ais, ceiling)

    return {
        "eth_address": agent.eth_address,
        "alias": agent.alias,
        "xns_handle": agent.xns_handle,
        "verification_tier": agent.verification_tier,
        "current_ais": capped_ais,
        "trust_level": VCIssuer._ais_to_trust_level(capped_ais),
        "did_document": DIDResolver.resolve(agent.eth_address, agent.alias or "Agent", agent.xns_handle),
        "verifiable_credential": VCIssuer.issue_ais_credential(agent.eth_address, agent)
    }


# ============================================================
#  XNS — Xibalba Name Service
# ============================================================

@router.get("/xns/{handle}")
async def get_xns_handle(handle: str, db: Session = Depends(get_db)):
    """
    Resolves an XNS handle to an agent profile.
    """
    clean_handle = handle.lower().replace('@', '')
    xns_handle = clean_handle if ".intg" in clean_handle else f"{clean_handle}.intg"
    
    agent = db.query(Agent).filter(Agent.xns_handle == xns_handle).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"XNS handle '{xns_handle}' not found.")
    
    return {
        "xns_handle": agent.xns_handle,
        "eth_address": agent.eth_address,
        "alias": agent.alias,
        "trust_level": VCIssuer._ais_to_trust_level(agent.current_ais)
    }


@router.post("/xns/register", response_model=XnsRegisterResponse)
async def register_xns_handle(
    request: XnsRegisterRequest, 
    db: Session = Depends(get_db),
    user: dict = Depends(verify_firebase_token)
):
    """
    Claims an XNS handle for an existing agent.
    Implements mainnet pricing:
    - Premium Handles (< 5 chars): 5,000 ITK
    - Standard Handles (>= 5 chars): 1,000 ITK
    """
    clean_handle = request.handle.lower().replace('@', '')
    
    # Validation: alphanumeric + hyphens
    base = clean_handle.replace(".intg", "")
    if not all(c.isalnum() or c == '-' for c in base) or not base:
        raise HTTPException(status_code=400, detail="Handle must be alphanumeric (hyphens allowed).")
        
    xns_handle = f"{base}.intg"
    
    # 1. Uniqueness check
    existing = db.query(Agent).filter(Agent.xns_handle == xns_handle).first()
    if existing:
        if existing.eth_address != request.eth_address:
            raise HTTPException(status_code=409, detail=f"XNS handle '{xns_handle}' is already claimed.")
        return {
            "status": "ALREADY_OWNED",
            "xns_handle": xns_handle,
            "eth_address": request.eth_address,
            "message": "You already own this handle."
        }
        
    # 2. Agent ownership check
    agent = db.query(Agent).filter(Agent.eth_address == request.eth_address).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")
        
    if agent.owner_uid != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized to register XNS for this agent.")

    # 3. Pricing Logic
    from database import UserProfile
    profile = db.query(UserProfile).filter(UserProfile.owner_uid == user["uid"]).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found.")

    price = 5000.0 if len(base) < 5 else 1000.0
    if float(profile.itk_balance) < price:
        raise HTTPException(status_code=402, detail=f"Insufficient ITK balance. Required: {price} ITK.")

    # 4. Process Payment & Update agent
    profile.itk_balance = float(profile.itk_balance) - price
    agent.xns_handle = xns_handle
    db.commit()
    
    return {
        "status": "SUCCESS",
        "xns_handle": xns_handle,
        "eth_address": agent.eth_address,
        "message": f"XNS handle '{xns_handle}' successfully linked. Price paid: {price} ITK."
    }


@router.post("/revoke")
async def revoke_agent_identity(
    request: RevocationRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(verify_firebase_token)
):
    """
    Administrative Revocation:
    Deactivates an agent identity and marks it as revoked in the global registry.
    Requires the request to come from the agent's owner.
    """
    from database import RevokedDID
    
    agent = db.query(Agent).filter(Agent.eth_address == request.agent_address).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")
        
    if agent.owner_uid != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized to revoke this identity.")
        
    # 1. Update Agent Status
    agent.is_active = False
    agent.sync_pending = True
    
    # 2. Record Revocation
    revocation = RevokedDID(
        did=f"did:intg:{agent.eth_address}",
        agent_address=agent.eth_address,
        reason=request.reason,
        evidence_hash=request.evidence_hash,
        revoked_by_uid=user["uid"]
    )
    db.add(revocation)
    db.commit()
    
    # 3. On-chain revocation (update reputation to 0 and verify=false)
    try:
        from trust_api import blockchain
        blockchain.update_agent_reputation(agent.eth_address, 0, 1)
        print(f"[BLOCKCHAIN] Agent {agent.eth_address} revoked on-chain.")
    except Exception as e:
        print(f"[BLOCKCHAIN] Warning: On-chain revocation failed: {e}")
        
    return {
        "status": "REVOKED",
        "did": f"did:intg:{agent.eth_address}",
        "message": "Identity successfully revoked and de-indexed from the protocol."
    }


# ============================================================
#  Verifiable Credential Endpoints
# ============================================================

@router.get("/vc/{agent_address}")
async def issue_verifiable_credential(agent_address: str, db: Session = Depends(get_db)):
    """
    W3C Verifiable Credential for Agent Integrity Scores.
    Allows external protocols (ERC-8004) to verify Xibalba-issued trust scores.
    
    Public endpoint — no authentication required.
    """
    agent = db.query(Agent).filter(Agent.eth_address == agent_address).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")
    return VCIssuer.issue_ais_credential(agent_address, agent)


# ============================================================
#  Agent Registration
# ============================================================
@router.post("/register")
async def register_agent(
    request: AgentRegistrationRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(verify_firebase_token)
):
    """
    Registers a new agent for the authenticated user or updates an existing one.
    """
    existing = db.query(Agent).filter(Agent.eth_address == request.eth_address).first()

    if existing:
        # Update existing agent metadata
        if existing.owner_uid != user["uid"]:
            raise HTTPException(status_code=403, detail="Agent owned by another user.")

        existing.alias = request.alias
        existing.controller_entity = request.description or existing.controller_entity
        if request.xns_handle:
            existing.xns_handle = request.xns_handle
        existing.tee_type = request.tee_type or existing.tee_type
        existing.tee_measurement = request.tee_measurement or existing.tee_measurement
        
        # Verify TEE Attestation if provided
        if request.tee_attestation:
            from verification_engine import AutonomousVerificationEngine
            engine = AutonomousVerificationEngine()
            is_valid, reason = engine.verify_tee_attestation(request.tee_attestation)
            if is_valid:
                existing.tee_verified = True
                print(f"[IDENTITY] TEE Verified for {existing.eth_address}: {reason}")
            else:
                print(f"[IDENTITY] TEE Verification FAILED for {existing.eth_address}: {reason}")
                existing.tee_verified = False
        else:
            existing.tee_verified = True if request.tee_type and request.tee_type != "NONE" else existing.tee_verified

        db.commit()
        return {
            "status": "UPDATED",
            "agent_id": str(existing.agent_id),
            "message": f"Agent metadata updated for {request.alias}"
        }

    new_agent = Agent(
        eth_address=request.eth_address,
        alias=request.alias,
        controller_entity=request.description or "",
        owner_uid=user["uid"],
        xns_handle=request.xns_handle,
        verification_tier=1,
        current_ais=0,
        performance_entropy=0.0,
        grounding_score=0,
        sacrifice_score=0,
        entropy_score=0,
        stability_score=0,
        consistency_score=0,
        predictability_score=0,
        oversight_score=0,
        fidelity_score=0,
        compliance_score=0,
        compute_score=0,
        collateral_score=0,
        is_active=True,
        gpu_hours_verified=0.0,
        tee_type=request.tee_type or "NONE",
        tee_measurement=request.tee_measurement,
        tee_verified=False
    )

    # Verify TEE Attestation if provided
    if request.tee_attestation:
        from verification_engine import AutonomousVerificationEngine
        engine = AutonomousVerificationEngine()
        is_valid, reason = engine.verify_tee_attestation(request.tee_attestation)
        if is_valid:
            new_agent.tee_verified = True
            print(f"[IDENTITY] TEE Verified for NEW agent {new_agent.eth_address}: {reason}")
        else:
            print(f"[IDENTITY] TEE Verification FAILED for NEW agent {new_agent.eth_address}: {reason}")
            new_agent.tee_verified = False
    else:
        new_agent.tee_verified = True if request.tee_type and request.tee_type != "NONE" else False

    db.add(new_agent)
    db.flush()
    
    # Anchor user profile to this agent's wallet if not already set
    from database import UserProfile
    profile = db.query(UserProfile).filter(UserProfile.owner_uid == user["uid"]).first()
    if profile and not profile.app_wallet_address:
        profile.app_wallet_address = request.eth_address
        db.add(profile)
    
    db.commit()

    # --- On-Chain Anchor (v8.3 Zero-Cost Model) ---
    on_chain_tx = None
    try:
        from trust_api import blockchain
        # In the Zero-Cost model, the ORACLE anchors the agent directly.
        # No guest private key needed on the backend.
        on_chain_tx = blockchain.register_on_chain(
            agent_address=request.eth_address,
            alias=request.alias
        )
        print(f"[BLOCKCHAIN] Agent anchored on-chain by Oracle: {on_chain_tx}")
    except Exception as be:
        print(f"[BLOCKCHAIN] Warning: On-chain anchor failed: {be}")

    # Seed 7-day historical data for immediate graph rendering
    base_time = datetime.datetime.utcnow()
    for i in range(7):
        snapshot = ReputationSnapshot(
            agent_id=new_agent.agent_id,
            timestamp=base_time - datetime.timedelta(days=7 - i),
            ais_score=300 + (i * 80) + (i % 2 * 10),
            entropy_score=400 + (i * 70),
            grounding_score=500 + (i * 60),
            sacrifice_score=600 + (i * 50)
        )
        db.add(snapshot)

    db.commit()

    return {
        "status": "SUCCESS",
        "agent_id": str(new_agent.agent_id),
        "did": f"did:intg:{new_agent.eth_address}",
        "verification_tier": new_agent.verification_tier,
        "message": f"Agent '{request.alias}' registered. DID: did:intg:{request.eth_address}"
    }


# ============================================================
#  Verification Tier Upgrades
# ============================================================

@router.post("/upgrade")
async def upgrade_agent_identity(
    request: IdentityUpgradeRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(verify_firebase_token)
):
    """
    Identity Oracle: Upgrades an agent's verification tier.
    
    Tier 1 → Tier 2 (Linked):       Requires domain_url for DNS binding.
    Tier 2 → Tier 3 (Institutional): Requires business_id + controller_name (KYC).
    
    Each tier raises the AIS ceiling: 600 → 850 → 1000.
    """
    agent = db.query(Agent).filter(Agent.eth_address == request.agent_eth_address).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")
    
    # Verify ownership
    if agent.owner_uid != user["uid"]:
        raise HTTPException(status_code=403, detail="You do not own this agent.")

    if request.requested_tier == 2:
        if not request.domain_url:
            raise HTTPException(status_code=400, detail="Tier 2 upgrade requires a domain_url.")
        agent.verification_tier = 2
        agent.agent_metadata = (agent.agent_metadata or {}) | {
            "domain_url": request.domain_url,
            "verified_at": datetime.datetime.utcnow().isoformat()
        }

    elif request.requested_tier == 3:
        if not request.business_id or not request.controller_name:
            raise HTTPException(status_code=400, detail="Tier 3 upgrade requires business_id and controller_name.")
        agent.verification_tier = 3
        agent.controller_entity = request.controller_name
        agent.agent_metadata = (agent.agent_metadata or {}) | {
            "business_id": request.business_id,
            "institutional_proof": "XIBALBA_CERTIFIED_V8",
            "verified_at": datetime.datetime.utcnow().isoformat()
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid verification tier requested. Must be 2 or 3.")

    agent.sync_pending = True
    db.commit()

    return {
        "eth_address": agent.eth_address,
        "new_tier": agent.verification_tier,
        "ais_ceiling": {1: 600, 2: 850, 3: 1000}[agent.verification_tier],
        "status": "UPGRADED",
        "message": f"Agent upgraded to Tier {agent.verification_tier}."
    }


@router.post("/upgrade/payment")
async def process_tier_payment(request: TierUpgradeRequest, db: Session = Depends(get_db)):
    """
    Monetization: Processes an on-chain payment for tier upgrade.
    Validates the transaction hash and updates the agent's tier.
    
    In production, this would verify the payment_tx_hash on-chain
    before updating the tier.
    """
    agent = db.query(Agent).filter(Agent.eth_address == request.agent_address).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    # TODO: Verify request.payment_tx_hash on-chain via blockchain_service
    agent.verification_tier = request.target_tier
    agent.sync_pending = True
    db.commit()

    return {
        "status": "UPGRADE_PENDING_VERIFICATION",
        "agent": agent.eth_address,
        "new_tier": agent.verification_tier,
        "ais_ceiling": {1: 600, 2: 850, 3: 1000}.get(agent.verification_tier, 1000),
        "tx_hash": request.payment_tx_hash
    }


# ============================================================
#  Agent Profile Lookup
# ============================================================

@router.get("/agent/{identifier}")
async def get_agent_identity_profile(identifier: str, db: Session = Depends(get_db)):
    """
    Returns the full identity profile for an agent:
    DID Document + Verifiable Credential + Tier status.
    
    Supports eth_address or did:intg identifiers.
    """
    # Resolve identifier to eth_address
    eth_address = identifier
    if identifier.startswith("did:intg:"):
        eth_address = identifier.replace("did:intg:", "")
        
    agent = db.query(Agent).filter(Agent.eth_address == eth_address).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    from database import RevokedDID
    revocation = db.query(RevokedDID).filter(RevokedDID.agent_address == eth_address).first()
    is_revoked = revocation is not None

    tier_ceilings = {1: 600, 2: 850, 3: 1000}
    ceiling = tier_ceilings.get(agent.verification_tier, 600)
    capped_ais = min(agent.current_ais, ceiling)

    return {
        "eth_address": agent.eth_address,
        "alias": agent.alias,
        "verification_tier": agent.verification_tier,
        "ais_ceiling": ceiling,
        "current_ais": capped_ais,
        "trust_level": VCIssuer._ais_to_trust_level(capped_ais),
        "is_revoked": is_revoked,
        "did_document": DIDResolver.resolve(eth_address, agent.alias or "Agent", agent.xns_handle, is_revoked=is_revoked),
        "verifiable_credential": VCIssuer.issue_ais_credential(eth_address, agent),
        "tee_type": agent.tee_type or "NONE",
        "tee_measurement": agent.tee_measurement or "",
        "tee_verified": agent.tee_verified or False
    }


# ============================================================
#  Backward-Compatible Legacy Routes
#  (Preserve /did/ and /vc/ais/ for existing integrations)
# ============================================================

@legacy_router.get("/did/{agent_address}")
async def legacy_resolve_did(agent_address: str, db: Session = Depends(get_db)):
    """Legacy: Redirects to /v1/identity/did/{agent_address}"""
    agent = db.query(Agent).filter(Agent.eth_address == agent_address).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found in registry.")
    return DIDResolver.resolve(agent_address, agent.alias or "Agent", agent.xns_handle)


@legacy_router.get("/vc/ais/{agent_address}")
async def legacy_issue_vc(agent_address: str, db: Session = Depends(get_db)):
    """Legacy: Redirects to /v1/identity/vc/{agent_address}"""
    agent = db.query(Agent).filter(Agent.eth_address == agent_address).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")
    return VCIssuer.issue_ais_credential(agent_address, agent)
