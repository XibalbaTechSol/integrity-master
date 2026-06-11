# SDK Internal Reference

This document details the internal mechanisms of the Integrity SDK, focusing on cryptographic provenance and measurement heuristics.

## Measurement Heuristics

### Entropy Measurement
The SDK calculates local logprobability entropy on LLM completion arrays:
$H = -\frac{1}{N} \sum_{i=1}^N p(t_i) \log p(t_i)$

### Grounding Heuristics
N-gram overlap analysis between retrieval context and completion to detect semantic drift.

## Cryptographic Provenance

### Hardware Binding
The SDK extracts:
- Machine ID (`/etc/machine-id`)
- MAC Address
- CPU Microcode
These are hashed to create the `did:xibalba` identifier.

### Offline Moat
Signed telemetry is stored in `~/.integrity/offline_moat.db` using SQLite with HMAC-SHA256 row-level protection.
