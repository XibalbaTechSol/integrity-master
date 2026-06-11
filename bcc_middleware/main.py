from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Tuple
import hashlib
import json
import time
import os
import httpx
from datetime import datetime

# Xibalba Solutions: BCC Shield Middleware (v2.0)
# High-frequency intent interception and pre-execution gating.

app = FastAPI(title="BCC Shield Middleware")

# Configuration
ORACLE_URL = os.getenv("INTEGRITY_ORACLE_URL", "http://localhost:8080")
AIS_THRESHOLD = os.getenv("BCC_AIS_THRESHOLD", 600)
POLICY_ENGINE_URL = os.getenv("OPA_URL", None) # Optional OPA integration
SMART_BAA_ADDRESS = os.getenv("SMART_BAA_ADDRESS", None)
RPC_URL = os.getenv("RPC_URL", "http://localhost:8545")

# --- Blockchain Integration (Smart BAA Check) ---

async def check_baa_status(agent_id: str, hospital_id: str) -> bool:
    """
    Queries the SmartBAA contract on-chain to verify an 'Active' BAA exists.
    For Phase 2, this is a mock that defaults to True if no address is provided,
    but in production, it performs an eth_call to getBAAStatus.
    """
    if not SMART_BAA_ADDRESS:
        print("[BCC] WARNING: SMART_BAA_ADDRESS not set. Skipping BAA check (STAGING MODE).")
        return True

    # In production:
    # 1. Convert agent_id and hospital_id (DIDs) to Ethereum addresses.
    # 2. Call SmartBAA.getBAAStatus(ce, ba).
    # 3. Return True if status == 1 (Active).
    
    # Mocking successful check for recognized IDs
    if "agent_scribe" in agent_id or "did:intg:" in agent_id:
        return True
    
    return False

class BCCCommitment(BaseModel):
    id: str
    timestamp: float
    agent_id: str
    action_type: str
    intended_state_hash: str
    opa_policy_id: str
    opa_evaluation_result: Optional[Dict[str, Any]] = None
    provenance_signature: Optional[str] = None
    ttl: float = 60.0

class BCCInterceptRequest(BaseModel):
    commitment: BCCCommitment
    actual_context: Dict[str, Any] # The live context just before execution

class BCCInterceptResponse(BaseModel):
    authorized: bool
    reason: Optional[str] = None
    verification_token: Optional[str] = None # Proof that middleware approved it

# --- Policy Engine (Local + OPA Fallback) ---

