"""
Decentralized Identifier (DID) module for the Xibalba Integrity Protocol.

Generates and manages `did:xibalba:<fingerprint>` identifiers bound to
the host machine's hardware fingerprint.  Keypair is Ed25519 when the
`cryptography` library is available; otherwise falls back to a
deterministic HMAC-based signing scheme using only the stdlib so the
SDK works with zero pip installs.

DID Document and private key material are persisted under
~/.hermes/did/.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import stat
import time
from pathlib import Path
from typing import Optional, Tuple

from .hardware import generate_hardware_fingerprint, get_hardware_attestation

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_DID_DIR = Path.home() / ".hermes" / "did"
_DOC_PATH = _DID_DIR / "document.json"
_KEY_PATH = _DID_DIR / "private_key.pem"
_ORACLE_ENDPOINT = "http://localhost:3000/ingest"

# ---------------------------------------------------------------------------
# Crypto backend detection
# ---------------------------------------------------------------------------
_HAVE_CRYPTOGRAPHY = False

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import (
        Ed25519PrivateKey,
    )
    from cryptography.hazmat.primitives import serialization
    _HAVE_CRYPTOGRAPHY = True
except ImportError:
    pass


# ===================================================================
#  Fallback deterministic key – stdlib only
# ===================================================================

class _DeterministicKeypair:
    """
    A minimal Ed25519-like signing primitive built on HMAC-SHA512.

    The 'private key' is a 32-byte seed derived deterministically from the
    hardware fingerprint.  Signing produces HMAC-SHA512(seed, message) which
    is 64 bytes – the same length as an Ed25519 signature.

    This is NOT a real Ed25519 signature and offers no public-key
    verification by third parties.  It exists solely so the agent can
    attest payload integrity on machines where `cryptography` is not
    installed.  When `cryptography` IS available the real Ed25519 path
    is used instead.
    """

    def __init__(self, seed: bytes):
        assert len(seed) == 32, "seed must be 32 bytes"
        self._seed = seed
        # Derive a deterministic "public key" hash so the DID doc can
        # include a verificationMethod even without real Ed25519.
        self._pub = hashlib.sha256(b"xibalba-pubkey:" + seed).digest()

    @classmethod
    def from_fingerprint(cls, fingerprint: str) -> "_DeterministicKeypair":
        seed = hashlib.sha256(
            f"xibalba-did-keygen:{fingerprint}".encode()
        ).digest()
        return cls(seed)

    def sign(self, data: bytes) -> bytes:
        return hmac.new(self._seed, data, hashlib.sha512).digest()

    def public_bytes_raw(self) -> bytes:
        return self._pub

    def private_bytes_raw(self) -> bytes:
        return self._seed

    def private_pem(self) -> bytes:
        # Encode seed as a PEM-like block so it can be persisted to disk
        b64 = base64.b64encode(self._seed).decode()
        return (
            f"-----BEGIN XIBALBA DETERMINISTIC KEY-----\n"
            f"{b64}\n"
            f"-----END XIBALBA DETERMINISTIC KEY-----\n"
        ).encode()

    @classmethod
    def from_pem(cls, pem_bytes: bytes) -> "_DeterministicKeypair":
        lines = pem_bytes.decode().strip().splitlines()
        b64_line = lines[1]
        seed = base64.b64decode(b64_line)
        return cls(seed)


# ===================================================================
#  Real Ed25519 wrappers (cryptography library)
# ===================================================================

class _Ed25519Keypair:
    """Wraps cryptography's Ed25519PrivateKey with the same interface."""

    def __init__(self, private_key: "Ed25519PrivateKey"):  # type: ignore[name-defined]
        self._sk = private_key

    @classmethod
    def generate(cls) -> "_Ed25519Keypair":
        return cls(Ed25519PrivateKey.generate())

    @classmethod
    def from_pem(cls, pem_bytes: bytes) -> "_Ed25519Keypair":
        sk = serialization.load_pem_private_key(pem_bytes, password=None)
        return cls(sk)

    def sign(self, data: bytes) -> bytes:
        return self._sk.sign(data)

    def public_bytes_raw(self) -> bytes:
        return self._sk.public_key().public_bytes(
            serialization.Encoding.Raw, serialization.PublicFormat.Raw
        )

    def private_bytes_raw(self) -> bytes:
        return self._sk.private_bytes(
            serialization.Encoding.Raw,
            serialization.PrivateFormat.Raw,
            serialization.NoEncryption(),
        )

    def private_pem(self) -> bytes:
        return self._sk.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )


