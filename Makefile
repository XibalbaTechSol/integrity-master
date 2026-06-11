.PHONY: help install build test lint clean

help:
	@echo "Available targets: install build test lint clean"

# === Per-package targets ===
install-sdk:
	cd integrity-sdk && uv sync

install-cli:
	cd integrity-cli && pip install -e .

install-dashboard:
	cd integrity-dashboard && npm ci

install-oracle:
	cd integrity-oracle && cargo build

install-contracts:
	cd contracts && forge install

install: install-sdk install-cli install-dashboard install-oracle install-contracts

build-dashboard:
	cd integrity-dashboard && npm run build

build-oracle:
	cd integrity-oracle && cargo build --release

build-contracts:
	cd contracts && forge build

build: build-dashboard build-oracle build-contracts

test-sdk:
	cd integrity-sdk && uv run pytest

test-oracle:
	cd integrity-oracle && cargo test

test-contracts:
	cd contracts && forge test

test-dashboard:
	cd integrity-dashboard && npm run lint

test: test-sdk test-oracle test-contracts test-dashboard
