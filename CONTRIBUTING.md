# Contributing to the Xibalba Integrity Protocol

First off, thank you for considering contributing to the Integrity Protocol! It's people like you that make the autonomous agent economy secure, transparent, and robust.

This document serves as a guide for anyone looking to contribute to the codebase, whether you're fixing a typo, submitting a bug fix, or proposing a major architectural change.

## 🧠 Understanding the Architecture

Before diving into code, please ensure you understand the protocol's End-to-End Validation Lifecycle. Read our [Master README](README.md) and review the core components:
- **Node 1:** Smart Contracts (`contracts/`)
- **Node 3:** BCC Middleware (`bcc_middleware/`)
- **Node 4:** Agent SDK (`integrity-sdk/`)
- **Node 5:** Rust Oracle (`integrity-oracle/`)

## 🛠️ Local Development Setup

We use a polyglot monorepo structure. Each project is contained in its own top-level directory. We provide a `Makefile` to orchestrate spinning up the various microservices easily.

### Prerequisites
- [Docker & Docker Compose](https://www.docker.com/)
- [Node.js (v18+)](https://nodejs.org/) & `npm`
- [Rust](https://rustup.rs/) (latest stable)
- [Foundry](https://book.getfoundry.sh/) (for contract development)
- Python 3.10+

### Monorepo Tooling

To orchestrate builds and tests across the monorepo, use the root `Makefile`:

- `make install` - Install dependencies for all active packages
- `make build` - Build all packages
- `make test` - Run tests for all packages

For running local infrastructure (Postgres, Redis, Oracle Backend, Anvil L2 node), use Docker Compose:
```bash
docker-compose up -d
```
Or simply use:
```bash
make up
```

## 🐞 Submitting Bug Reports

If you find a bug, please use the **Bug Report** issue template. Include:
1. Steps to reproduce the bug.
2. The expected behavior vs. actual behavior.
3. Your operating system, language versions (e.g., rustc 1.70, node v18), and any relevant logs.

## ✨ Proposing Features

Have an idea for a new feature? 
1. Check the existing issues to ensure it hasn't already been proposed.
2. Open a new issue using the **Feature Request** template.
3. Provide a clear architectural explanation of how the feature integrates into the protocol's Trust Metrics or Smart Contracts.

## 🚀 Pull Request Workflow

1. **Fork the Repository:** Fork the project to your own GitHub account.
2. **Create a Branch:** Create a feature branch (`git checkout -b feature/your-feature-name`).
3. **Make Changes:** Write your code.
4. **Run Tests:** Ensure you haven't broken existing logic (`make test`).
5. **Update Documentation:** If you changed an API or core behavior, update the relevant `README.md`.
6. **Submit a PR:** Push your branch and open a Pull Request against our `main` branch using the provided PR template.

## 📝 Coding Standards

- **Directory Names**: Use `kebab-case` for new projects (e.g., `my-new-service`).
- **Secrets**: Never commit `.env` files. Copy `.env.example` to `.env` locally.
- **Rust (`integrity-oracle`):** Use `cargo fmt` and `cargo clippy`.
- **Solidity (`contracts`):** Follow standard Foundry formatting. Use `forge fmt`.
- **TypeScript (`integrity-sdk`, `integrity-dashboard`):** Use Prettier and ESLint.
- **Python (`bcc_middleware`):** Follow PEP 8 guidelines. Use `black` and `flake8`.

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). We expect all contributors to be respectful and professional.

---
*Mathematically securing the agentic future, together.*
