import pytest
from typer.testing import CliRunner
import json
import hashlib
import httpx
from unittest.mock import patch, MagicMock

from integrity_cli.main import app
from integrity_cli.config import DEFAULT_CONFIG

runner = CliRunner()

def test_config_set(monkeypatch, tmp_path):
    config_file = tmp_path / "config.json"
    monkeypatch.setattr("integrity_cli.config.CONFIG_FILE", config_file)
    monkeypatch.setattr("integrity_cli.config.CONFIG_DIR", tmp_path)
    
    result = runner.invoke(app, ["config", "set", "ORACLE_URL", "http://test-set"])
    assert result.exit_code == 0
    assert "Config updated: ORACLE_URL = http://test-set" in result.stdout
    assert json.loads(config_file.read_text())["ORACLE_URL"] == "http://test-set"

def test_config_show(monkeypatch, tmp_path):
    config_file = tmp_path / "config.json"
    monkeypatch.setattr("integrity_cli.config.CONFIG_FILE", config_file)
    monkeypatch.setattr("integrity_cli.config.CONFIG_DIR", tmp_path)
    
    config_file.write_text(json.dumps({"ORACLE_URL": "http://show-url"}))
    result = runner.invoke(app, ["config", "show"])
    assert result.exit_code == 0
    assert "http://show-url" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_auth_generate_dev_key(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.return_value = {"api_key": "test_dev_key"}
    
    result = runner.invoke(app, ["auth", "generate-dev-key"])
    assert result.exit_code == 0
    assert "Success" in result.stdout
    assert "test_dev_key" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_auth_generate_dev_key_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.side_effect = Exception("Auth fail")
    
    result = runner.invoke(app, ["auth", "generate-dev-key"])
    assert result.exit_code == 0
    assert "Error:" in result.stdout
    assert "Auth fail" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_register(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.return_value = {"message": "Agent registered", "agent_id": "a123"}
    
    result = runner.invoke(app, ["agent", "register", "-a", "0x123", "--alias", "test"])
    assert result.exit_code == 0
    assert "Agent registered" in result.stdout
    assert "a123" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_register_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.side_effect = Exception("Reg fail")
    
    result = runner.invoke(app, ["agent", "register", "-a", "0x123", "--alias", "test"])
    assert result.exit_code == 0
    assert "Error:" in result.stdout
    assert "Reg fail" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_list(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.return_value = [
        {"alias": "a1", "eth_address": "0x1", "current_ais": 100, "verification_tier": 2, "is_active": True}
    ]
    
    result = runner.invoke(app, ["agent", "list"])
    assert result.exit_code == 0
    assert "a1" in result.stdout
    assert "0x1" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_list_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.side_effect = Exception("List fail")
    
    result = runner.invoke(app, ["agent", "list"])
    assert result.exit_code == 0
    assert "Error:" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_status(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.return_value = {
        "alias": "a1", "eth_address": "0x1", "xns_handle": "bot.intg", "current_ais": 100,
        "performance_entropy": 0.2, "verification_tier": 1, "grounding_score": 50, "last_active_at": "now"
    }
    
    result = runner.invoke(app, ["agent", "status", "a1"])
    assert result.exit_code == 0
    assert "NORMAL" in result.stdout
    assert "Sovereign Tier" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_status_throttled_and_tier2(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.return_value = {
        "alias": "a1", "eth_address": "0x1", "xns_handle": None, "current_ais": 100,
        "performance_entropy": 0.8, "verification_tier": 2, "grounding_score": 50, "last_active_at": "now"
    }
    
    result = runner.invoke(app, ["agent", "status", "a1"])
    assert result.exit_code == 0
    assert "THROTTLED" in result.stdout
    assert "Attested Tier" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_status_tier3(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.return_value = {
        "alias": "a1", "eth_address": "0x1", "xns_handle": None, "current_ais": 100,
        "performance_entropy": 0.1, "verification_tier": 3, "grounding_score": 50, "last_active_at": "now"
    }
    
    result = runner.invoke(app, ["agent", "status", "a1"])
    assert result.exit_code == 0
    assert "Uncapped" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_status_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.side_effect = Exception("Status fail")
    
    result = runner.invoke(app, ["agent", "status", "a1"])
    assert result.exit_code == 0
    assert "Error:" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_intercept_success(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.return_value = {"authorized": True, "reason": "ok", "verification_token": "tok"}
    
    result = runner.invoke(app, ["agent", "intercept", "-i", "1", "-a", "read", "-c", '{"k":"v"}'])
    assert result.exit_code == 0
    assert "AUTHORIZED" in result.stdout
    assert "tok" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_intercept_reject(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.return_value = {"authorized": False, "reason": "bad"}
    
    result = runner.invoke(app, ["agent", "intercept", "-i", "1", "-a", "read"])
    assert result.exit_code == 0
    assert "REJECTED" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_intercept_invalid_json(mock_client_class):
    result = runner.invoke(app, ["agent", "intercept", "-i", "1", "-a", "read", "-c", 'invalid'])
    assert result.exit_code == 0
    assert "Invalid Context JSON:" in result.stdout

@patch("httpx.post")
@patch("integrity_cli.main.IntegrityClient")
def test_agent_intercept_fallback_success(mock_client_class, mock_httpx_post):
    mock_client = mock_client_class.return_value
    mock_client.post.side_effect = Exception("API down")
    
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"authorized": True, "reason": "ok", "verification_token": "tok2"}
    mock_httpx_post.return_value = mock_resp
    
    result = runner.invoke(app, ["agent", "intercept", "-i", "1", "-a", "read"])
    assert result.exit_code == 0
    assert "AUTHORIZED" in result.stdout
    assert "tok2" in result.stdout

@patch("httpx.post")
@patch("integrity_cli.main.IntegrityClient")
def test_agent_intercept_fallback_error(mock_client_class, mock_httpx_post):
    mock_client = mock_client_class.return_value
    mock_client.post.side_effect = Exception("API down")
    mock_httpx_post.side_effect = Exception("Local down")
    
    result = runner.invoke(app, ["agent", "intercept", "-i", "1", "-a", "read"])
    assert result.exit_code == 0
    assert "Error querying BCC Middleware" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_handshake(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.return_value = {"trust_decision": "APPROVED", "handshake_hash": "hash123"}
    
    result = runner.invoke(app, ["agent", "handshake", "--initiator", "0x1", "--target", "0x2"])
    assert result.exit_code == 0
    assert "APPROVED" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_handshake_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.side_effect = Exception("fail")
    
    result = runner.invoke(app, ["agent", "handshake", "--initiator", "0x1", "--target", "0x2"])
    assert result.exit_code == 0
    assert "Error:" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_report(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.return_value = {"ais_score": 500}
    
    result = runner.invoke(app, ["agent", "report", "a1", "d1", "10.0", "100", "0.9"])
    assert result.exit_code == 0
    assert "Report accepted" in result.stdout
    assert "500" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_report_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.side_effect = Exception("report fail")
    
    result = runner.invoke(app, ["agent", "report", "a1", "d1", "10.0", "100", "0.9"])
    assert result.exit_code == 0
    assert "Error:" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_stake(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.return_value = {"new_staked_balance": 1000.0}
    
    result = runner.invoke(app, ["agent", "stake", "0x1", "100.0"])
    assert result.exit_code == 0
    assert "Stake successful" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_agent_stake_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.side_effect = Exception("stake fail")
    
    result = runner.invoke(app, ["agent", "stake", "0x1", "100.0"])
    assert result.exit_code == 0
    assert "Error:" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_identity_resolve(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.return_value = {"eth_address": "0x1", "trust_level": 5}
    
    result = runner.invoke(app, ["identity", "resolve", "handle1"])
    assert result.exit_code == 0
    assert "0x1" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_identity_resolve_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.side_effect = Exception("res fail")
    
    result = runner.invoke(app, ["identity", "resolve", "handle1"])
    assert result.exit_code == 0
    assert "Error:" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_identity_did(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.return_value = {"did_document": {"id": "did:ethr:0x1"}}
    
    result = runner.invoke(app, ["identity", "did", "0x1"])
    assert result.exit_code == 0
    assert "did:ethr:0x1" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_identity_did_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.side_effect = Exception("did fail")
    
    result = runner.invoke(app, ["identity", "did", "0x1"])
    assert result.exit_code == 0
    assert "Error:" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_identity_revoke(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.return_value = {"message": "revoked", "did": "did:ethr:0x1"}
    
    result = runner.invoke(app, ["identity", "revoke", "0x1", "-r", "reason1"])
    assert result.exit_code == 0
    assert "Success" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_identity_revoke_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.side_effect = Exception("rev fail")
    
    result = runner.invoke(app, ["identity", "revoke", "0x1", "-r", "reason1"])
    assert result.exit_code == 0
    assert "Error:" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_governance_proposals(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.return_value = [
        {"id": "p1", "title": "t1", "votes_for": 10, "votes_against": 0}
    ]
    
    result = runner.invoke(app, ["governance", "proposals"])
    assert result.exit_code == 0
    assert "p1" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_governance_proposals_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.side_effect = Exception("prop fail")
    
    result = runner.invoke(app, ["governance", "proposals"])
    assert result.exit_code == 0
    assert "Error fetching proposals" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_governance_vote(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.return_value = {}
    
    result = runner.invoke(app, ["governance", "vote", "p1", "--vote-type", "for"])
    assert result.exit_code == 0
    assert "Vote cast successfully" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_governance_vote_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.side_effect = Exception("vote fail")
    
    result = runner.invoke(app, ["governance", "vote", "p1", "--vote-type", "for"])
    assert result.exit_code == 0
    assert "Error casting vote" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_governance_anchor(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.return_value = {"merkle_root": "0x123", "tx_hash": "0xabc"}
    
    result = runner.invoke(app, ["governance", "anchor"])
    assert result.exit_code == 0
    assert "State Anchored Successfully" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_governance_anchor_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.side_effect = Exception("anchor fail")
    
    result = runner.invoke(app, ["governance", "anchor"])
    assert result.exit_code == 0
    assert "Error:" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_shield_baas(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.return_value = [
        {"id": "b1", "businessAssociate": "a1", "status": "active", "stakedITK": "100"}
    ]
    
    result = runner.invoke(app, ["shield", "baas"])
    assert result.exit_code == 0
    assert "b1" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_shield_baas_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.side_effect = Exception("baas fail")
    
    result = runner.invoke(app, ["shield", "baas"])
    assert result.exit_code == 0
    assert "Error fetching BAAs" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_shield_propose(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.return_value = {"baaId": "b1"}
    
    result = runner.invoke(app, ["shield", "propose", "h1", "a1", "100"])
    assert result.exit_code == 0
    assert "Proposed Successfully" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_shield_propose_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.post.side_effect = Exception("propose fail")
    
    result = runner.invoke(app, ["shield", "propose", "h1", "a1", "100"])
    assert result.exit_code == 0
    assert "Error proposing BAA" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_shield_queue_empty(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.return_value = []
    
    result = runner.invoke(app, ["shield", "queue"])
    assert result.exit_code == 0
    assert "Queue is clear" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_shield_queue_not_empty(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.return_value = [
        {"id": "v1", "time": "t1", "type": "HIPAA", "agent": "a1", "detail": "d1"}
    ]
    
    result = runner.invoke(app, ["shield", "queue"])
    assert result.exit_code == 0
    assert "v1" in result.stdout

@patch("integrity_cli.main.IntegrityClient")
def test_shield_queue_error(mock_client_class):
    mock_client = mock_client_class.return_value
    mock_client.get.side_effect = Exception("queue fail")
    
    result = runner.invoke(app, ["shield", "queue"])
    assert result.exit_code == 0
    assert "Error fetching queue" in result.stdout
