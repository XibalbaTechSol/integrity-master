import * as http from "http";
import { TelemetryBatcher, TelemetryEvent, ProofPayload } from "./batcher";
import { NoirProver } from "./prover";

export { TelemetryBatcher, TelemetryEvent, ProofPayload } from "./batcher";
export { NoirProver } from "./prover";

export interface IntegrityClientOptions {
  agentId: string;
  oracleUrl?: string;
  batchSize?: number;
  flushIntervalMs?: number;
}

/**
 * Main entry point for NodeJS/TypeScript agents to interact with the Integrity Protocol.
 * Manages background batching via setInterval and async submission to the Axum Oracle.
 */
export class IntegrityClient {
  private agentId: string;
  private oracleUrl: URL;
  private batcher: TelemetryBatcher;
  private prover: NoirProver;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  constructor(options: IntegrityClientOptions) {
    this.agentId = options.agentId;
    this.oracleUrl = new URL(options.oracleUrl ?? "http://localhost:3000/ingest");
    this.batcher = new TelemetryBatcher(options.batchSize, options.flushIntervalMs);
    this.prover = new NoirProver(this.agentId);

    // Start background flush loop — non-blocking, does not interfere with agent inference
    this.intervalHandle = setInterval(() => {
      if (this.batcher.shouldFlush()) {
        const batch = this.batcher.drain();
        this.processAndSend(batch);
      }
    }, 500);
  }

  /**
   * Logs a single telemetry event. Returns immediately without blocking.
   */
  logTelemetry(entropy: number, grounding: number, metadata?: Record<string, unknown>): void {
    this.batcher.add({
      entropy,
      grounding,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Generates a ZK proof for the batch and transmits to the Oracle.
   */
  private processAndSend(batch: TelemetryEvent[]): void {
    if (batch.length === 0) return;

    const proof = this.prover.generateProof(batch);
    const body = JSON.stringify(proof);

    const req = http.request(
      {
        hostname: this.oracleUrl.hostname,
        port: this.oracleUrl.port,
        path: this.oracleUrl.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: 5000,
      },
      (res) => {
        if (res.statusCode !== 202) {
          console.error(`[IntegrityClient] Oracle returned ${res.statusCode}`);
        }
      }
    );

    req.on("error", (err) => {
      console.error(`[IntegrityClient] Transmission failed: ${err.message}`);
    });

    req.write(body);
    req.end();
  }

  /**
   * Clean shutdown — flushes the final batch and clears the interval.
   */
  shutdown(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    const remaining = this.batcher.drain();
    if (remaining.length > 0) {
      this.processAndSend(remaining);
    }
  }
}