# ===================================================================
#  DID lifecycle helpers
# ===================================================================

def _make_did(fingerprint: str) -> str:
    """Construct the DID string from a hardware fingerprint hash."""
    return f"did:xibalba:{fingerprint}"


def _build_did_document(
    did: str,
    pub_key_bytes: bytes,
    fingerprint: str,
) -> dict:
    """
    Build a W3C DID Core-compliant DID Document.
    """
    pub_multibase = "z" + base64.b64encode(pub_key_bytes).decode()
    key_id = f"{did}#key-1"
    hw = get_hardware_attestation()

    return {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/ed25519-2020/v1",
        ],
        "id": did,
        "created": _iso_now(),
        "updated": _iso_now(),
        "verificationMethod": [
            {
                "id": key_id,
                "type": "Ed25519VerificationKey2020",
                "controller": did,
                "publicKeyMultibase": pub_multibase,
            }
        ],
        "authentication": [key_id],
        "assertionMethod": [key_id],
        "service": [
            {
                "id": f"{did}#integrity-oracle",
                "type": "IntegrityOracle",
                "serviceEndpoint": _ORACLE_ENDPOINT,
            }
        ],
        "hardwareAttestation": {
            "fingerprint": fingerprint,
            "hostname": hw["hostname"],
            "cpuModel": hw["cpu_model"],
            "macAddress": hw["mac_address"],
        },
    }


def _iso_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _ensure_dir() -> None:
    _DID_DIR.mkdir(parents=True, exist_ok=True)


def _save_private_key(pem_bytes: bytes) -> None:
    """Write the private key with 0600 permissions."""
    _KEY_PATH.write_bytes(pem_bytes)
    os.chmod(str(_KEY_PATH), stat.S_IRUSR | stat.S_IWUSR)


def _save_did_document(doc: dict) -> None:
    _DOC_PATH.write_text(json.dumps(doc, indent=2) + "\n")


# ===================================================================
#  Public API
# ===================================================================

def get_hardware_fingerprint() -> str:
    """
    Deterministic SHA-256 hash of machine-id + MAC + hostname.
    Re-exported here for convenience.
    """
    return generate_hardware_fingerprint()


def load_or_create_did() -> Tuple[str, object]:
    """
    Load an existing DID and keypair from disk, or create a new one
    bound to the current machine's hardware fingerprint.

    Returns
    -------
    (did_string, keypair)
        `did_string` is e.g. "did:xibalba:ab12cd..."
        `keypair` exposes `.sign(data) -> bytes` and `.public_bytes_raw() -> bytes`
    """
    _ensure_dir()
    fingerprint = generate_hardware_fingerprint()
    did = _make_did(fingerprint)

    # --- Try loading existing key -----------------------------------------
    if _KEY_PATH.exists() and _DOC_PATH.exists():
        pem = _KEY_PATH.read_bytes()
        try:
            if _HAVE_CRYPTOGRAPHY and b"BEGIN XIBALBA" not in pem:
                kp = _Ed25519Keypair.from_pem(pem)
            else:
                kp = _DeterministicKeypair.from_pem(pem)

            # Verify the on-disk DID matches current hardware
            doc = json.loads(_DOC_PATH.read_text())
            if doc.get("id") == did:
                return did, kp
            # Hardware changed – fall through to regenerate
        except Exception:
            pass  # corrupted key – regenerate

    # --- Generate new keypair ---------------------------------------------
    if _HAVE_CRYPTOGRAPHY:
        kp = _Ed25519Keypair.generate()
    else:
        kp = _DeterministicKeypair.from_fingerprint(fingerprint)

    _save_private_key(kp.private_pem())
    doc = _build_did_document(did, kp.public_bytes_raw(), fingerprint)
    _save_did_document(doc)

    return did, kp


def sign_payload(payload_bytes: bytes, keypair: Optional[object] = None) -> str:
    """
    Sign arbitrary bytes with the DID private key and return the
    signature as a hex string.

    If `keypair` is not provided, loads it from disk.
    """
    if keypair is None:
        _, keypair = load_or_create_did()
    sig = keypair.sign(payload_bytes)
    return sig.hex()


def load_did_document() -> Optional[dict]:
    """Load the DID document from disk, or None if it doesn't exist."""
    if _DOC_PATH.exists():
        return json.loads(_DOC_PATH.read_text())
    return None
