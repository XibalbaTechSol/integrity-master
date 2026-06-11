# Integrity Protocol: Authoritative Contracts Repository

This directory serves as the **single source of truth** for all core smart contracts within the Integrity Protocol ecosystem. All agents, identity registries, and protocol-specific logic are managed and version-controlled here.

## Overview
This repository contains the source code for the fundamental protocol primitives:
- **`SovereignAgent.sol`**: On-chain identity and role-based access control for AI agents.
- **`SmartBAA.sol`**: Executable HIPAA legal agreements.
- **`AgentFactory.sol`**: Factory for deploying and managing identity-bound agents.

---

## 🛠️ Development & Tooling
This project is built using [Foundry](https://book.getfoundry.sh/).

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Build
```bash
forge build
```

### Testing
```bash
forge test
```

### Environment Configuration
| Variable | Description |
| :--- | :--- |
| `RPC_URL` | Endpoint for the target network. |
| `PRIVATE_KEY` | Deployer account private key. |

---

## 🤝 Contribution Guidelines
We welcome contributions! Please follow the standard GitHub flow:
1. Fork the repo.
2. Create a feature branch.
3. Ensure all `forge test` cases pass.
4. Submit a Pull Request.

## 🛠️ Troubleshooting
- **Build Errors:** Ensure `forge` is up to date (`forge update`) and `remappings.txt` is correctly configured in your project root.

---

## 📜 License
This project is licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for details.
