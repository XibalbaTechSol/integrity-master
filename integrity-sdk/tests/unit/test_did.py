import pytest
import os
from pathlib import Path
from integrity_sdk import did

def test_did(mocker, tmp_path):
    key1 = did._DeterministicKeypair.from_fingerprint("fg")
    assert key1.sign(b"data")
    assert key1.public_bytes_raw()
    assert key1.private_bytes_raw()
    pem = key1.private_pem()
    key2 = did._DeterministicKeypair.from_pem(pem)
    assert key1._seed == key2._seed
    
    if did._HAVE_CRYPTOGRAPHY:
        k1 = did._Ed25519Keypair.generate()
        k1.sign(b"data")
        k1.public_bytes_raw()
        k1.private_bytes_raw()
        pem2 = k1.private_pem()
        k2 = did._Ed25519Keypair.from_pem(pem2)
        assert k1.public_bytes_raw() == k2.public_bytes_raw()
        
    did_doc = did._build_did_document("did:xibalba:fg", b"pub", "fg")
    assert did_doc["id"] == "did:xibalba:fg"
    
    did._save_private_key(tmp_path / "key.pem", b"")
    did._save_did_document(tmp_path / "doc.json", {})
    
    did.get_hardware_fingerprint()
    
    mock_dir = mocker.MagicMock()
    mocker.patch("integrity_sdk.did.get_project_did_dir", return_value=mock_dir)
    mocker.patch("integrity_sdk.did.generate_hardware_fingerprint", return_value="fg")
    mocker.patch("integrity_sdk.did._HAS_KEYRING", False)
    mock_dir.__truediv__.return_value.exists.return_value = False
    
    mocker.patch("integrity_sdk.did._save_private_key")
    mocker.patch("integrity_sdk.did._save_did_document")
    did.load_or_create_did("test_agent")
    did.sign_payload(b"data", agent_id="test_agent")
    
    mock_dir.__truediv__.return_value.exists.return_value = True
    mock_dir.__truediv__.return_value.read_text.return_value = '{"id":"did:xibalba:fg:test_agent"}'
    did.load_did_document("test_agent")
    
    did.derive_evm_address(b"seed"*8)

def test_ensure_dir_permission_error(mocker, tmp_path):
    mocker.patch("pathlib.Path.mkdir", side_effect=PermissionError("Mocked PermissionError"))
    with pytest.raises(PermissionError):
        did._ensure_dir(tmp_path / "did_dir")

def test_save_private_key_write_permission_error(mocker, tmp_path):
    mocker.patch("pathlib.Path.write_bytes", side_effect=PermissionError("Mocked PermissionError"))
    with pytest.raises(PermissionError):
        did._save_private_key(tmp_path / "key.pem", b"data")

def test_save_private_key_chmod_permission_error(mocker, tmp_path):
    mocker.patch("pathlib.Path.write_bytes")
    mocker.patch("os.chmod", side_effect=PermissionError("Mocked PermissionError"))
    with pytest.raises(PermissionError):
        did._save_private_key(tmp_path / "key.pem", b"data")

def test_save_did_document_permission_error(mocker, tmp_path):
    mocker.patch("pathlib.Path.write_text", side_effect=PermissionError("Mocked PermissionError"))
    with pytest.raises(PermissionError):
        did._save_did_document(tmp_path / "doc.json", {})
