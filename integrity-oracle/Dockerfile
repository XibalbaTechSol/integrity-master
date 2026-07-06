FROM rustlang/rust:nightly-bookworm AS builder

WORKDIR /app
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

COPY . .

# Build the oracle backend specifically with cache mounts
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/target \
    cargo build --release --bin backend

# Runtime Stage
FROM rustlang/rust:nightly-bookworm
WORKDIR /app

COPY --from=builder /app/target/release/backend /app/oracle-backend

CMD ["./oracle-backend"]
