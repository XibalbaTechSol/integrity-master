import pytest
import requests
from unittest.mock import MagicMock
from integrity_cli.client import IntegrityClient

def test_client_init(monkeypatch):
    monkeypatch.setattr("integrity_cli.client.get_config_value", lambda k: "http://test/" if k == "ORACLE_URL" else "token")
    client = IntegrityClient()
    assert client.base_url == "http://test"
    assert client.token == "token"

def test_client_headers(monkeypatch):
    monkeypatch.setattr("integrity_cli.client.get_config_value", lambda k: "http://test" if k == "ORACLE_URL" else "test_token")
    client = IntegrityClient()
    headers = client._headers()
    assert headers["Content-Type"] == "application/json"
    assert headers["Authorization"] == "Bearer test_token"

def test_client_headers_no_token(monkeypatch):
    monkeypatch.setattr("integrity_cli.client.get_config_value", lambda k: "http://test" if k == "ORACLE_URL" else None)
    client = IntegrityClient()
    headers = client._headers()
    assert "Authorization" not in headers

def test_handle_response_success(monkeypatch):
    monkeypatch.setattr("integrity_cli.client.get_config_value", lambda k: "http://test" if k == "ORACLE_URL" else None)
    client = IntegrityClient()
    mock_resp = MagicMock(spec=requests.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"key": "value"}
    mock_resp.raise_for_status.return_value = None
    
    assert client._handle_response(mock_resp) == {"key": "value"}

def test_handle_response_204(monkeypatch):
    monkeypatch.setattr("integrity_cli.client.get_config_value", lambda k: "http://test" if k == "ORACLE_URL" else None)
    client = IntegrityClient()
    mock_resp = MagicMock()
    mock_resp.status_code = 204
    mock_resp.raise_for_status.return_value = None
    
    assert client._handle_response(mock_resp) == {}

def test_handle_response_http_error_with_json(monkeypatch):
    monkeypatch.setattr("integrity_cli.client.get_config_value", lambda k: "http://test" if k == "ORACLE_URL" else None)
    client = IntegrityClient()
    mock_resp = MagicMock()
    mock_resp.raise_for_status.side_effect = requests.exceptions.HTTPError("error")
    mock_resp.json.return_value = {"detail": "Custom detail"}
    
    with pytest.raises(Exception, match="API Error: Custom detail"):
        client._handle_response(mock_resp)

def test_handle_response_http_error_no_json(monkeypatch):
    monkeypatch.setattr("integrity_cli.client.get_config_value", lambda k: "http://test" if k == "ORACLE_URL" else None)
    client = IntegrityClient()
    mock_resp = MagicMock()
    mock_resp.status_code = 500
    mock_resp.reason = "Server Error"
    mock_resp.raise_for_status.side_effect = requests.exceptions.HTTPError("error")
    mock_resp.json.side_effect = ValueError("Invalid JSON")
    
    with pytest.raises(Exception, match="API Error: 500 Server Error"):
        client._handle_response(mock_resp)

def test_handle_response_other_error(monkeypatch):
    monkeypatch.setattr("integrity_cli.client.get_config_value", lambda k: "http://test" if k == "ORACLE_URL" else None)
    client = IntegrityClient()
    mock_resp = MagicMock()
    mock_resp.raise_for_status.side_effect = Exception("General error")
    
    with pytest.raises(Exception, match="Connection Error: General error"):
        client._handle_response(mock_resp)

def test_get(monkeypatch, requests_mock):
    monkeypatch.setattr("integrity_cli.client.get_config_value", lambda k: "http://test" if k == "ORACLE_URL" else None)
    client = IntegrityClient()
    requests_mock.get("http://test/test-endpoint", json={"result": "ok"})
    
    res = client.get("test-endpoint", params={"param": 1})
    assert res == {"result": "ok"}
    assert requests_mock.last_request.qs == {"param": ["1"]}

def test_post(monkeypatch, requests_mock):
    monkeypatch.setattr("integrity_cli.client.get_config_value", lambda k: "http://test" if k == "ORACLE_URL" else None)
    client = IntegrityClient()
    requests_mock.post("http://test/test-endpoint", json={"result": "created"})
    
    res = client.post("/test-endpoint", json_data={"data": "test"})
    assert res == {"result": "created"}
    assert requests_mock.last_request.json() == {"data": "test"}
