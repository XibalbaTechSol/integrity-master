# PHI Provenance & HSM Signing Service v2.0 🏥

High-performance Rust service for point-of-origin Protected Health Information (PHI) hashing and institutional-grade signing.

## Core Mandates
- **Absolute Provenance**: Every clinical record is hashed and signed at the moment of creation.
- **Hardware Binding**: All signing keys are mandatory-bound to **AWS KMS HSM** to prevent private key exfiltration.
- **FHIR Compliance**: Native interceptors for HL7 FHIR resources ensuring interoperability with modern EMRs.

## Features
- **Deterministic Hashing**: Canonicalizes JSON payloads before hashing to ensure consistent state roots.
- **EMR Gateway**: High-throughput `/v1/emr/sign` endpoint for real-time data stream signing.
- **Forensic Audit Trail**: Generates cryptographic evidence compatible with `AuditShield.sol`.

## API Reference

### POST `/v1/emr/sign`
Signs a FHIR resource and returns a provenance-verified wrapper.

**Request:**
```json
{
  "resourceType": "Observation",
  "id": "obs-9912",
  "status": "final",
  "code": { "text": "Heart Rate" },
  "valueQuantity": { "value": 72, "unit": "bpm" }
}
```

**Response:**
```json
{
  "resourceType": "Observation",
  "id": "obs-9912",
  "status": "XIBALBA_PROVENANCE_VERIFIED",
  "hsm_hash": "0xabc...",
  "hsm_signature": "0x123...",
  "signing_service": "Xibalba PHI Provenance Gateway v2.0",
  "timestamp": "2026-06-04T12:00:00Z"
}
```

## Build & Run
```bash
export PHI_KMS_KEY_ID="alias/xibalba-phi-hsm"
cargo run --release
```
