# PHI Provenance Microservice: Phase 1 TODO List

This document outlines the initial engineering tasks for Phase 1 of the PHI Provenance Microservice MVP: **Core Signing & Verification**. These tasks are derived directly from the `phi_provenance_devil_advocate_plan.md` and prioritize setting up the foundational components.

## Phase 1: Core Signing & Verification

### 1. Project Setup & Initial Dependencies
- [ ] Initialize a new Rust project `phi-provenance-service`.
  - `cargo new phi-provenance-service --bin`
- [ ] Add core dependencies to `Cargo.toml`:
  - `actix-web` (for HTTP API)
  - `serde`, `serde_json` (for serialization/deserialization)
  - `ring` (for cryptographic primitives: hashing and signing)
  - `rand` (for secure random number generation)
  - `chrono` (for timestamping, if needed for nonces/context)
  - `tracing`, `tracing-subscriber` (for structured logging)

### 2. PHI Ingestion & Pre-processing Module
- [ ] Define the input data structure for PHI (e.g., a `struct` representing the raw PHI payload).
  - **Devil's Advocate Note:** Ensure strict schema validation to prevent data injection attacks.
- [ ] Implement PHI normalization logic.
  - **Devil's Advocate Note:** Ensure deterministic normalization to avoid hash mismatches for identical data.
- [ ] Implement PHI hashing logic using SHA-256.
  - **Devil's Advocate Note:** Use `ring`'s secure hashing functions.

### 3. Cryptographic Signing Module
- [ ] Design and implement a `SigningService` struct.
- [ ] Implement a method to generate Ed25519 key pairs (for local development/testing with a mock KMS).
  - **Devil's Advocate Note:** For production, keys will come from an HSM/KMS. Ensure that ephemeral key generation for testing is truly secure and isolated.
- [ ] Implement a method to sign a given PHI hash using the generated private key (Ed25519).
  - **Devil's Advocate Note:** Ensure constant-time operations for signing to mitigate side-channel attacks.
  - Include a timestamp and a nonce in the signed payload to prevent replay attacks.
- [ ] Implement a basic "mock" KMS interface for development, which can store and retrieve private keys from memory or a secure local file (for testing ONLY).

### 4. Signature Verification Module
- [ ] Implement a method to verify a PHI hash against a given signature and public key (Ed25519).
  - **Devil's Advocate Note:** Ensure constant-time verification.
  - Validate timestamp and nonce to prevent replay attacks.
- [ ] Implement a basic "mock" Public Key Infrastructure (PKI) for development, which can store and retrieve public keys associated with identifiers.

### 5. API Endpoints (using `actix-web`)
- [ ] Create an `actix-web` application.
- [ ] Implement an `/sign` endpoint:
  - Accepts raw PHI (e.g., JSON payload).
  - Calls PHI ingestion/pre-processing and cryptographic signing.
  - Returns the signed PHI, signature, public key identifier, and any other relevant metadata.
  - **Devil's Advocate Note:** Implement basic input validation and error handling; avoid verbose error messages.
- [ ] Implement a `/verify` endpoint:
  - Accepts signed PHI, signature, and public key identifier.
  - Calls signature verification.
  - Returns a boolean indicating validity and any relevant verification status.
  - **Devil's Advocate Note:** Implement basic input validation and error handling; avoid verbose error messages.
- [ ] Implement basic HTTP server setup.

### 6. Logging & Error Handling
- [ ] Configure `tracing` for structured logging.
  - **Devil's Advocate Note:** Ensure no raw PHI or sensitive key material is logged. Implement PHI redaction/masking for logs.
- [ ] Implement robust error handling across all modules and API endpoints.

### 7. Initial Testing
- [ ] Write unit tests for PHI hashing.
- [ ] Write unit tests for cryptographic signing and verification (happy path).
- [ ] Write integration tests for the `/sign` and `/verify` API endpoints with mock keys.

---
**Next Actions:** Begin implementing these tasks sequentially. Each completed task should be marked off.
