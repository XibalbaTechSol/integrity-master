const http = require('http');
const fs = require('fs');

const agents = JSON.parse(fs.readFileSync('./agents_array.json', 'utf8'));
const transactions = JSON.parse(fs.readFileSync('./transactions_array.json', 'utf8'));
const audits = JSON.parse(fs.readFileSync('./audits_array.json', 'utf8'));
const snapshots = JSON.parse(fs.readFileSync('./snapshots_array.json', 'utf8'));

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
    sendJSON([]);
  } else if (req.url === '/v1/shield/baas') {
    sendJSON([
      { id: 'baa_001', coveredEntity: '0xHospital_A', status: 'active', signedAt: '2026-05-12', stake: '5000 ITK' },
      { id: 'baa_002', coveredEntity: '0xClinic_B', status: 'pending', signedAt: '-', stake: '2500 ITK' }
    ]);
  } else if (req.url === '/v1/contracts/factory/deploy' && req.method === 'POST') {
    sendJSON({ contract_address: `0x${Math.random().toString(16).substring(2, 42)}`, status: 'deployed' });
  } else if (req.url === '/v1/contracts/list-market' && req.method === 'POST') {
    sendJSON({ status: 'listed' });
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
