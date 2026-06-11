# Xibalba Solutions: Integrity Protocol Implementation Gap Analysis & Architectural Specification

**Document Version:** 1.0  
**Author:** Xibalba Systems Architect  
**Status:** ACTIVE  
**Security Level:** CONFIDENTIAL  
**Compliance Target:** HIPAA (45 CFR § 164.312), FIPS 140-2 Level 3  

---

## 1. Executive Summary

This document addresses critical implementation gaps identified during the transition of the **Integrity Protocol MVP** to production. The active codebase operates on several mock boundaries—primarily hardcoded signature placeholders, bypassable Zero-Knowledge (ZK) proof validations, and unauthenticated telemetry endpoints. 

To satisfy regulatory health sector standards (HIPAA) and achieve enterprise-grade security, these gaps must be resolved by:
1. Replacing mock paymaster signatures with an asymmetric HSM-backed AWS KMS / HashiCorp Vault transit engine.
2. Integrating native C-FFI bindings to Aztec's C++ Barretenberg verifier, accompanied by a non-blocking worker queue to prevent Tokio executor thread starvation.
3. Establishing mutual TLS (mTLS) and API Gateway policies at the network layer to secure Protected Health Information (PHI) transit.

---

## 2. Gap 1: Mock Key Management & HSM Integration

### 2.1. Current State Gap
In `backend/src/main.rs:853` (within the `POST /v1/paymaster/sponsor` endpoint), the service uses a static mock signature string:
```rust
let mock_sig = "0x_ORACLE_SIGNATURE_PLACEHOLDER_";
```
This placeholder is concatenated directly into the `paymaster_and_data` response block. In a production environment, the Paymaster must cryptographically sign the `UserOperation` hash using a secure, non-extractable private key to guarantee gas sponsorship legitimacy and prevent unauthorized drainage of the paymaster vault.

### 2.2. Architectural Target State (AWS KMS SECP256K1)
To protect the private signing key from memory inspection and leakage:
1. The signing key is provisioned in AWS KMS as an asymmetric key pair with the `ECC_SEC_P256K1` key spec and `SIGN_VERIFY` usage.
2. The Axum backend calls the AWS KMS API (`kms:Sign`) with the digest of the `UserOperation` (EIP-712 standard).
3. The raw DER signature returned by AWS KMS is parsed, normalized to EVM standard (R, S, V), and returned.

```
[Client Request] ──> [Axum Endpoint] ──> [Hash UserOp] ──> [AWS KMS Sign API]
                                                                  │
[Sponsored Tx]   <── [Return Signature (R, S, V)] <── [EVM Format] <── [DER Signature]
```

### 2.3. Production Rust Implementation Specification
Add the following service implementation using the official `aws-sdk-kms` crate:

