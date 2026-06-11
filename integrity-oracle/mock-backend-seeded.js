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
  global_ais_average: Math.round(agents.reduce((sum, a) => sum + a.current_ais, 0) / agents.length),
  protocol_revenue_itk: transactions.reduce((sum, t) => sum + (parseFloat(t.contract_value_intg) || 0), 0)
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  console.log(`[SEEDED-MOCK] ${req.method} ${req.url}`);

  if (req.url === '/v1/user/agents') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(agents));
  } else if (req.url === '/v1/protocol/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
  } else if (req.url === '/v1/contracts/ledger') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(transactions));
  } else if (req.url.startsWith('/v1/agent/') && req.url.endsWith('/reputation/history')) {
    const address = req.url.split('/')[3];
    const agent = agents.find(a => a.eth_address === address);
    if (agent) {
        const agentSnapshots = snapshots.filter(s => s.agent_id === agent.agent_id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(agentSnapshots.map(s => ({
            timestamp: s.snapshot_date,
            ais: s.ais_at_snapshot
        }))));
    } else {
        res.writeHead(404);
        res.end();
    }
  } else if (req.url === '/v1/stability/benchmarks') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(JSON.parse(fs.readFileSync('./stability_benchmarks_array.json', 'utf8') || '[]')));
  } else if (req.url.startsWith('/v1/wallet/') && req.url.endsWith('/balance')) {
    const address = req.url.split('/')[3];
    // In a real scenario we'd check token_balances table. 
    // For mock, return a random high balance if not found.
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ balance_itk: 125000.50 }));
  } else if (req.url === '/v1/telemetry/latest') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(agents.slice(0, 5).map(a => ({
        id: Math.random().toString(36).substring(7),
        agent: a.metadata.alias || a.eth_address.substring(0, 10),
        type: 'INGEST',
        latency: Math.floor(Math.random() * 500) + 50,
        accuracy: 0.9 + Math.random() * 0.1,
        timestamp: new Date().toISOString(),
        metadata: { tee_attestation: true, semantic_drift: Math.random() * 0.05 }
    }))));
  } else if (req.url === '/v1/market/tasks' || req.url === '/v1/marketplace/tasks') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
  } else if (req.url.includes('/credit/profile')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        credit_score: 750,
        max_borrow_limit_itk: 100000,
        current_debt_itk: 0,
        is_eligible: true
    }));
  } else if (req.url.includes('/provenance')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
  } else if (req.url.includes('/identity/did/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id: req.url.split('/').pop(), status: 'active' }));
  } else if (req.url.includes('/identity/vc/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
  } else if (req.url === '/v1/ledger/history') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(transactions.slice(0, 20)));
  } else if (req.url === '/v1/governance/proposals') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { id: '1', title: 'Reduce SLA Performance Buffer', category: 'Parameters', risk_level: 'MEDIUM', status: 'ACTIVE' },
      { id: '2', title: 'Increase Slash Tax to 10%', category: 'Tokenomics', risk_level: 'HIGH', status: 'ACTIVE' }
    ]));
  } else {
    // Default to empty array if it looks like a list request, otherwise success object
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (req.url.includes('list') || req.url.includes('all') || req.url.includes('history') || req.url.includes('stream') || req.url.includes('tasks')) {
        res.end(JSON.stringify([]));
    } else {
        res.end(JSON.stringify({ status: 'success', message: 'Seeded Mock response' }));
    }
  }
});

server.listen(8080, '0.0.0.0', () => {
  console.log('Seeded Mock backend listening on port 8080');
});
