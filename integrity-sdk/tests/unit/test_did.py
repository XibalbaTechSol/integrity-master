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

def test_derive_evm_address_success():
    seed = b"seed"*8
    address = did.derive_evm_address(seed)
    assert address.startswith("0x")
    assert len(address) == 42
    # We know the expected address for this seed
    assert address.lower() == "0x57db5bcbb79ae281f3fac4e25f1bb42b54c98dfc".lower()

def test_derive_evm_address_fallback(mocker):
    import sys
    mocker.patch.dict("sys.modules", {"eth_account": None})
    seed = b"seed"*8
    address = did.derive_evm_address(seed)
    assert address.startswith("0x")
    assert len(address) == 42
    # We know the fallback address uses sha256
    assert address == "0xd2b502275d39734b2059ef10ae2e180ecd164b7f"