```rust
use aws_config::SdkConfig;
use aws_sdk_kms::Client as KmsClient;
use aws_sdk_kms::primitives::Blob;
use aws_sdk_kms::types::{MessageType, SigningAlgorithmSpec};
use ethers::types::{Signature, U256};
use std::env;

pub struct KmsSigner {
    client: KmsClient,
    key_id: String,
}

impl KmsSigner {
    pub async fn new(sdk_config: &SdkConfig) -> Self {
        let key_id = env::var("AWS_KMS_PAYMASTER_KEY_ID")
            .expect("AWS_KMS_PAYMASTER_KEY_ID environment variable not set");
        let client = KmsClient::new(sdk_config);
        Self { client, key_id }
    }

    /// Signs a 32-byte UserOperation hash using SECP256K1 on AWS KMS.
    pub async fn sign_user_op_hash(&self, hash: [u8; 32]) -> Result<Signature, String> {
        let response = self.client
            .sign()
            .key_id(&self.key_id)
            .message(Blob::new(hash.to_vec()))
            .message_type(MessageType::Digest)
            .signing_algorithm(SigningAlgorithmSpec::EccSecgSecp256K1)
            .send()
            .await
            .map_err(|e| format!("KMS signing error: {:?}", e))?;

        let signature_blob = response
            .signature()
            .ok_or_else(|| "No signature returned from KMS".to_string())?;

        self.decode_der_to_ethers_sig(signature_blob.as_ref(), hash)
    }

    /// Parses ASN.1 DER ECDSA signature format and translates to Ethereum r, s, v format.
    fn decode_der_to_ethers_sig(&self, der: &[u8], hash: [u8; 32]) -> Result<Signature, String> {
        // ASN.1 DER Structure: 0x30 [total_len] 0x02 [r_len] [r] 0x02 [s_len] [s]
        if der.len() < 8 || der[0] != 0x30 {
            return Err("Invalid DER prefix".to_string());
        }

        let mut offset = 2;

        // Parse R
        if der[offset] != 0x02 {
            return Err("Invalid DER integer tag for R".to_string());
        }
        let r_len = der[offset + 1] as usize;
        offset += 2;
        let r_bytes = &der[offset..offset + r_len];
        offset += r_len;

        // Parse S
        if der[offset] != 0x02 {
            return Err("Invalid DER integer tag for S".to_string());
        }
        let s_len = der[offset + 1] as usize;
        offset += 2;
        let s_bytes = &der[offset..offset + s_len];

        // Format R and S to 32 bytes (stripping any leading padding byte from DER)
        let r = parse_der_integer(r_bytes)?;
        let s = parse_der_integer(s_bytes)?;

        // Normalize S values to the lower half order to satisfy SECP256K1 malleability checks (EIP-2)
        let s_normalized = normalize_s(s);

        // Recover V parity byte (0 or 1 on modern EVM, or 27/28 legacy)
        // Since AWS KMS does not return the recovery ID (V), we compute it by testing candidate V values.
        let paymaster_pubkey = env::var("PAYMASTER_PUBLIC_KEY")
            .map(|s| s.parse::<ethers::types::Address>().ok())
            .flatten()
            .expect("PAYMASTER_PUBLIC_KEY invalid or missing");

        for v in 27..=28 {
            let sig = Signature { r, s: s_normalized, v };
            if let Ok(recovered_addr) = sig.recover(hash) {
                if recovered_addr == paymaster_pubkey {
                    return Ok(sig);
                }
            }
        }

        Err("Failed to recover valid V parameter for KMS signature".to_string())
    }
}

fn parse_der_integer(bytes: &[u8]) -> Result<U256, String> {
    if bytes.is_empty() {
        return Err("Empty integer bytes".to_string());
    }
    // DER integers are signed; if positive, they might have a leading zero byte to preserve sign bit.
    let start = if bytes[0] == 0x00 && bytes.len() > 1 { 1 } else { 0 };
    if bytes.len() - start > 32 {
        return Err("Integer overflow: larger than 32 bytes".to_string());
    }
    Ok(U256::from_big_endian(&bytes[start..]))
}

fn normalize_s(s: U256) -> U256 {
    // SECP256K1 curve group order N
    let n = U256::from_dec_str("115792089237316195423570985008687907852837564279074904382605163141518161494337").unwrap();
    let half_n = n >> 1;
    if s > half_n {
        n - s
    } else {
        s
    }
}
```

---

## 3. Gap 2: Native FFI ZK-Proof Verification Engine

### 3.1. Current State Gap
In `backend/src/main.rs:1003` (within the `ingest_telemetry` function), ZK validation is implemented as a simple presence check:
```rust
let zk_verified = payload.zk_proof.is_some() && !payload.zk_proof.as_ref().unwrap().is_empty();
```
Because the system does not actually evaluate the cryptographically serialized bytes against the verification key (`vk`), a client can bypass the "Verifiable Compute" rule and avoid black-box AIS caps (800 threshold limit) by sending any non-empty string in the `zk_proof` field.

### 3.2. C-FFI Integration to Aztec Barretenberg
To parse and verify UltraPlonk proofs generated from our Noir circuits, we must bind the backend directly to the compiled C++ Barretenberg library.

```
[Telemetry Payload] ──> [Axum Route] ──> [Extract Proof & Public Inputs]
                                                        │
[Client Response]   <── [Ok/Err] <── [Blocking Worker Pool (Tokio)] <── [C-FFI Barretenberg Verify]
```

#### FFI Bindings Definition (`verifier_ffi.rs`)
```rust
use std::os::raw::c_uchar;

#[link(name = "barretenberg")]
extern "C" {
    /// Calls the Aztec Barretenberg C++ verifier for UltraPlonk proofs.
    /// Returns 1 if valid, 0 if invalid.
    pub fn barretenberg_verify_proof(
        proof_buf: *const c_uchar,
        proof_len: u32,
        vk_buf: *const c_uchar,
        vk_len: u32,
        pub_inputs_buf: *const c_uchar,
        pub_inputs_len: u32,
    ) -> u8;
}
```

