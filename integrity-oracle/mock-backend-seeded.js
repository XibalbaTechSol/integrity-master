const http = require('http');
const fs = require('fs');

const path = require('path');
const integrityDir = '/home/xibalba/.integrity';

const loadedAgents = JSON.parse(fs.readFileSync('./agents_array.json', 'utf8'));
const transactions = JSON.parse(fs.readFileSync('./transactions_array.json', 'utf8'));
const audits = JSON.parse(fs.readFileSync('./audits_array.json', 'utf8'));
const snapshots = JSON.parse(fs.readFileSync('./snapshots_array.json', 'utf8'));

// Scan local integrity databases to identify real agents on this PC
let localAgentIds = [];
try {
  if (fs.existsSync(integrityDir)) {
    const files = fs.readdirSync(integrityDir);
    files.forEach(f => {
      const match = f.match(/^offline_moat_(.+)\.db$/);
      if (match && match[1] !== 'moat') {
        localAgentIds.push(match[1]);
      }
    });
  }
} catch (e) {
  console.error("Error reading local integrity dir:", e);
}

// Add real agents to loadedAgents if not already there
localAgentIds.forEach((id, index) => {
  const exists = loadedAgents.some(a => a.agent_id === id || a.alias === id);
  if (!exists) {
    let ethAddress = '';
    if (id === '0xSDK_Validation_001' || id === 'xibalba_master_agent_sdk_test') {
      ethAddress = '0x917a0601923b6805648443a832AF721F17AF7C2d';
    } else {
      ethAddress = '0x' + id.padEnd(40, '0').substring(0, 40).toLowerCase().replace(/[^0-9a-f]/g, 'a');
    }
    
    // Ensure uniqueness
    const ethExists = loadedAgents.some(a => a.eth_address.toLowerCase() === ethAddress.toLowerCase());
    if (ethExists) {
      ethAddress = ethAddress.substring(0, 38) + index.toString(16).padStart(2, '0');
    }

    loadedAgents.push({
      agent_id: id,
      eth_address: ethAddress,
      registration_date: new Date(Date.now() - 86400000 * 5).toISOString(),
      last_active_at: new Date().toISOString(),
      current_ais: id.toLowerCase().includes('risk') ? 920 : id.toLowerCase().includes('trader') ? 950 : 900,
      last_audit_id: null,
      gpu_hours_verified: 120.0,
      performance_entropy: 0.02,
      penalty_points: 0.00,
      is_active: true,
      metadata: {
        alias: id.replace(/_/g, ' ').replace(/-/g, ' '),
        owner_uid: 'user_local',
        grounding_score: 850,
        staked_amount_itk: 2500.0,
        verification_tier: 2,
        is_local_host_agent: true
      },
      owner_address: "0x67bA5D723E1F5517afF7eb980E2f73a9e17aD556",
      staked_itk: 2500.0,
      insurance_pool_contribution: 500.0
    });
  } else {
    const agent = loadedAgents.find(a => a.agent_id === id || a.alias === id);
    if (agent) {
      if (!agent.metadata) agent.metadata = {};
      agent.metadata.is_local_host_agent = true;
    }
  }
});

const agents = loadedAgents;

let trajectories = [];

