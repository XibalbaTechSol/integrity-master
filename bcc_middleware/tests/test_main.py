import pytest
import os
import sys
import time
import json
import hashlib
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient

# Add parent directory to path so we can import main
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import main
from main import (
    app,
    BCCCommitment,
    BCCInterceptResponse,
    evaluate_intent_policy,
    _run_interceptor,
    check_baa_status,
)

client = TestClient(app)

@pytest.fixture
def base_context():
    return {"action": "query", "target": "patient_data", "hospital_id": "HOSP-123"}

@pytest.fixture
def base_commitment(base_context):
    actual_payload = json.dumps(base_context, sort_keys=True)
    actual_hash = hashlib.sha256(actual_payload.encode()).hexdigest()
    
    return BCCCommitment(
        id="test-deal-123",
        timestamp=time.time(),
        agent_id="did:intg:agent-007",
        action_type="query_db",
        intended_state_hash=actual_hash,
        opa_policy_id="policy-001"
    )

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "online", "mode": "enforcing"}

def test_intercept_endpoint(base_commitment, base_context):
    payload = {
        "commitment": base_commitment.dict(),
        "actual_context": base_context
    }
    
    with patch("main._run_interceptor", new_callable=AsyncMock) as mock_run:
        mock_run.return_value = BCCInterceptResponse(authorized=True, verification_token="tok123")
        response = client.post("/v1/bcc/intercept", json=payload)
        assert response.status_code == 200
        assert response.json()["authorized"] is True

@pytest.mark.asyncio
async def test_check_baa_status():
    # Test fallback when address not set
    with patch("main.SMART_BAA_ADDRESS", None):
        assert await check_baa_status("agent_123", "hosp") is True

    # Test logic when address is set
    with patch("main.SMART_BAA_ADDRESS", "0x123"):
        assert await check_baa_status("did:intg:123", "hosp") is True
        assert await check_baa_status("agent_scribe", "hosp") is True
        assert await check_baa_status("unknown_agent", "hosp") is False

@pytest.mark.asyncio
async def test_evaluate_intent_policy_intent_drift(base_commitment, base_context):
    base_commitment.intended_state_hash = "wrong_hash"
    authorized, reason = await evaluate_intent_policy(base_commitment, base_context)
    assert not authorized
    assert "BCC_INTENT_DRIFT" in reason

@pytest.mark.asyncio
async def test_evaluate_intent_policy_opa_allow(base_commitment, base_context):
    with patch("main.POLICY_ENGINE_URL", "http://opa:8181"):
        with patch("main.httpx.AsyncClient") as mock_client_class:
            mock_instance = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_instance
            mock_response = MagicMock(status_code=200)
            mock_response.json.return_value = {"result": {"allow": True}}
            mock_instance.post.return_value = mock_response

            authorized, reason = await evaluate_intent_policy(base_commitment, base_context)
            assert authorized
            assert reason == "Authorized"

@pytest.mark.asyncio
async def test_evaluate_intent_policy_opa_reject_with_reasons(base_commitment, base_context):
    with patch("main.POLICY_ENGINE_URL", "http://opa:8181"):
        with patch("main.httpx.AsyncClient") as mock_client_class:
            mock_instance = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_instance
            mock_response = MagicMock(status_code=200)
            mock_response.json.return_value = {"result": {"allow": False, "blocking_reasons": ["HIPAA Violation"]}}
            mock_instance.post.return_value = mock_response

            authorized, reason = await evaluate_intent_policy(base_commitment, base_context)
            assert not authorized
            assert "OPA_REJECTION: HIPAA Violation" in reason

@pytest.mark.asyncio
async def test_evaluate_intent_policy_opa_reject_no_reasons(base_commitment, base_context):
    with patch("main.POLICY_ENGINE_URL", "http://opa:8181"):
        with patch("main.httpx.AsyncClient") as mock_client_class:
            mock_instance = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_instance
            mock_response = MagicMock(status_code=200)
            mock_response.json.return_value = {"result": {"allow": False}}
            mock_instance.post.return_value = mock_response

            authorized, reason = await evaluate_intent_policy(base_commitment, base_context)
            assert not authorized
            assert "Intent violates semantic safety policy" in reason

@pytest.mark.asyncio
async def test_evaluate_intent_policy_opa_exception(base_commitment, base_context):
    with patch("main.POLICY_ENGINE_URL", "http://opa:8181"):
        with patch("main.httpx.AsyncClient") as mock_client_class:
            mock_instance = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_instance
            mock_instance.post.side_effect = Exception("Connection Refused")

            authorized, reason = await evaluate_intent_policy(base_commitment, base_context)
            assert not authorized
            assert "BCC_SAFETY_FALLBACK" in reason

