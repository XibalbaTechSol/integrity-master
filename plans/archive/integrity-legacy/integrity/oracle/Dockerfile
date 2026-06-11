# --- Stage 1: Build Stage ---
FROM rust:slim-bookworm AS builder

# Install build dependencies (cc, gcc, build-essential, pkg-config)
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/integrity-oracle

# Copy build manifest files
COPY Cargo.toml Cargo.lock build.rs ./
COPY bb_rs/Cargo.toml ./bb_rs/
COPY bb_rs/src ./bb_rs/src

# Create dummy src/main.rs to build dependencies and cache them
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release

# Remove dummy files
RUN rm -rf src/main.rs target/release/deps/oracle*

# Copy real source code
COPY src ./src

# Build the final release binary
RUN cargo build --release

# --- Stage 2: Runtime Stage ---
FROM debian:bookworm-slim

# Install runtime dependencies (libssl, ca-certificates, libc)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libc6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /usr/src/integrity-oracle/target/release/oracle /app/oracle

# Expose Axum listening port
EXPOSE 3001

# Run the binary
ENTRYPOINT ["/app/oracle"]