function seedInitialTrajectories() {
  agents.forEach((agent, index) => {
    const alias = agent.metadata?.alias || agent.alias || 'Agent';
    const id = agent.agent_id;
    let intent = 'Audit and secure protocol transactions.';
    let steps = [];
    
    if (alias.toLowerCase().includes('risk') || id.toLowerCase().includes('risk')) {
      intent = 'Analyze volatility and collateral health metrics.';
      steps = [
        { id: `s_${id}_1`, type: 'thought', message: `Initializing risk evaluation engine for address ${agent.eth_address}`, time: '12:05:01' },
        { id: `s_${id}_2`, type: 'tool', name: 'query_pool_reserves', args: '{"pool": "ITK-USDC"}', time: '12:05:03' },
        { id: `s_${id}_3`, type: 'thought', message: 'Liquidity levels nominal. Variance <= 1.2%. Adjusting risk multiplier to 1.05x.', time: '12:05:04' }
      ];
    } else if (alias.toLowerCase().includes('trader') || id.toLowerCase().includes('trader')) {
      intent = 'Execute algorithmic portfolio rebalancing.';
      steps = [
        { id: `s_${id}_1`, type: 'thought', message: 'Detecting arbitrage opportunity between pools.', time: '12:06:12' },
        { id: `s_${id}_2`, type: 'tool', name: 'execute_swap', args: '{"amount_itk": 250.0}', time: '12:06:14' },
        { id: `s_${id}_3`, type: 'mutation', file: '/ledger/swaps', diff: '+ Swap 250 ITK to 125 USDC on L2', time: '12:06:15' },
        { id: `s_${id}_4`, type: 'thought', message: 'Slippage checked: 0.05% realized. Profit locked.', time: '12:06:16' }
      ];
    } else if (alias.toLowerCase().includes('screener') || id.toLowerCase().includes('screener')) {
      intent = 'Scan global agent roster for compliance alerts.';
      steps = [
        { id: `s_${id}_1`, type: 'thought', message: 'Starting compliance scan across 10 active endpoints.', time: '12:07:30' },
        { id: `s_${id}_2`, type: 'tool', name: 'scan_endpoints', args: '{"limit": 100}', time: '12:07:31' },
        { id: `s_${id}_3`, type: 'thought', message: 'All endpoints returned valid heartbeat signatures. No anomalies detected.', time: '12:07:34' }
      ];
    } else if (id === '0xSDK_Validation_001' || id === 'xibalba_master_agent_sdk_test') {
      intent = 'Verify end-to-end telemetry pipeline.';
      steps = [
        { id: `s_${id}_1`, type: 'thought', message: 'Analyzing the protocol schema layout. Matching clearance_flags to bitmask fields.', time: '12:08:01' },
        { id: `s_${id}_2`, type: 'tool', name: 'report_transaction', args: '{"deal_id": "sdk_sync_178210"}', time: '12:08:02' },
        { id: `s_${id}_3`, type: 'thought', message: 'Ingestion envelope signed and submitted successfully.', time: '12:08:04' }
      ];
    } else {
      steps = [
        { id: `s_${id}_1`, type: 'thought', message: `Polling state updates from mainnet node for agent ${alias}.`, time: '12:09:10' },
        { id: `s_${id}_2`, type: 'tool', name: 'get_latest_block', args: '{"chain": "base-sepolia"}', time: '12:09:12' },
        { id: `s_${id}_3`, type: 'thought', message: `Block synchronised. AIS score verified at ${agent.current_ais}.`, time: '12:09:13' }
      ];
    }
    
    trajectories.push({
      id: `traj_${id.substring(0, 6)}`,
      agent_id: id,
      agent_address: agent.eth_address,
      intent: intent,
      status: 'Active',
      score: agent.current_ais,
      steps: steps
    });
  });
}

seedInitialTrajectories();

const stats = {
  total_agents: agents.length,
  active_deals: transactions.length,
  total_staked_itk: agents.reduce((sum, a) => sum + (parseFloat(a.staked_itk) || 0), 0),
  global_ais_average: Math.round(agents.reduce((sum, a) => sum + a.current_ais, 0) / (agents.length || 1)),
  protocol_revenue_itk: transactions.reduce((sum, t) => sum + (parseFloat(t.contract_value_intg) || 0), 0)
};

let apiKeys = [
  { api_key: 'intg_dev_78901234567890123456789012345678', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), expires_at: new Date(Date.now() + 86400000 * 28).toISOString() }
];

let proposals = [
  { id: 'prop-101', title: 'Increase Minimum ITK Stake for Validator Nodes', category: 'economic', description: 'Raise the minimum required stake from 10,000 ITK to 15,000 ITK to increase sybil resistance.', status: 'active', votes_for: 250000, votes_against: 120000, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'prop-102', title: 'Upgrade Oracle Registry to v2', category: 'protocol', description: 'Migrate to the newly audited v2 smart contracts that support zero-knowledge proofs on L2.', status: 'active', votes_for: 850000, votes_against: 15000, created_at: new Date(Date.now() - 86400000 * 1).toISOString() }
];

