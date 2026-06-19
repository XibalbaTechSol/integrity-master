from integrity_sdk import did

def test_did(mocker):
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
    
    did._save_private_key(mocker.MagicMock(), b"")
    did._save_did_document(mocker.MagicMock(), {})
    
    did.get_hardware_fingerprint()
    
    mock_dir = mocker.MagicMock()
    mocker.patch("integrity_sdk.did.get_project_did_dir", return_value=mock_dir)
    mocker.patch("integrity_sdk.did.generate_hardware_fingerprint", return_value="fg")
    mocker.patch("integrity_sdk.did._HAS_KEYRING", False)
    mock_dir.__truediv__.return_value.exists.return_value = False
    
    did.load_or_create_did("test_agent")
    did.sign_payload(b"data", agent_id="test_agent")
    
    mock_dir.__truediv__.return_value.exists.return_value = True
    mocker.patch("builtins.open", mocker.mock_open(read_data='{}'))
    did.load_did_document("test_agent")
    
    did.derive_evm_address(b"seed"*8)
