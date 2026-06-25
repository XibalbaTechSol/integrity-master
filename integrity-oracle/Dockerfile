FROM rust:latest AS builder

WORKDIR /app
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

COPY . .

# Build the oracle backend specifically
RUN cargo build --release --bin backend

# Runtime Stage
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates libssl-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=builder /app/target/release/backend /app/oracle-backend

CMD ["./oracle-backend"]