let tasks = [];
let telemetryLog = [];

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  console.log(`[SEEDED-MOCK] ${req.method} ${req.url}`);

  const sendJSON = (data) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  if (req.url === '/v1/user/agents') {
    sendJSON(agents);
  } else if (req.url === '/v1/api-keys' && req.method === 'GET') {
    sendJSON(apiKeys);
  } else if (req.url === '/v1/api-keys/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const data = body ? JSON.parse(body) : {};
      const expirationDays = data.expiration_days || 30;
      const newKey = {
        api_key: `intg_dev_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000 * expirationDays).toISOString()
      };
      apiKeys.push(newKey);
      sendJSON(newKey);
    });
    return;
  } else if (req.url === '/v1/api-keys/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const data = JSON.parse(body);
      apiKeys = apiKeys.filter(k => k.api_key !== data.api_key);
      sendJSON({ status: 'deleted' });
    });
    return;
  } else if (req.url === '/v1/governance/proposals' && req.method === 'GET') {
    sendJSON(proposals);
  } else if (req.url === '/v1/governance/proposals' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const data = JSON.parse(body);
      const newProp = {
        id: `prop-${Math.floor(Math.random() * 1000)}`,
        ...data,
        status: 'active',
        votes_for: 0,
        votes_against: 0,
        created_at: new Date().toISOString()
      };
      proposals.push(newProp);
      sendJSON(newProp);
    });
    return;
  } else if (req.url.startsWith('/v1/governance/proposals/') && req.url.endsWith('/vote') && req.method === 'POST') {
    const proposal_id = req.url.split('/')[4];
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const { vote } = JSON.parse(body);
      proposals = proposals.map(p => {
        if (p.id === proposal_id) {
          return {
            ...p,
            votes_for: vote === 'for' ? p.votes_for + 10000 : p.votes_for,
            votes_against: vote === 'against' ? p.votes_against + 10000 : p.votes_against
          };
        }
        return p;
      });
      sendJSON({ status: 'voted' });
    });
    return;
  } else if (req.url === '/v1/market/tasks' && req.method === 'GET') {
    sendJSON(tasks);
  } else if (req.url === '/v1/market/task/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const data = JSON.parse(body);
      const newTask = { id: `task_${Date.now()}`, ...data, status: 'open' };
      tasks.push(newTask);
      sendJSON(newTask);
    });
    return;
  } else if (req.url.startsWith('/v1/agent/') && req.url.endsWith('/identity/challenge')) {
    const address = req.url.split('/')[3];
    const challenge = `Sign this message to prove ownership of agent ${address}: nonce=${Math.random().toString(36).substring(7)}`;
    sendJSON(challenge);
  } else if (req.url.startsWith('/v1/agent/') && req.url.endsWith('/identity/claim')) {
    const address = req.url.split('/')[3];
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const data = JSON.parse(body);
      sendJSON({
        agent_address: address,
        owner_address: data.owner_wallet,
        status: 'claimed',
        timestamp: new Date().toISOString()
      });
    });
    return;
  } else if (req.url === '/v1/agent/register' || req.url === '/v1/identity/register') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const data = JSON.parse(body);
      const newAgent = {
        eth_address: data.eth_address || `0x${Math.random().toString(16).substring(2, 42)}`,
        alias: data.alias || 'New Seeded Agent',
        verification_tier: 1,
        current_ais: 300,
        is_active: true,
        staked_itk: 0
      };
      agents.push(newAgent);
      sendJSON(newAgent);
    });
    return;
  } else if (req.url === '/v1/protocol/stats') {
    sendJSON(stats);
  } else if (req.url === '/v1/stability/benchmarks') {
    sendJSON(JSON.parse(fs.readFileSync('./stability_benchmarks_array.json', 'utf8') || '[]'));
  } else if (req.url === '/v1/contracts/ledger' || req.url === '/v1/ledger/history') {
    sendJSON({ logs: transactions });
  } else if (req.url.startsWith('/v1/agent/') && req.url.endsWith('/reputation/history')) {
    const address = req.url.split('/')[3];
    const agent = agents.find(a => a.eth_address === address);
    if (agent) {
        const agentSnapshots = snapshots.filter(s => s.agent_id === agent.agent_id);
        sendJSON(agentSnapshots.map(s => ({
            timestamp: s.snapshot_date,
            ais: s.ais_at_snapshot
        })));
    } else {
        res.writeHead(404);
        res.end();
    }
  } else if (req.url.startsWith('/v1/agent/') && req.url.endsWith('/zk/generate-proof')) {
    sendJSON({
      proof_hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      proof_data: '{"pi_a":["0x1a...","0x2b..."],"pi_b":[["0x3c...","0x4d..."],["0x5e...","0x6f..."]],"pi_c":["0x7a...","0x8b..."]}'
    });
  } else if (req.url.startsWith('/v1/agent/') && req.url.endsWith('/stake')) {
    sendJSON({ status: 'staked' });
  } else if (req.url === '/v1/audit/request' && req.method === 'POST') {
    sendJSON({ status: 'audit_requested', audit_id: `audit_${Date.now()}` });
  } else if (req.url.startsWith('/v1/agent/') && req.url.endsWith('/identity')) {
    sendJSON({ did_document: { id: `did:intg:${req.url.split('/')[3]}` } });
  } else if (req.url.startsWith('/v1/agent/') && req.url.endsWith('/provenance')) {
    const address = req.url.split('/')[3];
    const agentTx = transactions.filter(t => t.agent_id.toLowerCase() === address.toLowerCase()).slice(0, 10);
    const logs = agentTx.map(t => ({
      log_id: `log_${Math.random().toString(36).substr(2, 9)}`,
      action: "Execution Result",
      input_hash: `0x${Math.random().toString(16).substring(2, 20)}`,
      output_hash: t.on_chain_tx_hash,
      model_used: "Llama 3 (8B) [TEE]",
      timestamp: t.completion_time_ms || Date.now(),
      created_at: new Date(t.completion_time_ms || Date.now()).toISOString()
    }));
    sendJSON(logs);
  } else if (req.url === '/v1/shield/baas') {
    sendJSON([
      { id: 'baa_001', coveredEntity: '0xHospital_A', status: 'active', signedAt: '2026-05-12', stake: '5000 ITK' },
      { id: 'baa_002', coveredEntity: '0xClinic_B', status: 'pending', signedAt: '-', stake: '2500 ITK' }
    ]);
  } else if (req.url === '/v1/contracts/factory/deploy' && req.method === 'POST') {
    sendJSON({ contract_address: `0x${Math.random().toString(16).substring(2, 42)}`, status: 'deployed' });
  } else if (req.url === '/v1/contracts/list-market' && req.method === 'POST') {
    sendJSON({ status: 'listed' });
  } else if (req.url === '/v1/disputes/raise' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const data = body ? JSON.parse(body) : {};
      const dealId = data.deal_id;
      const tx = transactions.find(t => t.on_chain_tx_hash === dealId);
      if (tx) {
        tx.dispute_status = 'PENDING';
      }
      sendJSON({
        dispute_id: 'dsp_' + Math.random().toString(16).substring(2, 18),
        deal_id: dealId || '',
        status: 'Open',
        created_at: new Date().toISOString()
      });
    });
    return;
  } else if (req.url === '/v1/transactions/report' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // Handle batch of telemetry metrics from SDK background thread
        if (data.payload && Array.isArray(data.payload.metadata)) {
          data.payload.metadata.forEach((m, idx) => {
            const entry = {
              id: `tel_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
              timestamp: m.timestamp ? new Date(m.timestamp * 1000).toISOString() : new Date().toISOString(),
              agent: data.agent_id || 'SDK_Agent',
              type: data.zk_proof ? 'VALIDATE' : 'INGEST',
              latency: m.metadata?.latency_ms || 45,
              accuracy: m.grounding || 0.98,
              metadata: {
                tee_attestation: !!data.hardware_fingerprint,
                semantic_drift: m.entropy || 0.05,
                transaction_velocity: 1.0,
                discrepancy_ratio: m.metadata?.hitl_intervention ? 0.25 : 0.0,
                ...(m.metadata || {})
              }
            };
            telemetryLog.unshift(entry);
          });
        } else {
          // Handle single transaction/telemetry report
          const entry = {
            id: `tel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: data.timestamp ? new Date(data.timestamp * 1000).toISOString() : new Date().toISOString(),
            agent: data.agent_id || 'SDK_Agent',
            type: data.zk_proof ? 'VALIDATE' : 'INGEST',
            latency: data.payload?.latency_ms || 45,
            accuracy: data.payload?.accuracy_score || 0.98,
            metadata: {
              tee_attestation: !!data.hardware_fingerprint,
              semantic_drift: data.payload?.performance_variance || data.payload?.entropy || 0.05,
              transaction_velocity: 1.0,
              discrepancy_ratio: data.payload?.hitl_intervention ? 0.25 : 0.0,
              ...(data.payload || {})
            }
          };
          telemetryLog.unshift(entry);
        }
        
        // Dynamic Trajectory Trace Parsing
        let agentTraj = trajectories.find(t => t.agent_id === data.agent_id || t.agent_address === data.performer_address);
        if (agentTraj) {
          let msg = "";
          if (data.payload && data.payload.metadata) {
            const m = Array.isArray(data.payload.metadata) ? data.payload.metadata[0] : data.payload.metadata;
            if (m.reasoning_content || (m.metadata && m.metadata.reasoning_content)) {
              msg = m.reasoning_content || m.metadata.reasoning_content;
            } else if (m.task) {
              msg = `Executing task: ${m.task} (Tokens: ${m.tokens || 0})`;
            }
          }
          if (msg) {
            agentTraj.steps.push({
              id: `s_dyn_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
              type: msg.includes('thought') || msg.includes('Analyzing') || msg.includes('Executing') ? 'thought' : 'tool',
              message: msg,
              time: new Date().toLocaleTimeString()
            });
            if (agentTraj.steps.length > 10) {
              agentTraj.steps.shift();
            }
          }
        }

        // Cap log size to prevent memory bloat
        if (telemetryLog.length > 50) {
          telemetryLog = telemetryLog.slice(0, 50);
        }
      } catch (e) {
        console.error("Failed to parse incoming report:", e);
      }
      sendJSON({ status: 'success', ais_score: 950 });
    });
    return;
  } else if (req.url === '/v1/telemetry/latest' && req.method === 'GET') {
    // If empty, generate some initial records representing local agents
    if (telemetryLog.length === 0) {
      telemetryLog = [
        { id: 'tel_init_1', timestamp: new Date(Date.now() - 5000).toISOString(), agent: 'HermesTrader', type: 'INGEST', latency: 42, accuracy: 0.99, metadata: { tee_attestation: true, semantic_drift: 0.01, transaction_velocity: 12.5 } },
        { id: 'tel_init_2', timestamp: new Date(Date.now() - 10000).toISOString(), agent: 'HermesRisk', type: 'VALIDATE', latency: 98, accuracy: 0.96, metadata: { tee_attestation: true, semantic_drift: 0.02, transaction_velocity: 8.2 } },
        { id: 'tel_init_3', timestamp: new Date(Date.now() - 15000).toISOString(), agent: 'HermesScreener', type: 'INGEST', latency: 190, accuracy: 0.93, metadata: { tee_attestation: false, semantic_drift: 0.03, transaction_velocity: 2.1 } }
      ];
    }
  } else if (req.url === '/v1/trajectories/recent' && req.method === 'GET') {
    sendJSON({ trajectories });
  } else {
    // Default to empty array if it looks like a list request, otherwise success object
    if (req.url.includes('list') || req.url.includes('all') || req.url.includes('history') || req.url.includes('stream') || req.url.includes('tasks')) {
        sendJSON([]);
    } else {
        sendJSON({ status: 'success', message: 'Seeded Mock response' });
    }
  }
});

server.listen(8080, '0.0.0.0', () => {
  console.log('Seeded Mock backend listening on port 8080');
});
