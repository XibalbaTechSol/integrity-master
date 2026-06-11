---
title: Hardware Fingerprinting & Tethered Identity (DID)
acronyms: [DID]
created: 2026-05-31
updated: 2026-05-31
type: concept
tags: [identity, cryptography, compliance]
confidence: high
---

# Hardware Fingerprinting & Tethered Identity (DID)

**Hardware Fingerprinting & Tethered Identity** (commercially packaged as **Hardware Anchor Identifiers (HAIs)**) represents our decentralized identity framework. It establishes absolute cryptographic non-repudiation for autonomous agents by binding their digital keys directly to the physical silicon host they execute on.

## 1. How It Works
Traditional digital certificates and private keys can be copied, stolen, or migrated to malicious server networks. The Integrity Project prevents this by deriving a W3C-compliant **Decentralized Identifier (DID)** from a unique hardware fingerprint:

1.  **Fingerprint Extraction:** During agent initialization, the SDK queries unique physical host parameters:
    *   CPU Model and hardware serialization.
    *   Host MAC address.
    *   System `machine-id` (immutable OS identifier).
2.  **DID Generation:** The parameters are parsed and hashed to generate a unique, standard-compliant string: `did:xibalba:<hardware_hash>`.
3.  **Key Binding:** A cryptographic Ed25519 key pair is generated inside a secure local enclave, and the public key is registered to the W3C DID Document. 
4.  **Tethered Telemetry:** Every telemetry batch or [Behavioral Commitment Chain](behavioral-commitment-chain.md) payload is signed using this local key. If the keys are cloned and run on a different host, the hardware signature validation fails.

## 2. Institutional Application
In regulated industries (like healthcare under HIPAA), organizations must know *exactly* which physical server processed patient records. By using tethered DIDs:
*   A hospital's IT security audit can trace an AI action back to a specific physical rack in their datacenter.
*   It eliminates rogue agent CLI injections or spoofed telemetries, since un-tethered nodes cannot generate valid DID signatures.

## 3. Related Terms
-   **BCC:** Every commitment registered on the [Behavioral Commitment Chain](behavioral-commitment-chain.md) must be signed by the agent's tethered [did](did.md) key.
-   **ZKP:** The DID document can be verified inside our [Aztec Noir Circuits](aztec-noir-circuits.md) to validate host origin while maintaining network anonymity.
-   **Paymaster:** The [Stablecoin Vault Paymaster](../entities/stablecoin-vault-paymaster.md) checks the registered DID document to verify staking eligibility before sponsoring gas.
