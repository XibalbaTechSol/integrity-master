# Contributing to Xibalba Integrity Protocol

Welcome! This monorepo contains all components for the Xibalba Integrity Protocol.

## Monorepo Structure

We use a polyglot monorepo structure. Each project is contained in its own top-level directory.
You can find the list of active packages in the main `README.md`.

## Tooling

To orchestrate builds and tests across the monorepo, use the root `Makefile`:

- `make install` - Install dependencies for all active packages
- `make build` - Build all packages
- `make test` - Run tests for all packages

For running local infrastructure (Postgres, Redis, Backend, etc.), use Docker Compose:
```bash
docker-compose up -d
```

## Conventions

- **Directory Names**: Use `kebab-case` for new projects (e.g., `my-new-service`).
- **Secrets**: Never commit `.env` files. Copy `.env.example` to `.env` locally.
- **Commits**: Please ensure all tests pass before opening a Pull Request. CI will automatically run tests for modified packages.
