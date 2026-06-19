import os

os.makedirs('tests/unit', exist_ok=True)

with open('tests/unit/test_universal.py', 'w') as f:
    f.write("""from integrity_sdk.universal import Integrity

def test_universal(mocker):
    client = mocker.MagicMock()
    mocker.patch("integrity_sdk.universal.IntegrityClient", return_value=client)
    res = Integrity.init(agent_id="test")
    assert res == client
    assert Integrity.get_client() == client
    
    Integrity.log({"test": 1})
    client.log_telemetry.assert_called_with({"test": 1})
    
    Integrity.register()
    client.register_agent.assert_called_once()
    
    Integrity.handshake()
    client.handshake.assert_called_once()
    
    class Dummy:
        pass
    obj = Dummy()
    assert Integrity.wrap(obj) == obj
""")

with open('tests/unit/test_hardware.py', 'w') as f:
    f.write("""from integrity_sdk import hardware
import hashlib

def test_hardware(mocker):
    mocker.patch("builtins.open", mocker.mock_open(read_data="test_machine_id\\nmodel name: test_cpu\\nhypervisor\\n"))
    mocker.patch("subprocess.check_output", return_value=b"link/ether 00:11:22:33:44:55")
    mocker.patch("socket.gethostname", return_value="test_host")
    mocker.patch("socket.socket")
    
    assert hardware.get_machine_id() == "test_machine_id"
    assert hardware.get_mac_address() == "00:11:22:33:44:55"
    assert hardware.get_hostname() == "test_host"
    assert hardware.get_cpu_model() == " test_cpu"
    assert hardware.get_local_ip()
    
    fg = hardware.generate_hardware_fingerprint()
    assert fg == hashlib.sha256(b"test_machine_id|00:11:22:33:44:55|test_host").hexdigest()
    
    assert hardware.verify_hardware_binding(fg)
    assert hardware.get_hardware_attestation()
    
    mocker.patch("builtins.open", side_effect=FileNotFoundError)
    assert hardware.get_machine_id() == ""
    assert hardware.get_cpu_model() == ""
    
    mocker.patch("subprocess.check_output", side_effect=FileNotFoundError)
    mac = hardware.get_mac_address()
    assert len(mac.split(':')) == 6
    
    mocker.patch("socket.socket", side_effect=Exception)
    assert hardware.get_local_ip() == "127.0.0.1"
    
    mocker.patch("subprocess.run", return_value=mocker.MagicMock(returncode=0, stdout="kvm\\n"))
    assert hardware.get_virtualization_env() == "kvm"
    
    mocker.patch("subprocess.run", side_effect=Exception)
    mocker.patch("builtins.open", mocker.mock_open(read_data="hypervisor\\n"))
    assert hardware.get_virtualization_env() == "virtualized"
    
    mocker.patch("builtins.open", side_effect=Exception)
    mocker.patch("os.path.exists", return_value=True)
    assert hardware.get_virtualization_env() == "docker"
""")

with open('tests/unit/test_did.py', 'w') as f:
    f.write("""from integrity_sdk import did

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
""")

print("Tests 2 written successfully.")
