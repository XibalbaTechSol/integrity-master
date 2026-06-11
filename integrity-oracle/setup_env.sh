#!/bin/bash

# Integrity Protocol Environment Setup Script
# Run this with sudo to install essential build tools.

echo "Updating package list..."
apt-get update

echo "Installing essential build tools (gcc, g++, make, libpq-dev)..."
apt-get install -y build-essential libpq-dev

echo "Build tools installation complete."
