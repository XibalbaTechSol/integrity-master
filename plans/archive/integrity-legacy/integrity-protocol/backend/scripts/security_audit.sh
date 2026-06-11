#!/bin/bash
# Xibalba Solutions: Continuous Security Audit Script (v1.0)

echo "--- 🛡️ RUNNING CONTINUOUS SECURITY AUDIT ---"

# 1. Python Audit (Bandit)
echo "[*] Running Bandit on services/ and sdk/python/..."
if ./venv/bin/bandit -r services/ sdk/python/ -x node_modules,venv; then
    echo "✅ Bandit: No critical Python issues found."
else
    echo "⚠️ Bandit: Security issues detected (see above)."
fi

# 2. Smart Contract Audit (Slither)
# Note: Requires solc and slither to be installed.
echo "[*] Running Slither on contracts/..."
if command -v slither &> /dev/null; then
    slither contracts/ --solc-remaps "@openzeppelin=$(pwd)/node_modules/@openzeppelin" || echo "⚠️ Slither: Issues detected."
else
    echo "⏭️ Slither: Not installed, skipping contract audit."
fi

# 3. Dependency Audit (npm)
echo "[*] Running npm audit on web/ and sdk/nodejs/..."
(cd web && npm audit --audit-level=high) || echo "⚠️ Web: High-severity vulnerabilities found."
(cd sdk/nodejs && npm audit --audit-level=high) || echo "⚠️ Node.js SDK: High-severity vulnerabilities found."

echo "--- 🛡️ AUDIT COMPLETE ---"
