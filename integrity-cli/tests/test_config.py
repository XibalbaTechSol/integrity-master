import json
import os
from pathlib import Path
from integrity_cli.config import load_config, save_config, get_config_value, set_config_value, DEFAULT_CONFIG

def test_load_config_no_file(monkeypatch, tmp_path):
    config_file = tmp_path / "config.json"
    monkeypatch.setattr("integrity_cli.config.CONFIG_FILE", config_file)
    monkeypatch.setattr("integrity_cli.config.CONFIG_DIR", tmp_path)
    
    assert load_config() == DEFAULT_CONFIG

def test_load_config_valid_file(monkeypatch, tmp_path):
    config_file = tmp_path / "config.json"
    monkeypatch.setattr("integrity_cli.config.CONFIG_FILE", config_file)
    monkeypatch.setattr("integrity_cli.config.CONFIG_DIR", tmp_path)
    
    custom_config = {"ORACLE_URL": "http://test", "AUTH_TOKEN": "test_token"}
    config_file.write_text(json.dumps(custom_config))
    
    assert load_config() == custom_config

def test_load_config_missing_keys(monkeypatch, tmp_path):
    config_file = tmp_path / "config.json"
    monkeypatch.setattr("integrity_cli.config.CONFIG_FILE", config_file)
    monkeypatch.setattr("integrity_cli.config.CONFIG_DIR", tmp_path)
    
    custom_config = {"ORACLE_URL": "http://test"}
    config_file.write_text(json.dumps(custom_config))
    
    config = load_config()
    assert config["ORACLE_URL"] == "http://test"
    assert config["AUTH_TOKEN"] == DEFAULT_CONFIG["AUTH_TOKEN"]

def test_load_config_invalid_json(monkeypatch, tmp_path):
    config_file = tmp_path / "config.json"
    monkeypatch.setattr("integrity_cli.config.CONFIG_FILE", config_file)
    monkeypatch.setattr("integrity_cli.config.CONFIG_DIR", tmp_path)
    
    config_file.write_text("invalid json")
    assert load_config() == DEFAULT_CONFIG

def test_save_config(monkeypatch, tmp_path):
    config_file = tmp_path / "config.json"
    monkeypatch.setattr("integrity_cli.config.CONFIG_FILE", config_file)
    monkeypatch.setattr("integrity_cli.config.CONFIG_DIR", tmp_path)
    
    custom_config = {"ORACLE_URL": "http://test", "AUTH_TOKEN": "test_token"}
    save_config(custom_config)
    
    assert json.loads(config_file.read_text()) == custom_config

def test_get_config_value(monkeypatch, tmp_path):
    config_file = tmp_path / "config.json"
    monkeypatch.setattr("integrity_cli.config.CONFIG_FILE", config_file)
    monkeypatch.setattr("integrity_cli.config.CONFIG_DIR", tmp_path)
    
    custom_config = {"ORACLE_URL": "http://test"}
    config_file.write_text(json.dumps(custom_config))
    
    assert get_config_value("ORACLE_URL") == "http://test"
    assert get_config_value("AUTH_TOKEN") == DEFAULT_CONFIG["AUTH_TOKEN"]

def test_set_config_value(monkeypatch, tmp_path):
    config_file = tmp_path / "config.json"
    monkeypatch.setattr("integrity_cli.config.CONFIG_FILE", config_file)
    monkeypatch.setattr("integrity_cli.config.CONFIG_DIR", tmp_path)
    
    config_file.write_text(json.dumps({}))
    set_config_value("ORACLE_URL", "http://new")
    
    assert json.loads(config_file.read_text())["ORACLE_URL"] == "http://new"
