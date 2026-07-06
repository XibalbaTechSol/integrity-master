#!/usr/bin/env node
// generate_organic_traces.js
// Generates organic TRACE, SPAN, and compliance data by POSTing directly
// to the Integrity Oracle mock backend at http://127.0.0.1:8080.
// Uses only the built-in Node.js `http` module — zero external dependencies.

const http = require('http');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Sends an HTTP request and returns a Promise resolving to { statusCode, body }.
 */
function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body != null ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1',
      port: 8080,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

function iso() { return new Date().toISOString(); }
function txId() { return `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function traceId() { return Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(''); }
function spanId() { return Array.from({ length: 8 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(''); }

const AGENT_ADDRESS = '88d5ab08-156b-45cf-9b17-32e74a9f2690';

// ─── 1. Transaction Reports ────────────────────────────────────────────────

const transactionReports = [
  {
    action_type: 'defi_swap',
    payload: {
      protocol: 'Uniswap V4',
      token_in: 'USDC',
      token_out: 'WETH',
      amount_in: '2500.00',
      slippage_tolerance: 0.005,
      guardrail_pass_rate: 0.98,
      compliance_score: 0.95,
      risk_tier: 'low',
    },
  },
  {
    action_type: 'contract_deploy',
    payload: {
      contract_name: 'BehavioralCommitmentChain',
      chain_id: 8453,
      bytecode_hash: '0xabc123def456',
      constructor_args: ['0x67bA5D723E1F5517afF7eb980E2f73a9e17aD556', 30],
      guardrail_pass_rate: 1.0,
      compliance_score: 1.0,
      risk_tier: 'none',
    },
  },
  {
    action_type: 'bridge_transfer',
    payload: {
      source_chain: 'Ethereum Mainnet',
      dest_chain: 'Base',
      token: 'USDC',
      amount: '10000.00',
      bridge_protocol: 'LayerZero',
      guardrail_pass_rate: 0.92,
      compliance_score: 0.88,
      risk_tier: 'medium',
    },
  },
  {
    action_type: 'insurance_underwrite',
    payload: {
      policy_type: 'smart_contract_cover',
      coverage_amount_usd: 500000,
      premium_rate_bps: 150,
      protocol_covered: 'Aave V3',
      actuarial_model: 'quant_zerodrift_v2',
      guardrail_pass_rate: 0.95,
      compliance_score: 0.91,
      risk_tier: 'low',
    },
  },
  {
    action_type: 'hipaa_audit',
    payload: {
      audit_target: 'xibalba-shield',
      records_scanned: 12480,
      phi_fields_detected: 0,
      encryption_verified: true,
      access_log_integrity: true,
      guardrail_pass_rate: 1.0,
      compliance_score: 1.0,
      risk_tier: 'none',
    },
  },
  {
    action_type: 'a2a_negotiate',
    payload: {
      counterparty_agent: '0x1234abcd5678ef90',
      negotiation_topic: 'reinsurance_premium_split',
      rounds_completed: 3,
      consensus_reached: true,
      guardrail_pass_rate: 0.88,
      compliance_score: 0.85,
      risk_tier: 'low',
    },
  },
  {
    action_type: 'model_inference',
    payload: {
      model_id: 'integrity-risk-scorer-v3',
      input_features: 42,
      latency_ms: 87,
      output_confidence: 0.94,
      drift_detected: false,
      guardrail_pass_rate: 0.97,
      compliance_score: 0.96,
      risk_tier: 'low',
    },
  },
  // ── Violation report ──
  {
    action_type: 'risk_assessment',
    payload: {
      assessment_target: 'patient_record_export',
      data_classification: 'PHI',
      requested_by: 'external_service_xyz',
      guardrail_pass_rate: 0.0,
      compliance_score: 0.0,
      risk_tier: 'critical',
      violation_reason: 'Unauthorized PHI access attempt',
      violation_details: {
        blocked: true,
        escalation_sent: true,
        incident_id: `INC-${Date.now()}`,
      },
    },
  },
];

async function sendTransactionReports() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  1 ▸ Sending 8 Transaction Reports → /v1/transactions/report');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const [i, report] of transactionReports.entries()) {
    const body = {
      agent_id: AGENT_ADDRESS,
      deal_id: txId(),
      deal_amount: report.payload.amount_in ? parseFloat(report.payload.amount_in) : (report.payload.amount ? parseFloat(report.payload.amount) : 100.0),
      latency_ms: report.payload.latency_ms || 120,
      accuracy_score: report.payload.accuracy_score || 0.98,
      gpu_hours_used: report.payload.gpu_hours_used || 0.5,
      performance_variance: report.payload.entropy || 0.05,
      hitl_intervention: report.payload.hitl_intervention || false,
      verification_tier: report.payload.verification_tier || 1,
      timestamp: Math.floor(Date.now() / 1000),
      domain_id: 'global',
      metadata: {
        task: report.action_type,
        agent_traces: [
          { name: "Execute Action", message: `Initiating ${report.action_type}`, type: "thought" }
        ],
        ...report.payload
      }
    };

    try {
      const res = await request('POST', '/v1/transactions/report', body);
      const status = res.statusCode < 300 ? '✓' : '✗';
      const tag = report.payload.guardrail_pass_rate === 0.0 ? ' ⚠ VIOLATION' : '';
      console.log(`  [${i + 1}/8] ${status}  ${report.action_type.padEnd(22)} → HTTP ${res.statusCode}${tag}`);
    } catch (err) {
      console.error(`  [${i + 1}/8] ✗  ${report.action_type} → ERROR: ${err.message}`);
    }
  }
}

// ─── 2. Compliance Ingest Events ────────────────────────────────────────────

const ingestEvents = [
  {
    event_type: 'compliance_check',
    source: 'bcc_middleware',
    agent_address: AGENT_ADDRESS,
    compliance_score: 0.93,
    details: {
      policy_version: '2.1.0',
      rules_evaluated: 48,
      rules_passed: 45,
      rules_failed: 3,
      failed_rules: ['max_single_tx_value', 'counterparty_kyc_check', 'rate_limit_burst'],
    },
  },
  {
    event_type: 'violation_detected',
    source: 'xibalba-shield',
    agent_address: AGENT_ADDRESS,
    compliance_score: 0.12,
    details: {
      violation_type: 'phi_exposure',
      severity: 'critical',
      record_count: 1,
      remediation: 'auto_quarantine',
      hipaa_rule_ref: '45 CFR § 164.502(a)',
    },
  },
  {
    event_type: 'compliance_check',
    source: 'integrity-oracle',
    agent_address: AGENT_ADDRESS,
    compliance_score: 0.99,
    details: {
      zk_proof_verified: true,
      on_chain_attestation: '0xdeadbeef01',
      latency_ms: 320,
    },
  },
  {
    event_type: 'guardrail_trigger',
    source: 'integrity-sdk',
    agent_address: '0xd62982a313FfA10966e76CD9dA11708eDbb01B3f',
    compliance_score: 0.55,
    details: {
      guardrail_id: 'GR-007',
      trigger_reason: 'anomalous_token_transfer_pattern',
      action_blocked: true,
      fallback_action: 'manual_review_queue',
    },
  },
  {
    event_type: 'compliance_check',
    source: 'bcc_middleware',
    agent_address: AGENT_ADDRESS,
    compliance_score: 0.87,
    details: {
      policy_version: '2.1.0',
      rules_evaluated: 48,
      rules_passed: 42,
      rules_failed: 6,
      failed_rules: [
        'max_daily_volume',
        'geo_restriction_check',
        'counterparty_kyc_check',
        'max_single_tx_value',
        'slippage_guard',
        'gas_price_ceiling',
      ],
    },
  },
];

async function sendIngestEvents() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  2 ▸ Sending 5 Compliance Ingest Events → /v1/transactions/report');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const [i, event] of ingestEvents.entries()) {
    const body = {
      agent_id: event.agent_address || AGENT_ADDRESS,
      deal_id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      deal_amount: 0.0,
      latency_ms: event.details.latency_ms || 80,
      accuracy_score: event.compliance_score || 0.95,
      timestamp: Math.floor(Date.now() / 1000),
      domain_id: event.source || 'global',
      metadata: {
        task: event.event_type,
        agent_traces: [
          { name: "Compliance Check", message: `Running ${event.event_type} on ${event.source}`, type: "compliance" }
        ],
        ...event.details
      }
    };

    try {
      const res = await request('POST', '/v1/transactions/report', body);
      const status = res.statusCode < 300 ? '✓' : '✗';
      const scoreTag = event.compliance_score < 0.5 ? ' ⚠ LOW SCORE' : '';
      console.log(`  [${i + 1}/5] ${status}  ${event.event_type.padEnd(22)} (score ${event.compliance_score.toFixed(2)}) → HTTP ${res.statusCode}${scoreTag}`);
    } catch (err) {
      console.error(`  [${i + 1}/5] ✗  ${event.event_type} → ERROR: ${err.message}`);
    }
  }
}

// ─── 3. Agent Registration ─────────────────────────────────────────────────

async function registerAgent() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  3 ▸ Registering New Agent → /v1/agent/register');
  console.log('═══════════════════════════════════════════════════════\n');

  const body = {
    agent_id: 'hermes-organic-validator',
    alias: 'Hermes Organic Validator',
    eth_address: '0xd62982a313FfA10966e76CD9dA11708eDbb01B3f',
    capabilities: ['compliance_validation', 'phi_detection', 'risk_scoring', 'a2a_negotiation'],
    registered_at: iso(),
    metadata: {
      version: '1.0.0',
      runtime: 'integrity-oracle',
      region: 'us-central1',
    },
  };

  try {
    const res = await request('POST', '/v1/agent/register', body);
    const status = res.statusCode < 300 ? '✓' : '✗';
    console.log(`  ${status}  Agent "${body.alias}" (${body.agent_id}) → HTTP ${res.statusCode}`);
    if (typeof res.body === 'object') {
      console.log(`     Response: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`  ✗  Registration failed: ${err.message}`);
  }
}

// ─── 4. Verify Telemetry Stream ─────────────────────────────────────────────

async function verifyTelemetry() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  4 ▸ Verifying Telemetry Stream → GET /v1/telemetry/latest');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const res = await request('GET', '/v1/telemetry/latest', null);
    console.log(`  HTTP ${res.statusCode}`);
    if (typeof res.body === 'object') {
      console.log(`  Telemetry payload:\n${JSON.stringify(res.body, null, 2)}`);
    } else {
      console.log(`  Raw response: ${res.body}`);
    }
  } catch (err) {
    console.error(`  ✗  Telemetry fetch failed: ${err.message}`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  INTEGRITY — Organic Trace & Compliance Generator    ║');
  console.log('║  Target: http://127.0.0.1:8080                       ║');
  console.log(`║  Started: ${iso().padEnd(42)}║`);
  console.log('╚═══════════════════════════════════════════════════════╝');

  await sendTransactionReports();
  await sendIngestEvents();
  await registerAgent();
  await verifyTelemetry();

  console.log('\n══════════════════════════════════════════════════════');
  console.log('  ✔ Organic data generation complete.');
  console.log('══════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\n✗ Fatal error:', err.message);
  process.exit(1);
});