@pytest.mark.asyncio
async def test_evaluate_intent_policy_local_rules(base_commitment, base_context):
    with patch("main.POLICY_ENGINE_URL", None):
        # 1. Allowed intent
        authorized, reason = await evaluate_intent_policy(base_commitment, base_context)
        assert authorized
        assert reason == "Authorized"
        
        # 2. Exfiltrate
        exfiltrate_context = base_context.copy()
        exfiltrate_context["notes"] = "Need to exfiltrate this"
        base_commitment.intended_state_hash = hashlib.sha256(json.dumps(exfiltrate_context, sort_keys=True).encode()).hexdigest()
        authorized, reason = await evaluate_intent_policy(base_commitment, exfiltrate_context)
        assert not authorized
        assert "exfiltration" in reason

        # 3. SSN
        ssn_context = base_context.copy()
        ssn_context["data"] = "SSN is 123-45-6789"
        base_commitment.intended_state_hash = hashlib.sha256(json.dumps(ssn_context, sort_keys=True).encode()).hexdigest()
        authorized, reason = await evaluate_intent_policy(base_commitment, ssn_context)
        assert not authorized
        assert "PHI (SSN) detected" in reason
        
        # 4. Destructive
        destructive_context = base_context.copy()
        destructive_context["command"] = "delete system files"
        base_commitment.intended_state_hash = hashlib.sha256(json.dumps(destructive_context, sort_keys=True).encode()).hexdigest()
        authorized, reason = await evaluate_intent_policy(base_commitment, destructive_context)
        assert not authorized
        assert "Destructive system action unauthorized" in reason

        # 5. Contract Manipulation during audit
        audit_context = base_context.copy()
        audit_context["modification"] = "backdoor"
        base_commitment.action_type = "AUDITING"
        base_commitment.intended_state_hash = hashlib.sha256(json.dumps(audit_context, sort_keys=True).encode()).hexdigest()
        authorized, reason = await evaluate_intent_policy(base_commitment, audit_context)
        assert not authorized
        assert "contract modification during audit" in reason

        # 6. Telemetry Spoofing
        spoof_context = base_context.copy()
        spoof_context["trick"] = "bypass hardware check"
        base_commitment.action_type = "query_db" # reset action type
        base_commitment.intended_state_hash = hashlib.sha256(json.dumps(spoof_context, sort_keys=True).encode()).hexdigest()
        authorized, reason = await evaluate_intent_policy(base_commitment, spoof_context)
        assert not authorized
        assert "TELEMETRY_SPOOFING" in reason

@pytest.mark.asyncio
async def test_run_interceptor_expired(base_commitment, base_context):
    base_commitment.timestamp = time.time() - 100
    base_commitment.ttl = 60
    resp = await _run_interceptor(base_commitment, base_context)
    assert not resp.authorized
    assert resp.reason == "BCC_EXPIRED"

