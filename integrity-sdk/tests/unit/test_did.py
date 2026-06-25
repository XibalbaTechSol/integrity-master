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

def test_make_did():
    # Test typical case
    fingerprint = "0a1b2c3d4e5f6g7h8i9j"
    expected = f"did:xibalba:{fingerprint}"
    assert did._make_did(fingerprint) == expected

    # Test edge case: empty fingerprint
    assert did._make_did("") == "did:xibalba:"

    # Test edge case: special characters
    assert did._make_did("!@#$%^&*()") == "did:xibalba:!@#$%^&*()"

def test_build_did_document_detailed(mocker):
    # Mock hardware attestation
    mocker.patch("integrity_sdk.did.get_hardware_attestation", return_value={
        "hostname": "test-host",
        "cpu_model": "test-cpu",
        "mac_address": "00:11:22:33:44:55"
    })

    # Mock time to make test deterministic
    mocker.patch("integrity_sdk.did._iso_now", return_value="2023-01-01T00:00:00Z")

    did_str = "did:xibalba:fingerprint123"
    pub_key = b"public_key_bytes"
    fingerprint = "fingerprint123"

    doc = did._build_did_document(did_str, pub_key, fingerprint)

    # Check required properties
    assert "@context" in doc
    assert doc["id"] == did_str
    assert doc["created"] == "2023-01-01T00:00:00Z"
    assert doc["updated"] == "2023-01-01T00:00:00Z"

    # Check verification methods
    assert len(doc["verificationMethod"]) == 1
    vm = doc["verificationMethod"][0]
    assert vm["id"] == f"{did_str}#key-1"
    assert vm["type"] == "Ed25519VerificationKey2020"
    assert vm["controller"] == did_str
    assert vm["publicKeyMultibase"].startswith("z")

    # Check assertions and authentications
    assert doc["authentication"] == [f"{did_str}#key-1"]
    assert doc["assertionMethod"] == [f"{did_str}#key-1"]

    # Check services
    assert len(doc["service"]) == 1
    svc = doc["service"][0]
    assert svc["id"] == f"{did_str}#integrity-oracle"
    assert svc["type"] == "IntegrityOracle"

    # Check hardware attestation
    hw = doc["hardwareAttestation"]
    assert hw["fingerprint"] == fingerprint
    assert hw["hostname"] == "test-host"
    assert hw["cpuModel"] == "test-cpu"
    assert hw["macAddress"] == "00:11:22:33:44:55"
