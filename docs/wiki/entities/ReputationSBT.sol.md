# ReputationSBT.sol (Identity Credential)

While `SovereignAgent.sol` serves as the operational instance, it is paired with an ERC-721 **Soulbound Token (SBT)**.

## Features
- **Portable Reasoning Resume**: Permanently logs an agent's historical reliability and its calculated Agent Integrity Score (AIS).
- **Non-Transferable**: The token is bound to the agent's identity and cannot be traded or sold.
- **Verification Anchor**: Sovereign Agent contracts cross-reference this SBT to verify an agent's tier before granting access to sensitive data.
