const http = require('http');

const agents = [
  {
    eth_address: '0x67bA5D723E1F5517afF7eb980E2f73a9e17aD556',
    alias: 'Institutional_Ironclad',
    verification_tier: 3,
    current_ais: 980,
    performance_entropy: 0.005,
    gpu_hours_verified: 500,
    staked_itk: 5000,
    is_active: true
  },
  {
    eth_address: '0xVoyagerVerified0000000000000000000000000',
    alias: 'Verified_Voyager',
    verification_tier: 2,
    current_ais: 820,
    performance_entropy: 0.03,
    gpu_hours_verified: 200,
    staked_itk: 1500,
    is_active: true
  }
];

const stats = {
  total_agents: 124,
  active_deals: 42,
  total_staked_itk: 12450200,
  global_ais_average: 742,
  protocol_revenue_itk: 8900
};

let apiKeys = [
  { api_key: 'intg_dev_78901234567890123456789012345678', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), expires_at: new Date(Date.now() + 86400000 * 28).toISOString() }
];

let proposals = [
  { id: 'prop-101', title: 'Increase Minimum ITK Stake for Validator Nodes', category: 'economic', description: 'Raise the minimum required stake from 10,000 ITK to 15,000 ITK to increase sybil resistance.', status: 'active', votes_for: 250000, votes_against: 120000, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'prop-102', title: 'Upgrade Oracle Registry to v2', category: 'protocol', description: 'Migrate to the newly audited v2 smart contracts that support zero-knowledge proofs on L2.', status: 'active', votes_for: 850000, votes_against: 15000, created_at: new Date(Date.now() - 86400000 * 1).toISOString() }
];

let benchmarks = [
  { model_name: 'GPT-4o', provider_name: 'OpenAI', simulated_ais: 985, stability_metric: 0.98, grounding_metric: 0.97 },
  { model_name: 'Claude 3.5 Sonnet', provider_name: 'Anthropic', simulated_ais: 972, stability_metric: 0.96, grounding_metric: 0.98 },
  { model_name: 'Llama 3 70B', provider_name: 'Meta', simulated_ais: 915, stability_metric: 0.92, grounding_metric: 0.89 },
  { model_name: 'Mixtral 8x7B', provider_name: 'Mistral', simulated_ais: 890, stability_metric: 0.94, grounding_metric: 0.85 }
];

let tasks = [];

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  console.log(`[MOCK] ${req.method} ${req.url}`);

  const sendJSON = (data) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  if (req.url === '/v1/health') {
    sendJSON({ status: 'operational' });
  } else if (req.url === '/v1/user/agents') {
    sendJSON(agents);
  } else if (req.url === '/v1/agent/register' || req.url === '/v1/identity/register') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const data = JSON.parse(body);
      const newAgent = {
        eth_address: data.eth_address || `0x${Math.random().toString(16).substring(2, 42)}`,
        alias: data.alias || 'New Agent',
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
    sendJSON(benchmarks);
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
  } else if (req.url.startsWith('/v1/agent/') && req.url.endsWith('/identity')) {
    sendJSON({ did_document: { id: `did:intg:${req.url.split('/')[3]}` } });
  } else if (req.url.startsWith('/v1/agent/') && req.url.endsWith('/reputation/history')) {
    const history = Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 86400000).toISOString(),
      ais: 800 + Math.floor(Math.random() * 200)
    }));
    sendJSON(history);
  } else if (req.url.startsWith('/v1/agent/') && req.url.endsWith('/zk/generate-proof')) {
    sendJSON({
      proof_hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      proof_data: '{"pi_a":["0x1a...","0x2b..."],"pi_b":[["0x3c...","0x4d..."],["0x5e...","0x6f..."]],"pi_c":["0x7a...","0x8b..."]}'
    });
  } else if (req.url.startsWith('/v1/agent/') && req.url.endsWith('/stake')) {
    sendJSON({ status: 'staked' });
  } else if (req.url === '/v1/audit/request' && req.method === 'POST') {
    sendJSON({ status: 'audit_requested', audit_id: `audit_${Date.now()}` });
  } else if (req.url.startsWith('/v1/agent/') && req.url.endsWith('/provenance')) {
    sendJSON([
      { id: '1', action: 'INFERENCE', model_used: 'hermes-3-llama-3.1-8b', input_hash: '0xabc...123', output_hash: '0xdef...456', timestamp: new Date().toISOString() },
      { id: '2', action: 'CONTRACT_CALL', model_used: 'hermes-3-llama-3.1-8b', input_hash: '0x789...012', output_hash: '0x345...678', timestamp: new Date(Date.now() - 3600000).toISOString() }
    ]);
  } else if (req.url === '/v1/contracts/factory/deploy' && req.method === 'POST') {
    sendJSON({ contract_address: `0x${Math.random().toString(16).substring(2, 42)}`, status: 'deployed' });
  } else if (req.url === '/v1/contracts/list-market' && req.method === 'POST') {
    sendJSON({ status: 'listed' });
  } else if (req.url === '/v1/shield/baas') {
    sendJSON([
      { id: 'baa_001', coveredEntity: '0xHospital_A', businessAssociate: '0xAgent_X', status: 'Active', signedAt: '2026-05-12', stakedITK: '5,000 ITK', documentHash: '0x88f2...a231' },
      { id: 'baa_002', coveredEntity: '0xHospital_A', businessAssociate: '0xAgent_Y', status: 'Pending', signedAt: '-', stakedITK: '2,500 ITK', documentHash: '0x44c1...e992' }
    ]);
  } else if (req.url === '/v1/shield/interactions') {
    sendJSON([
      { id: 'int_001', time: '14:22:01', action: 'EHR Query', resource: 'ptr:0x88...f2', agent: '0xAgent_X', baaId: 'baa_001', status: 'PASSED' },
      { id: 'int_002', time: '14:20:45', action: 'Diagnosis Gen', resource: '0xModel_GPT4', agent: '0xAgent_X', baaId: 'baa_001', status: 'PASSED' },
      { id: 'int_003', time: '12:05:12', action: 'SSN Access', resource: '0xPayload_Unenc', agent: '0xAgent_Y', baaId: 'baa_002', status: 'BLOCKED' }
    ]);
  } else if (req.url === '/v1/shield/compliance/review-queue') {
    sendJSON([
      { id: 'violation_001', time: '12:05:12', agent: '0xAgent_Y', baaId: 'baa_002', type: 'PHI Exfiltration Attempt', detail: 'Attempted to send unencrypted SSN (***-**-6789) to external endpoint.', status: 'Pending Review' }
    ]);
  } else if (req.url === '/v1/shield/compliance/resolve' && req.method === 'POST') {
    sendJSON({ status: 'resolved' });
  } else if (req.url === '/v1/shield/baa/propose' && req.method === 'POST') {
    sendJSON({ status: 'proposed', baaId: `baa_${Date.now()}` });
  } else if (req.url === '/v1/contracts/ledger' || req.url === '/v1/ledger/history') {
    sendJSON({ logs: [] });
  } else {
    sendJSON({ status: 'success', message: 'Mock response' });
  }
});

server.listen(8080, () => {
  console.log('Mock backend listening on port 8080');
});