### 3.3. Asynchronous Worker Queue for Proof Verification
ZK proof verification is heavily CPU-bound. If called directly within Axum's async runtime execution threads, it will block the Tokio event loop, starving network I/O and causing high-latency drops. We mitigate this by establishing a thread-safe `ZkProofVerifier` service that offloads these checks to OS-level worker threads.

```rust
use tokio::sync::{mpsc, oneshot};
use std::sync::Arc;

pub struct VerificationRequest {
    pub proof: Vec<u8>,
    pub public_inputs: Vec<u8>,
    pub response_tx: oneshot::Sender<bool>,
}

#[derive(Clone)]
pub struct ZkProofVerifier {
    tx: mpsc::Sender<VerificationRequest>,
    vk: Arc<Vec<u8>>,
}

impl ZkProofVerifier {
    pub fn new(vk_path: &str, queue_capacity: usize) -> Self {
        let vk = Arc::new(std::fs::read(vk_path).expect("Failed to read Noir verification key (.vk)"));
        let (tx, mut rx) = mpsc::channel::<VerificationRequest>(queue_capacity);
        let vk_clone = Arc::clone(&vk);

        // Spawn a background OS-thread worker to handle verification
        tokio::task::spawn_blocking(move || {
            while let Some(req) = rx.blocking_recv() {
                let vk = Arc::clone(&vk_clone);
                
                // Perform execution inside the dedicated CPU-bound thread pool
                let is_valid = unsafe {
                    let res = barretenberg_verify_proof(
                        req.proof.as_ptr(),
                        req.proof.len() as u32,
                        vk.as_ptr(),
                        vk.len() as u32,
                        req.public_inputs.as_ptr(),
                        req.public_inputs.len() as u32,
                    );
                    res == 1
                };

                let _ = req.response_tx.send(is_valid);
            }
        });

        Self { tx, vk }
    }

    /// Enqueues a proof verification and awaits execution safely.
    pub async fn verify_proof_async(&self, proof: Vec<u8>, public_inputs: Vec<u8>) -> Result<bool, &'static str> {
        let (response_tx, response_rx) = oneshot::channel();
        let request = VerificationRequest {
            proof,
            public_inputs,
            response_tx,
        };

        self.tx.send(request)
            .await
            .map_err(|_| "Verifier thread pool channel closed")?;

        response_rx.await
            .map_err(|_| "Verification response sender dropped")
    }
}
```

---

## 4. Gap 3: Mutual TLS (mTLS) & API Gateway Auth Policies

### 4.1. Current State Gap
The telemetry endpoint (`POST /v1/transactions/report`) does not require transport-level identity verification. Although the body payload contains a cryptographic signature, there is no validation at the network boundary. Under HIPAA Technical Safeguards (45 CFR § 164.312), data containing Protected Health Information (PHI) or transaction hashes derived from PHI must be protected against malicious eavesdropping, interception, and spoofing using secure transmission channels (Mutual TLS).

### 4.2. Network Architecture for Tier-3 Institutional Ingestion
To satisfy HIPAA security parameters:
1. **mTLS Termination at API Gateway:** The public internet boundary is protected by NGINX or AWS API Gateway, terminating TLS using strict mutual authentication.
2. **Private CA Certificate Provisioning:** Only clients with a client certificate signed by the Xibalba Root Certificate Authority are permitted to make network connections to Tier-3 endpoints.
3. **Gateway Header Propagation:** The gateway verifies the certificate, extracts the Common Name (CN) / Organization (O) representing the verified Agent's EVM identity, and forwards it to the Axum backend via headers.

```
[Tier 3 Client] ──( mTLS: Port 443 )──> [API Gateway (NGINX)] ──> [Axum Backend (HTTP)]
 (Valid Client Cert)                      - Terminate TLS            - Read Headers
                                          - Check Certificate Rev.   - Validate Identity
                                          - Inject X-Client-Cert-DN
```

### 4.3. API Gateway Policy (NGINX Configuration)
Add the following strict mTLS configuration template to isolate the ingestion route:

