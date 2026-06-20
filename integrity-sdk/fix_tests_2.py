import os

os.makedirs('tests/unit', exist_ok=True)

with open('tests/unit/test_telemetry.py', 'w') as f:
    f.write('''
from integrity_sdk.telemetry.analyzer import CompositeSignalAnalyzer
from integrity_sdk.telemetry.host import HostTelemetrySampler
from integrity_sdk.telemetry.conventions import IntegrityAttributes
from integrity_sdk.telemetry.core import get_tracer, get_meter

def test_analyzer():
    analyzer = CompositeSignalAnalyzer()
    analyzer.record_tool_call("ls", {}, "result", 0.5)
    analyzer.record_inference("prompt", "completion", {"grounding": 0.8}, {"cpu_percent": 10})
    analyzer.record_inference("prompt", "completion connect", {"grounding": 0.5, "inter_token_jitter_ms": 1.0}, {"cpu_percent": 10})
    analyzer.compute_all_signals({"path_entropy": 5.0, "ip_entropy": 3.0})
    analyzer.record_tool_call("test", {}, "fail", 0.5)
    analyzer.record_inference("prompt", "success", {}, {})
    analyzer.compute_all_signals({})
    analyzer.tool_calls.clear()
    analyzer.inferences.clear()
    analyzer.grounding_history.clear()
    analyzer.compute_all_signals({})

def test_host(mocker):
    sampler = HostTelemetrySampler(0.1)
    sampler.start()
    sampler.start()
    sampler.stop()
    sampler.stop()
    mocker.patch.object(sampler, "sample", side_effect=Exception)
    sampler._stop_event.clear()
    def side_effect():
        sampler._stop_event.set()
        raise Exception("test")
    mocker.patch.object(sampler, "sample", side_effect=side_effect)
    sampler._run()

def test_core():
    tracer = get_tracer("test")
    meter = get_meter("test")
''')

with open('tests/unit/test_did.py', 'w') as f:
    f.write('''from integrity_sdk import did

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
''')

with open('tests/unit/test_hardware.py', 'w') as f:
    f.write('''from integrity_sdk import hardware
import hashlib

def test_hardware(mocker):
    mocker.patch("builtins.open", mocker.mock_open(read_data="test_machine_id\\n"))
    assert hardware.get_machine_id() == "test_machine_id"
    
    mocker.patch("builtins.open", mocker.mock_open(read_data="model name: test_cpu\\n"))
    assert hardware.get_cpu_model() == "test_cpu"

    mocker.patch("builtins.open", side_effect=FileNotFoundError)
    assert hardware.get_machine_id() == ""
    assert hardware.get_cpu_model() == ""

    mocker.patch("subprocess.check_output", return_value=b"link/ether 00:11:22:33:44:55")
    assert hardware.get_mac_address() == "00:11:22:33:44:55"

    mocker.patch("subprocess.check_output", side_effect=FileNotFoundError)
    mac = hardware.get_mac_address()
    assert len(mac.split(':')) == 6

    mocker.patch("socket.gethostname", return_value="test_host")
    assert hardware.get_hostname() == "test_host"

    mocker.patch("socket.socket")
    assert hardware.get_local_ip()

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
    
    mocker.patch("integrity_sdk.hardware.get_machine_id", return_value="id")
    mocker.patch("integrity_sdk.hardware.get_mac_address", return_value="mac")
    mocker.patch("integrity_sdk.hardware.get_hostname", return_value="host")
    fg = hardware.generate_hardware_fingerprint()
    assert fg == hashlib.sha256(b"id|mac|host").hexdigest()
    
    assert hardware.verify_hardware_binding(fg)
    assert hardware.get_hardware_attestation()
''')

print("Fixes 2 written successfully.")
