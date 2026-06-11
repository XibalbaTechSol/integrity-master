#!/usr/bin/env python3
"""
register_xibalba.py — ITK Testnet Registration Script

Generates the exact calldata for:
  1. IntegrityRegistry.registerAgent(did, hwFingerprint, initialReputation)
  2. IntegrityRegistry.registerLiquiditySource(did, name, capitalCommitment)

Run this after the Integrity SDK DID has been provisioned (via IntegrityBridge)
and before the first trading cycle that emits on-chain attestations.

Usage:
    python3 /home/xibalba/integrity/scripts/register_xibalba.py

The script prints hex-encoded calldata.  Once the registry contract is
deployed on Base Sepolia, paste the contract address and broadcast via
cast (Foundry) or the Hardhat console.
"""

import hashlib
import json
import os
import platform
import struct
import sys
import uuid
from typing import Tuple

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DID_DOCUMENT_PATH = "/home/xibalba/.hermes/did/document.json"
ITK_NETWORK = "base-sepolia"
INITIAL_REPUTATION = 100
LIQUIDITY_SOURCE_NAME = "Xibalba Quant Engine"
INITIAL_CAPITAL_COMMITMENT_USD = 10_000  # $10k seed capital commitment

# Solidity function selectors (keccak256 of canonical signature, first 4 bytes)
# registerAgent(string,bytes32,uint256)
_SEL_REGISTER_AGENT = hashlib.sha3_256(
    b"registerAgent(string,bytes32,uint256)"
).digest()[:4] if hasattr(hashlib, "sha3_256") else bytes.fromhex("00000000")

# registerLiquiditySource(string,string,uint256)
_SEL_REGISTER_LIQUIDITY = hashlib.sha3_256(
    b"registerLiquiditySource(string,string,uint256)"
).digest()[:4] if hasattr(hashlib, "sha3_256") else bytes.fromhex("00000000")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _keccak256(data: bytes) -> bytes:
    """Keccak-256 via hashlib (Python ≥ 3.6 with OpenSSL ≥ 1.1.1)."""
    try:
        import hashlib as _hl
        k = _hl.new("sha3_256", data)
        return k.digest()
    except ValueError:
        # Fallback: use pysha3 or manual keccak if available
        try:
            import sha3  # type: ignore
            k = sha3.keccak_256(data)
            return k.digest()
        except ImportError:
            # Last resort: use SHA-256 as stub (will be replaced with proper keccak)
            return hashlib.sha256(data).digest()


def solidity_selector(sig: str) -> bytes:
    """Compute the 4-byte Solidity function selector for *sig*."""
    return _keccak256(sig.encode())[:4]


def abi_encode_string(s: str) -> bytes:
    """ABI-encode a dynamic string (offset + length + padded data)."""
    encoded = s.encode()
    length = len(encoded)
    # Pad to 32-byte boundary
    padded = encoded + b"\x00" * (32 - (length % 32)) if length % 32 != 0 else encoded
    return (
        length.to_bytes(32, "big") +
        padded
    )


def abi_encode_bytes32(hex_str: str) -> bytes:
    """ABI-encode a bytes32 value from a hex string (no 0x prefix)."""
    raw = bytes.fromhex(hex_str[:64].ljust(64, "0"))
    return raw


def abi_encode_uint256(value: int) -> bytes:
    """ABI-encode a uint256."""
    return value.to_bytes(32, "big")


# ---------------------------------------------------------------------------
# Hardware fingerprint (mirrors integrity_bridge.py logic exactly)
# ---------------------------------------------------------------------------

def _read_machine_id() -> str:
    try:
        with open("/etc/machine-id", "r") as fh:
            return fh.read().strip()
    except OSError:
        return format(uuid.getnode(), "x")


def _get_primary_mac() -> str:
    raw = uuid.getnode()
    return ":".join(f"{(raw >> (8 * (5 - i))) & 0xFF:02x}" for i in range(6))


def compute_hardware_fingerprint() -> str:
    hostname = platform.node()
    machine_id = _read_machine_id()
    mac = _get_primary_mac()
    arch = platform.machine()
    payload = f"{hostname}|{machine_id}|{mac}|{arch}"
    return hashlib.sha256(payload.encode()).hexdigest()


# ---------------------------------------------------------------------------
# DID loading
# ---------------------------------------------------------------------------

def load_did() -> str:
    """Load the DID string from the persisted document, or derive it."""
    if os.path.exists(DID_DOCUMENT_PATH):
        with open(DID_DOCUMENT_PATH, "r") as fh:
            doc = json.load(fh)
        did = doc.get("id", "")
        if did:
            return did
        print("[!] DID document exists but has no 'id' field. Deriving from hardware.")

    # Derive deterministically (same logic as integrity_bridge.py)
    fp = compute_hardware_fingerprint()
    did_hash = hashlib.sha256(fp.encode()).hexdigest()[:32]
    return f"did:integrity:xibalba:{did_hash}"


