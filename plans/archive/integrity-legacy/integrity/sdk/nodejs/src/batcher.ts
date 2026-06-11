export interface TelemetryEvent {
  entropy: number;
  grounding: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ProofPayload {
  agent_id: string;
  zk_proof: string;
  nonce: number;
  batch_size: number;
}

/**
 * Thread-safe telemetry batcher.
 * Accumulates high-frequency telemetry events and flushes them
 * when either the batch size limit or the time interval is exceeded.
 */
export class TelemetryBatcher {
  private queue: TelemetryEvent[] = [];
  private batchSizeLimit: number;
  private flushIntervalMs: number;
  private lastFlush: number;

  constructor(batchSizeLimit: number = 50, flushIntervalMs: number = 5000) {
    this.batchSizeLimit = batchSizeLimit;
    this.flushIntervalMs = flushIntervalMs;
    this.lastFlush = Date.now();
  }

  add(event: TelemetryEvent): void {
    this.queue.push(event);
  }

  shouldFlush(): boolean {
    if (this.queue.length >= this.batchSizeLimit) return true;
    if (this.queue.length > 0 && Date.now() - this.lastFlush >= this.flushIntervalMs) return true;
    return false;
  }

  drain(): TelemetryEvent[] {
    const batch = [...this.queue];
    this.queue = [];
    this.lastFlush = Date.now();
    return batch;
  }
}
