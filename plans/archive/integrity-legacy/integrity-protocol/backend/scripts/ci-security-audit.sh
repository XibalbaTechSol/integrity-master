#!/bin/bash
set -e

echo "--- 🛡️ Running Automated Security Audit ---"

# Python Security Audit
echo "[*] Running Bandit..."
bandit -r services/ sdk/python/ -ll -q

# Solidity Security Audit
echo "[*] Running Slither..."
# Check if slither is installed
if command -v slither &> /dev/null; then
    slither contracts/ --detect reentrancy-eth,reentrancy-no-eth,shadowing-state
else
    echo "[-] Slither not found. Skipping."
fi

echo "--- ✅ Security Audit Complete ---"