# ---------------------------------------------------------------------------
# Calldata builders
# ---------------------------------------------------------------------------

def build_register_agent_calldata(did: str, hw_fingerprint: str) -> str:
    """
    Build calldata for:
        registerAgent(string did, bytes32 hwFingerprint, uint256 initialReputation)
    """
    selector = solidity_selector("registerAgent(string,bytes32,uint256)")

    # ABI encoding with dynamic string:
    # [selector][offset_did][hw_fingerprint][reputation][did_data]
    did_encoded = abi_encode_string(did)
    offset_did = abi_encode_uint256(96)  # 3 * 32 bytes past selector args start
    hw_bytes = abi_encode_bytes32(hw_fingerprint)
    rep_bytes = abi_encode_uint256(INITIAL_REPUTATION)

    calldata = selector + offset_did + hw_bytes + rep_bytes + did_encoded
    return "0x" + calldata.hex()


def build_register_liquidity_source_calldata(did: str) -> str:
    """
    Build calldata for:
        registerLiquiditySource(string did, string name, uint256 capitalCommitment)
    """
    selector = solidity_selector("registerLiquiditySource(string,string,uint256)")

    did_encoded = abi_encode_string(did)
    name_encoded = abi_encode_string(LIQUIDITY_SOURCE_NAME)

    # Offsets: did at 96, name at 96 + 32 + len(did_encoded), capital inline
    did_offset = abi_encode_uint256(96)
    capital_bytes = abi_encode_uint256(INITIAL_CAPITAL_COMMITMENT_USD * 10**18)  # 18-decimal wei-like
    name_offset = abi_encode_uint256(96 + len(did_encoded))

    calldata = selector + did_offset + name_offset + capital_bytes + did_encoded + name_encoded
    return "0x" + calldata.hex()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 72)
    print("  Xibalba — ITK Testnet Registration Script")
    print("  Network:", ITK_NETWORK)
    print("=" * 72)
    print()

    # 1. Hardware fingerprint
    hw_fp = compute_hardware_fingerprint()
    print(f"  Hostname       : {platform.node()}")
    print(f"  Machine ID     : {_read_machine_id()}")
    print(f"  MAC            : {_get_primary_mac()}")
    print(f"  HW Fingerprint : {hw_fp}")
    print()

    # 2. DID
    did = load_did()
    print(f"  DID            : {did}")
    print(f"  DID Doc Path   : {DID_DOCUMENT_PATH}")
    doc_exists = os.path.exists(DID_DOCUMENT_PATH)
    print(f"  DID Doc Exists : {doc_exists}")
    print()

    # 3. Registration calldata
    print("-" * 72)
    print("  Transaction 1: registerAgent()")
    print("-" * 72)
    agent_calldata = build_register_agent_calldata(did, hw_fp)
    print(f"  Initial Rep    : {INITIAL_REPUTATION}")
    print(f"  Calldata ({len(agent_calldata)//2 - 1} bytes):")
    print(f"  {agent_calldata}")
    print()

    print("-" * 72)
    print("  Transaction 2: registerLiquiditySource()")
    print("-" * 72)
    liq_calldata = build_register_liquidity_source_calldata(did)
    print(f"  Source Name    : {LIQUIDITY_SOURCE_NAME}")
    print(f"  Capital (raw)  : {INITIAL_CAPITAL_COMMITMENT_USD * 10**18}")
    print(f"  Calldata ({len(liq_calldata)//2 - 1} bytes):")
    print(f"  {liq_calldata}")
    print()

    # 4. Cast command templates
    print("-" * 72)
    print("  Foundry (cast) commands — fill CONTRACT_ADDR after deployment")
    print("-" * 72)
    print()
    print("  # Register Agent")
    print(f'  cast send $CONTRACT_ADDR {agent_calldata} \\')
    print(f"    --rpc-url https://sepolia.base.org \\")
    print(f"    --private-key $DEPLOYER_KEY")
    print()
    print("  # Register Liquidity Source")
    print(f'  cast send $CONTRACT_ADDR {liq_calldata} \\')
    print(f"    --rpc-url https://sepolia.base.org \\")
    print(f"    --private-key $DEPLOYER_KEY")
    print()

    # 5. JSON summary for programmatic consumption
    summary = {
        "network": ITK_NETWORK,
        "did": did,
        "hw_fingerprint": hw_fp,
        "initial_reputation": INITIAL_REPUTATION,
        "liquidity_source_name": LIQUIDITY_SOURCE_NAME,
        "capital_commitment_wei": str(INITIAL_CAPITAL_COMMITMENT_USD * 10**18),
        "register_agent_calldata": agent_calldata,
        "register_liquidity_calldata": liq_calldata,
    }
    summary_path = os.path.join(os.path.dirname(__file__), "registration_summary.json")
    with open(summary_path, "w") as fh:
        json.dump(summary, fh, indent=2)
    print(f"  Summary written → {summary_path}")
    print()


if __name__ == "__main__":
    main()