```nginx
# Xibalba Solutions: NGINX Ingestion Gateway Configuration
server {
    listen 443 ssl http2;
    server_name telemetry.xibalbasolutions.com;

    # Server TLS Credentials
    ssl_certificate /etc/ssl/certs/xibalba_server.crt;
    ssl_certificate_key /etc/ssl/private/xibalba_server.key;

    # Enforce Modern TLS Policies (TLSv1.3 only for HIPAA Compliance)
    ssl_protocols TLSv1.3;
    ssl_ciphers TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256;
    ssl_prefer_server_ciphers on;

    # Enable Mutual TLS Verification
    ssl_client_certificate /etc/ssl/certs/xibalba_client_ca.crt;
    ssl_verify_client on;
    ssl_verify_depth 2;

    # Enforce CRL (Certificate Revocation List) to instantly block retired agents
    ssl_crl /etc/ssl/certs/xibalba_revoked_clients.crl;

    location /v1/transactions/report {
        # Block connection if the client certificate verification failed
        if ($ssl_client_verify != SUCCESS) {
            return 403;
        }

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Forward the client certificate identity parameters to Axum
        proxy_set_header X-Client-Verify $ssl_client_verify;
        proxy_set_header X-Client-DN $ssl_client_s_dn; # e.g., CN=agent_eth_address, O=Xibalba Solutions
        proxy_set_header X-Client-Serial $ssl_client_serial;

        proxy_pass http://127.0.0.1:8080;
    }
}
```

### 4.4. Axum Backend Header Enforcement
Integrate a strict Extractor in the Axum backend to capture and validate the gateway signature:

```rust
use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};

pub struct GatewayIdentifiedAgent {
    pub eth_address: String,
}

#[async_trait]
impl<S> FromRequestParts<S> for GatewayIdentifiedAgent
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // 1. Verify that the Gateway completed Client Cert validation
        let client_verify = parts.headers
            .get("X-Client-Verify")
            .and_then(|h| h.to_str().ok())
            .ok_or((StatusCode::UNAUTHORIZED, "Missing gateway security headers"))?;

        if client_verify != "SUCCESS" {
            return Err((StatusCode::FORBIDDEN, "Client certificate verification failed at gateway"));
        }

        // 2. Parse Distinguished Name (DN) to verify client identity
        let client_dn = parts.headers
            .get("X-Client-DN")
            .and_then(|h| h.to_str().ok())
            .ok_or((StatusCode::UNAUTHORIZED, "Distinguished Name header missing"))?;

        let eth_address = extract_address_from_dn(client_dn)
            .ok_or((StatusCode::BAD_REQUEST, "Malformed client credentials in certificate DN"))?;

        Ok(GatewayIdentifiedAgent { eth_address })
    }
}

fn extract_address_from_dn(dn: &str) -> Option<String> {
    // Expected format: CN=0x[EVM_ADDRESS],O=Xibalba Solutions
    for part in dn.split(',') {
        if part.starts_with("CN=") {
            let addr = &part[3..];
            if addr.starts_with("0x") && addr.len() == 42 {
                return Some(addr.to_string());
            }
        }
    }
    None
}
```

---

## 5. Summary Matrix & HIPAA Alignment

| Architectural Component | MVP / Current State Gap | Target Production Specification | HIPAA (45 CFR) Mapping |
| :--- | :--- | :--- | :--- |
| **Key Management** | Hardcoded mock string signature (`0x_ORACLE_...`) in Paymaster endpoint. | Integration with AWS KMS / HSM via asymmetric SECP256K1 key signing call. | **§ 164.312(a)(2)(iv):** Encryption and Decryption keys must protect sensitive access identities. |
| **ZK Verification** | Boolean check of string presence in payload. Proof bypassable. | Native C-FFI to Barretenberg library with Tokio blocking executor worker thread pool. | **§ 164.312(c)(1):** Transmission Integrity. Validates that incoming metrics are mathematically verified. |
| **Endpoint Security** | Public API routes without network-layer authorization rules. | Mutual TLS (mTLS) terminated at NGINX Gateway, client cert verification, address mapping. | **§ 164.312(e)(1):** Transmission Security. Enforces bi-directional trust and access control over transit. |

---

**Approval:** Xibalba Solutions LLC  
**Regulatory Review Status:** MANDATORY FOR PHASE 1 PRODUCTION DEPLOYMENT
