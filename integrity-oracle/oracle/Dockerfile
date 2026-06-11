# =====================================================================
# Dockerfile for Integrity Protocol Oracle (Rust/Axum)
# =====================================================================

# --- 1. Builder Stage ---
# Use the official Rust image as a build environment.
# We pin to a specific version for deterministic builds.
FROM rust:1.78 as builder

# Set up the working directory and install dependencies
WORKDIR /usr/src/oracle
COPY . .
RUN apt-get update && apt-get install -y libpq-dev build-essential

# Build the Rust application in release mode
# The --release flag enables optimizations.
RUN cargo install --path . --root /usr/local/cargo

# --- 2. Final Stage ---
# Use a minimal "distroless" image for the final container.
# This reduces the attack surface by removing unnecessary shells and tools.
FROM gcr.io/distroless/cc-debian12

# Copy the compiled binary from the builder stage
COPY --from=builder /usr/local/cargo/bin/oracle /usr/local/bin/oracle

# Expose the port the Axum server will run on
EXPOSE 8080

# Set the entrypoint for the container. When the container starts,
# it will execute our compiled Rust application.
CMD ["/usr/local/bin/oracle"]
