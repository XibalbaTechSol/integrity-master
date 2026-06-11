/**
 * Xibalba Integrity SDK — Framework Interceptors
 * 
 * Drop-in wrappers and middleware for popular agent frameworks.
 */

import { IntegrityClient } from "./index";
import { TelemetryEvent } from "./types";

/**
 * Hermes Gateway Middleware
 * 
 * Automatically captures latency and performance for all requests passing 
 * through a Hermes Node.js gateway.
 */
export const HermesIntegrityMiddleware = (client: IntegrityClient) => {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const dealId = `hermes_${Math.random().toString(36).substring(2, 10)}`;

    // Intercept response finishing
    res.on("finish", () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      
      const event: TelemetryEvent = {
        eventType: "inference", // Changed from event_type
        latencyMs: duration,
        tokensIn: 0,
        tokensOut: 0,
        model: req.headers["x-hermes-model"] || "hermes-default",
        accuracy: status < 400 ? 1.0 : 0.0,
        metadata: {
          source: "hermes_middleware",
          deal_id: dealId,
          path: req.path,
          method: req.method
        }
      };

      client.trackEvent(event);
      
      // Inject Integrity Seal into the response for the client to verify
      res.setHeader("X-Xibalba-Seal", IntegrityClient.computeHash(dealId, duration, event.accuracy, 0));
    });

    next();
  };
};

/**
 * OpenClaw Node.js Interceptor
 * 
 * Intercepts tool execution and LLM calls in OpenClaw environments.
 */
export class OpenClawInterceptor {
  private client: IntegrityClient;

  constructor(client: IntegrityClient) {
    this.client = client;
  }

  /**
   * Wrap an OpenClaw provider or tool executor.
   */
  wrap(target: any) {
    const client = this.client;
    
    return new Proxy(target, {
      get(obj, prop) {
        const original = obj[prop];
        if (typeof original !== "function") return original;

        return async (...args: any[]) => {
          const start = Date.now();
          try {
            const result = await original.apply(obj, args);
            const duration = Date.now() - start;
            
            client.trackEvent({
              eventType: "tool_call",
              latencyMs: duration,
              tokensIn: 0,
              tokensOut: 0,
              model: "openclaw",
              accuracy: 1.0,
              metadata: { tool: prop.toString(), source: "openclaw_interceptor" }
            });
            
            return result;
          } catch (err) {
            const duration = Date.now() - start;
            client.trackEvent({
              eventType: "tool_call",
              latencyMs: duration,
              tokensIn: 0,
              tokensOut: 0,
              model: "openclaw",
              accuracy: 0.0,
              metadata: { tool: prop.toString(), error: true }
            });
            throw err;
          }
        };
      }
    });
  }
}