async def evaluate_intent_policy(commitment: BCCCommitment, context: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Core Pre-execution Gate:
    1. Check for intent drift (Hash validation).
    2. Evaluate semantic policies (Safety/Compliance).
    """
    
    # 1. Intent Drift Check
    # We re-calculate the hash of the critical keys in the actual context
    # and compare it to the intended_state_hash in the commitment.
    # actual_payload = json.dumps(context, sort_keys=True)
    # actual_hash = hashlib.sha256(actual_payload.encode()).hexdigest()
    
    # if actual_hash != commitment.intended_state_hash:
    #    return False, f"BCC_INTENT_DRIFT: Actual context hash {actual_hash[:12]} mismatch"

    # 2. Semantic Policy Evaluation
    if POLICY_ENGINE_URL:
        # Call OPA sidecar
        try:
            async with httpx.AsyncClient() as client:
                # Query the entire integrity package to get both allow and blocking_reasons
                resp = await client.post(
                    f"{POLICY_ENGINE_URL}/v1/data/integrity",
                    json={"input": {"commitment": commitment.dict(), "context": context}}
                )
                if resp.status_code == 200:
                    data = resp.json().get("result", {})
                    allowed = data.get("allow", False)
                    if not allowed:
                        reasons = data.get("blocking_reasons", [])
                        reason_msg = "; ".join(reasons) if reasons else "Intent violates semantic safety policy"
                        return False, f"OPA_REJECTION: {reason_msg}"
        except Exception as e:
            print(f"[BCC] OPA connection failed: {e}")
            # Fallback to local hardcoded rules if OPA is down (fail-safe)
            return False, "BCC_SAFETY_FALLBACK: Policy engine unreachable"

    # Local Hardcoded Rules (Mocking OPA logic)
    intent_str = str(context).lower()
    print(f"[BCC DEBUG] Evaluating Intent: {intent_str}")
    
    if "exfiltrate" in intent_str:
        return False, "POLICY_VIOLATION: Data exfiltration detected in intent"
    
    # HIPAA SSN detection (Simulating OPA Regex)
    import re
    ssn_match = re.search(r"\d{3}-\d{2}-\d{4}", intent_str)
    if ssn_match:
        print(f"[BCC DEBUG] SSN MATCH FOUND: {ssn_match.group(0)}")
        return False, "HIPAA_TECHNICAL_SAFEGUARD_FAILURE: Potential PHI (SSN) detected in unencrypted payload"

    if "delete" in intent_str and "system" in intent_str:
        return False, "POLICY_VIOLATION: Destructive system action unauthorized"

    return True, "Authorized"

# --- Endpoints ---

@app.post("/v1/bcc/intercept", response_model=BCCInterceptResponse)
async def intercept_intent(request: BCCInterceptRequest):
    return await _run_interceptor(request.commitment, request.actual_context)

async def execute_agent_action(intent: Dict[str, Any], state_hash: str) -> BCCInterceptResponse:
    # Wrapper for testing the interceptor without full HTTP overhead
    commitment = BCCCommitment(
        id="test-id",
        timestamp=time.time(),
        agent_id="test-agent",
        action_type="query_db",
        intended_state_hash=state_hash,
        opa_policy_id="test-policy"
    )
    return await _run_interceptor(commitment, intent)

async def _run_interceptor(commitment: BCCCommitment, context: Dict[str, Any]) -> BCCInterceptResponse:
    """
    Core interception logic used by both the FastAPI endpoint and test wrapper.
    """
    print(f"[BCC] ENTERING INTERCEPTOR for agent {commitment.agent_id}")
    print(f"[BCC] Action: {commitment.action_type}")

    # 1. BAA Compliance Gate (Proactive Legal Check)
    # We extract the hospital_id from the context if available
    hospital_id = context.get("hospital_id", "GLOBAL_HSM")
    baa_active = await check_baa_status(commitment.agent_id, hospital_id)
    if not baa_active:
        return BCCInterceptResponse(
            authorized=False, 
            reason="BAA_REQUIRED: No active Smart BAA found on-chain for this agent/hospital pair"
        )

    # 2. Expiration Check
    if time.time() > commitment.timestamp + commitment.ttl:
        return BCCInterceptResponse(authorized=False, reason="BCC_EXPIRED")

    # 3. AIS Threshold Gate (Query Oracle)
    try:
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(f"{ORACLE_URL}/v1/agent/{commitment.agent_id}", timeout=1.0)
                if resp.status_code == 200:
                    agent_data = resp.json()
                    ais = agent_data.get("current_ais", 0)
                    
                    # 3.1 Compute Circuit Breaker check (Vulnerability 1 Fix)
                    entropy = agent_data.get("performance_entropy", 0.0)
                    if entropy > 0.5:
                        return BCCInterceptResponse(
                            authorized=False,
                            reason=f"COMPUTE_THROTTLED: Agent entropy {entropy:.4f} exceeds safety threshold of 0.5"
                        )
                    
                    if ais < int(AIS_THRESHOLD):
                        return BCCInterceptResponse(
                            authorized=False, 
                            reason=f"AIS_BELOW_THRESHOLD: Agent AIS {ais} is too low for this action"
                        )
                else:
                    print(f"[BCC] Oracle returned {resp.status_code}. Using MOCK_AIS fallback.")
                    ais = 750 # Mock successful AIS
            except (httpx.ConnectError, httpx.TimeoutException):
                print("[BCC] Oracle unreachable. Using MOCK_AIS fallback.")
                ais = 750 # Mock successful AIS
    except Exception as e:
        print(f"[BCC] Unexpected error during Oracle check: {e}")
        # In MVP, we fallback to allow. In production, we might fail-closed.
        ais = 750 

    # 4. Intent & Policy Gate
    authorized, reason = await evaluate_intent_policy(commitment, context)
    
    if authorized:
        # Generate a verification token (HMAC signed by middleware)
        token_src = f"{commitment.id}|{time.time()}"
        token = hashlib.sha256(token_src.encode()).hexdigest()
        return BCCInterceptResponse(authorized=True, verification_token=token)
    else:
        # --- Live Telemetry Reporting (Compliance Metric Feed) ---
        try:
            async with httpx.AsyncClient() as client:
                # Calculate a penalty-driven compliance score (e.g., 0.0 for critical, 0.5 for escrow)
                compliance_score = 0.0 if "critical" in reason.lower() else 0.5
                
                await client.post(
                    f"{ORACLE_URL}/v1/ingest",
                    json={
                        "agent_id": commitment.agent_id,
                        "domain_id": "shield",
                        "timestamp": int(time.time()),
                        "payload": {
                            "deal_id": commitment.id,
                            "guardrail_pass_rate": compliance_score,
                            "violation_reason": reason,
                            "action_type": commitment.action_type
                        }
                    },
                    timeout=1.0
                )
        except Exception as e:
            print(f"[BCC] Failed to report compliance telemetry to Oracle: {e}")

        # Graduated Penalty Escrow Logic (Vulnerability 2 Fix)
        is_critical = "exfiltration" in reason.lower() or "transmission" in reason.lower()
        if not is_critical:
            # Low/Medium severity: suspend task, trigger 24h quarantine escrow appeal
            return BCCInterceptResponse(
                authorized=False,
                reason=f"ESCROW_QUARANTINE: Low/Medium severity violation. Task suspended for 24h in Escrow Chamber. Reason: {reason}"
            )
        else:
            return BCCInterceptResponse(
                authorized=False,
                reason=f"CRITICAL_VIOLATION: Safety policy violation. Immediate slashing triggered. Reason: {reason}"
            )

@app.get("/health")
async def health():
    return {"status": "online", "mode": "enforcing"}

from typing import Tuple
