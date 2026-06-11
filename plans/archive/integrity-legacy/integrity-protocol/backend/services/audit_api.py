from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import uuid
from scoring_engine import IntegrityEcosystemScoringEngine

# Xibalba Solutions: Audit Management & Scoring API (v1.0)

app = FastAPI(title="Xibalba Audit Management API")
engine = IntegrityEcosystemScoringEngine()

# --- Models ---

class AuditRequest(BaseModel):
    agent_eth_address: str
    audit_type: str # 'STANDARD', 'DEEP_DIVE', 'PLATINUM'
    payment_tx_hash: str

class AuditResponse(BaseModel):
    audit_id: str
    status: str
    agent_eth_address: str
    impact_score: float

class ScoringRequest(BaseModel):
    agent_eth_address: str
    avg_partner_ais: float = 500
    xibalba_audit_score: float = 0.0
    gpu_hours_verified: float = 0.0
    performance_variance: float = 0.1 # Entropy
    staked_ratio: float = 0.1
    agent_age_days: int = 1
    total_volume_intg: float = 0.0
    days_since_active: int = 0
    penalty_points: float = 0.0

# --- In-Memory Store (Mock DB) ---
audits_db = {}

# --- Endpoints ---

@app.post("/audits/request", response_model=AuditResponse)
async def request_audit(request: AuditRequest):
    """
    Requests a Xibalba Solutions verification audit.
    """
    audit_id = str(uuid.uuid4())
    
    # Audit Impact Logic based on Policy
    impact_map = {
        "STANDARD": 0.10,
        "DEEP_DIVE": 0.40,
        "PLATINUM": 0.80
    }
    
    if request.audit_type not in impact_map:
        raise HTTPException(status_code=400, detail="Invalid audit type.")
        
    audit_data = {
        "audit_id": audit_id,
        "status": "PENDING_VERIFICATION",
        "agent_eth_address": request.agent_eth_address,
        "impact_score": impact_map[request.audit_type]
    }
    
    audits_db[audit_id] = audit_data
    return audit_data

@app.post("/scoring/calculate")
async def get_dual_scores(request: ScoringRequest):
    """
    Calculates the Dual Score (Entropy + AIS) for an agent.
    """
    result = engine.calculate_ais(
        avg_partner_ais=request.avg_partner_ais,
        xibalba_audit_score=request.xibalba_audit_score,
        gpu_hours_verified=request.gpu_hours_verified,
        performance_variance=request.performance_variance,
        staked_ratio=request.staked_ratio,
        agent_age_days=request.agent_age_days,
        total_volume_intg=request.total_volume_intg,
        days_since_active=request.days_since_active,
        penalty_points=request.penalty_points
    )
    
    return {
        "agent": request.agent_eth_address,
        "entropy_score": result["entropy_score"],
        "integrity_score": result["agent_integrity_score"],
        "stability_drag_coefficient": result["stability_coefficient"],
        "status": "VERIFIED" if request.xibalba_audit_score > 0 else "UNAUDITED"
    }

@app.get("/audits/{audit_id}")
async def get_audit_status(audit_id: str):
    if audit_id not in audits_db:
        raise HTTPException(status_code=404, detail="Audit not found.")
    return audits_db[audit_id]

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("AUDIT_API_HOST", "127.0.0.1")
    port = int(os.getenv("AUDIT_API_PORT", 8000))
    uvicorn.run(app, host=host, port=port)
