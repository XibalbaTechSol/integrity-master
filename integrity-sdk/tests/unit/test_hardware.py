from integrity_sdk import hardware
import hashlib

def test_hardware(mocker):
    mocker.patch("builtins.open", mocker.mock_open(read_data="test_machine_id\n"))
    assert hardware.get_machine_id() == "test_machine_id"
    
    mocker.patch("builtins.open", mocker.mock_open(read_data="model name: test_cpu\n"))
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

    mocker.patch("subprocess.run", return_value=mocker.MagicMock(returncode=0, stdout="kvm\n"))
    assert hardware.get_virtualization_env() == "kvm"

    mocker.patch("subprocess.run", side_effect=Exception)
    mocker.patch("builtins.open", mocker.mock_open(read_data="hypervisor\n"))
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
    mocker.patch("builtins.open", mocker.mock_open(read_data="model name: test_cpu\n"))
    assert hardware.get_hardware_attestation()
