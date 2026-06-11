#!/bin/bash
set -e

# Define paths
SRC_DIR="/home/xibalba/integrity/oracle"
DEST_DIR="$SRC_DIR/bin"
BINARY_NAME="oracle"

echo "=== Starting Host Compilation ==="

# Set environment path for Rust/Cargo tools
export PATH="/home/xibalba/snap/gemini-cli/31/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin:$PATH"

# Go to source directory
cd "$SRC_DIR"

# Clean target lock or previous builds if any
cargo clean

# Run compilation
echo "Compiling the oracle backend..."
cargo build --release

# Ensure target bin directory exists
mkdir -p "$DEST_DIR"

# Copy compiled executable to destination
echo "Deploying binary to $DEST_DIR..."
cp "target/release/$BINARY_NAME" "$DEST_DIR/"
chmod +x "$DEST_DIR/$BINARY_NAME"

# Set correct owner to the user running the sandbox
# Note: xibalba is the local user
chown -R xibalba:xibalba "$DEST_DIR"

echo "=== Host Compilation & Deployment Completed Successfully! ==="
