#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# --- Configuration ---
# You can override the destination directory by passing it as the first argument.
# Default is ./bin in the project root.
DEST_DIR="${1:-./bin}"

# --- Step 1: Identify the Binary Name ---
# We extract the package name from Cargo.toml
BINARY_NAME=$(grep -m 1 '^name =' Cargo.toml | sed 's/name = "\(.*\)"/\1/')

if [ -z "$BINARY_NAME" ]; then
    echo "Error: Could not determine binary name from Cargo.toml"
    exit 1
fi

echo "--- Building '$BINARY_NAME' in release mode ---"

# --- Step 2: Compile the Program ---
# Ensure cargo is in PATH (especially for this specific environment)
export PATH="/home/xibalba/snap/gemini-cli/31/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin:$PATH"

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo "Error: cargo is not installed or not in PATH."
    exit 1
fi

# Check if a C compiler is installed (needed for linking)
if ! command -v cc &> /dev/null && ! command -v gcc &> /dev/null; then
    echo "Warning: No C compiler (cc or gcc) found. Compilation might fail if dependencies require it."
    echo "You can install it with: sudo apt update && sudo apt install build-essential"
fi

cargo build --release

# --- Step 3: Locate the Executable ---
EXECUTABLE_PATH="./target/release/$BINARY_NAME"

if [ ! -f "$EXECUTABLE_PATH" ]; then
    echo "Error: Executable not found at $EXECUTABLE_PATH"
    # Try a more aggressive search if the default path fails
    echo "Searching for executable '$BINARY_NAME' in target/release..."
    EXECUTABLE_PATH=$(find target/release -maxdepth 1 -type f -executable -name "$BINARY_NAME" | head -n 1)
fi

if [ -z "$EXECUTABLE_PATH" ] || [ ! -f "$EXECUTABLE_PATH" ]; then
    echo "Error: Could not find the compiled executable."
    exit 1
fi

# --- Step 4: Copy to the Destination ---
echo "--- Copying executable to '$DEST_DIR' ---"
mkdir -p "$DEST_DIR"

cp "$EXECUTABLE_PATH" "$DEST_DIR/"

# Make sure the copied file is executable
chmod +x "$DEST_DIR/$BINARY_NAME"

echo "Done! The executable is located at: $DEST_DIR/$BINARY_NAME"