@pytest.mark.asyncio
async def test_run_interceptor_baa_failure(base_commitment, base_context):
    with patch("main.check_baa_status", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = False
        resp = await _run_interceptor(base_commitment, base_context)
        assert not resp.authorized
        assert "BAA_REQUIRED" in resp.reason

@pytest.mark.asyncio
async def test_run_interceptor_ais_threshold(base_commitment, base_context):
    with patch("main.check_baa_status", new_callable=AsyncMock, return_value=True):
        with patch("main.httpx.AsyncClient") as mock_client_class:
            mock_instance = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_instance
            mock_response = MagicMock(status_code=200)
            
            # Entropy too high
            mock_response.json.return_value = {"current_ais": 800, "performance_entropy": 0.6}
            mock_instance.get.return_value = mock_response
            resp = await _run_interceptor(base_commitment, base_context)
            assert not resp.authorized
            assert "COMPUTE_THROTTLED" in resp.reason
            
            # AIS too low
            mock_response.json.return_value = {"current_ais": 100, "performance_entropy": 0.1}
            mock_instance.get.return_value = mock_response
            resp = await _run_interceptor(base_commitment, base_context)
            assert not resp.authorized
            assert "AIS_BELOW_THRESHOLD" in resp.reason

@pytest.mark.asyncio
async def test_run_interceptor_oracle_fallback(base_commitment, base_context):
    with patch("main.check_baa_status", new_callable=AsyncMock, return_value=True):
        with patch("main.httpx.AsyncClient") as mock_client_class:
            mock_instance = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_instance
            mock_instance.get.side_effect = Exception("Oracle offline")
            
            # Uses fallback ais=750, local policy passes
            resp = await _run_interceptor(base_commitment, base_context)
            assert resp.authorized is True

@pytest.mark.asyncio
async def test_run_interceptor_success(base_commitment, base_context):
    with patch("main.check_baa_status", new_callable=AsyncMock, return_value=True):
        with patch("main.httpx.AsyncClient") as mock_client_class:
            mock_instance = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_instance
            mock_response = MagicMock(status_code=200)
            mock_response.json.return_value = {"current_ais": 800, "performance_entropy": 0.1}
            mock_instance.get.return_value = mock_response
            
            # Local policy should pass
            resp = await _run_interceptor(base_commitment, base_context)
            assert resp.authorized is True
            assert resp.verification_token is not None

@pytest.mark.asyncio
async def test_run_interceptor_escrow_quarantine(base_commitment, base_context):
    # Test escrow functionality for non-critical failures
    base_context["intent"] = "some violation that does not include critical words"
    base_commitment.intended_state_hash = hashlib.sha256(json.dumps(base_context, sort_keys=True).encode()).hexdigest()

    with patch("main.check_baa_status", new_callable=AsyncMock, return_value=True):
        with patch("main.httpx.AsyncClient") as mock_client_class:
            mock_instance = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_instance
            mock_response_get = MagicMock(status_code=200)
            mock_response_get.json.return_value = {"current_ais": 800, "performance_entropy": 0.1}
            mock_instance.get.return_value = mock_response_get
            
            # Force OPA evaluation reject with non-critical reason
            with patch("main.evaluate_intent_policy", new_callable=AsyncMock) as mock_eval:
                mock_eval.return_value = (False, "Minor formatting error")
                resp = await _run_interceptor(base_commitment, base_context)
                assert not resp.authorized
                assert "ESCROW_QUARANTINE" in resp.reason
                mock_instance.post.assert_called_once() # Telemetry check

@pytest.mark.asyncio
async def test_run_interceptor_critical_slashing(base_commitment, base_context):
    with patch("main.check_baa_status", new_callable=AsyncMock, return_value=True):
        with patch("main.httpx.AsyncClient") as mock_client_class:
            mock_instance = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_instance
            mock_response_get = MagicMock(status_code=200)
            mock_response_get.json.return_value = {"current_ais": 800, "performance_entropy": 0.1}
            mock_instance.get.return_value = mock_response_get
            
            # Force OPA evaluation reject with critical reason
            with patch("main.evaluate_intent_policy", new_callable=AsyncMock) as mock_eval:
                mock_eval.return_value = (False, "Data exfiltration attempted")
                resp = await _run_interceptor(base_commitment, base_context)
                assert not resp.authorized
                assert "CRITICAL_VIOLATION" in resp.reason
                mock_instance.post.assert_called_once() # Telemetry check

def test_recent_trajectories_endpoint_and_limit(base_commitment, base_context):
    payload = {
        "commitment": base_commitment.model_dump() if hasattr(base_commitment, "model_dump") else base_commitment.dict(),
        "actual_context": base_context
    }
    with patch("main._run_interceptor", new_callable=AsyncMock) as mock_run:
        mock_run.return_value = BCCInterceptResponse(authorized=True, verification_token="tok123")
        for i in range(51):
            client.post("/v1/bcc/intercept", json=payload)
            
    response = client.get("/v1/trajectories/recent")
    assert response.status_code == 200
    assert len(response.json()["trajectories"]) == 50

@pytest.mark.asyncio
async def test_execute_agent_action():
    from main import execute_agent_action
    intent = {"action": "query_db"}
    state_hash = hashlib.sha256(json.dumps(intent, sort_keys=True).encode()).hexdigest()
    
    with patch("main._run_interceptor", new_callable=AsyncMock) as mock_run:
        mock_run.return_value = BCCInterceptResponse(authorized=True, verification_token="tok123")
        res = await execute_agent_action(intent, state_hash)
        assert res.authorized is True

@pytest.mark.asyncio
async def test_run_interceptor_oracle_non_200(base_commitment, base_context):
    with patch("main.check_baa_status", new_callable=AsyncMock, return_value=True):
        with patch("main.httpx.AsyncClient") as mock_client_class:
            mock_instance = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_instance
            mock_response_get = MagicMock(status_code=500)
            mock_instance.get.return_value = mock_response_get
            
            resp = await _run_interceptor(base_commitment, base_context)
            assert resp.authorized is True

@pytest.mark.asyncio
async def test_run_interceptor_oracle_timeout(base_commitment, base_context):
    import httpx
    with patch("main.check_baa_status", new_callable=AsyncMock, return_value=True):
        with patch("main.httpx.AsyncClient") as mock_client_class:
            mock_instance = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_instance
            mock_instance.get.side_effect = httpx.TimeoutException("Timeout")
            
            resp = await _run_interceptor(base_commitment, base_context)
            assert resp.authorized is True

@pytest.mark.asyncio
async def test_run_interceptor_telemetry_post_exception(base_commitment, base_context):
    base_context["intent"] = "some minor violation"
    base_commitment.intended_state_hash = hashlib.sha256(json.dumps(base_context, sort_keys=True).encode()).hexdigest()

    with patch("main.check_baa_status", new_callable=AsyncMock, return_value=True):
        with patch("main.httpx.AsyncClient") as mock_client_class:
            mock_instance = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_instance
            mock_response_get = MagicMock(status_code=200)
            mock_response_get.json.return_value = {"current_ais": 800, "performance_entropy": 0.1}
            mock_instance.get.return_value = mock_response_get
            
            # Post raises exception
            mock_instance.post.side_effect = Exception("Telemetry failed")
            
            with patch("main.evaluate_intent_policy", new_callable=AsyncMock) as mock_eval:
                mock_eval.return_value = (False, "Minor formatting error")
                resp = await _run_interceptor(base_commitment, base_context)
                assert not resp.authorized
                assert "ESCROW_QUARANTINE" in resp.reason
