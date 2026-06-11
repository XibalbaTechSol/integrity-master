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

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  console.log(`[MOCK] ${req.method} ${req.url}`);

  if (req.url === '/v1/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'operational' }));
  } else if (req.url === '/v1/user/agents') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(agents));
  } else if (req.url === '/v1/protocol/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
  } else if (req.url.startsWith('/v1/agent/') && req.url.endsWith('/identity')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ did_document: { id: `did:xibalba:${req.url.split('/')[3]}` } }));
  } else if (req.url.startsWith('/v1/agent/') && req.url.endsWith('/reputation/history')) {
    const history = Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 86400000).toISOString(),
      ais: 800 + Math.floor(Math.random() * 200)
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(history));
  } else if (req.url === '/v1/governance/proposals') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { id: '1', title: 'Reduce SLA Performance Buffer', category: 'Parameters', risk_level: 'MEDIUM', status: 'ACTIVE' },
      { id: '2', title: 'Increase Slash Tax to 10%', category: 'Tokenomics', risk_level: 'HIGH', status: 'ACTIVE' }
    ]));
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'success', message: 'Mock response' }));
  }
});

server.listen(8080, () => {
  console.log('Mock backend listening on port 8080');
});
