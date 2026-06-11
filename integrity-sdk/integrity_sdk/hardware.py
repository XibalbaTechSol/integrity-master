"""
Hardware attestation primitives for Xibalba Integrity Protocol.

Reads hardware identifiers from the local machine and derives a
deterministic SHA-256 fingerprint used for DID generation and
hardware binding verification.
"""

import hashlib
import os
import re
import socket
import subprocess
import uuid


def get_machine_id() -> str:
    """Read /etc/machine-id (systemd). Falls back to empty string on non-Linux."""
    try:
        with open("/etc/machine-id", "r") as f:
            return f.read().strip()
    except (FileNotFoundError, PermissionError):
        return ""


def get_mac_address() -> str:
    """
    Return the primary MAC address as a colon-separated hex string.
    Tries `ip link show` first (parses first non-loopback ether line),
    then falls back to uuid.getnode().
    """
    try:
        out = subprocess.check_output(
            ["ip", "-o", "link", "show"],
            stderr=subprocess.DEVNULL,
            timeout=2,
        ).decode()
        # Match lines that have 'link/ether' and extract the MAC
        for line in out.splitlines():
            if "link/ether" in line and "lo:" not in line:
                m = re.search(r"link/ether\s+([0-9a-f:]{17})", line)
                if m:
                    return m.group(1)
    except (FileNotFoundError, subprocess.SubprocessError, OSError):
        pass

    # Fallback: uuid.getnode() returns a 48-bit integer
    node = uuid.getnode()
    mac = ":".join(f"{(node >> (8 * i)) & 0xFF:02x}" for i in reversed(range(6)))
    return mac


def get_hostname() -> str:
    """Return the system hostname."""
    return socket.gethostname()


def get_cpu_model() -> str:
    """Read the CPU model string from /proc/cpuinfo."""
    try:
        with open("/proc/cpuinfo", "r") as f:
            for line in f:
                if line.startswith("model name"):
                    return line.split(":", 1)[1].strip()
    except (FileNotFoundError, PermissionError):
        pass
    return ""


def generate_hardware_fingerprint() -> str:
    """
    Combine machine-id + MAC + hostname into a deterministic SHA-256 hex digest.
    This is the canonical hardware fingerprint used across the Integrity Protocol.
    CPU model is intentionally excluded from the hash to allow microcode/BIOS
    updates without invalidating the DID, but it is collected for attestation
    metadata.
    """
    machine_id = get_machine_id()
    mac = get_mac_address()
    hostname = get_hostname()

    canonical = f"{machine_id}|{mac}|{hostname}"
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def get_local_ip() -> str:
    """Return the primary local IP address of the machine."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def get_virtualization_env() -> str:
    """
    Detects if the system is running inside a virtualized environment (VPS/VM/Container).
    Returns the virtualization technology (e.g., 'kvm', 'docker', 'none') or 'unknown'.
    """
    # 1. systemd-detect-virt (highly reliable on modern Linux)
    try:
        res = subprocess.run(
            ["systemd-detect-virt"],
            capture_output=True,
            text=True,
            timeout=2
        )
        if res.returncode == 0:
            return res.stdout.strip()
    except Exception:
        pass

    # 2. Check CPU info hypervisor flags / features
    try:
        with open("/proc/cpuinfo", "r") as f:
            for line in f:
                if "hypervisor" in line.lower() or "qemu" in line.lower() or "kvm" in line.lower():
                    return "virtualized"
    except Exception:
        pass

    # 3. Check for typical Docker container files
    if os.path.exists("/.dockerenv"):
        return "docker"

    return "none"


def get_hardware_attestation() -> dict:
    """
    Return a full hardware attestation report suitable for embedding in
    telemetry payloads or DID documents.
    """
    return {
        "machine_id": get_machine_id(),
        "mac_address": get_mac_address(),
        "local_ip": get_local_ip(),
        "hostname": get_hostname(),
        "cpu_model": get_cpu_model(),
        "fingerprint": generate_hardware_fingerprint(),
        "virtualization": get_virtualization_env(),
    }



def verify_hardware_binding(expected_fingerprint: str) -> bool:
    """
    Re-derive the hardware fingerprint from the live machine and compare
    against an expected value.  Returns True iff the machine identity
    matches.
    """
    current = generate_hardware_fingerprint()
    # Constant-time comparison to avoid timing side-channels
    return hashlib.sha256(current.encode()).digest() == hashlib.sha256(
        expected_fingerprint.encode()
    ).digest()
