const fs = require('fs');

let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

// 1. Rename "Actuarial Automation Factory" to "Programmable Agent Escrows"
content = content.replace(
    /Actuarial Automation Factory/g,
    'Programmable Agent Escrows'
);
content = content.replace(
    /OPEN THE FACTORY/g,
    'OPEN ESCROWS'
);
content = content.replace(
    /READ FACTORY SPECS/g,
    'READ ESCROW SPECS'
);

// 2. Add 'Read the Docs' button to the Hero (or the Quickstart area)
// Wait, the Quickstart area currently has: <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '16px 32px' }}>Generate API Key</button>
content = content.replace(
    /<button onClick=\{\(\) => navigate\('\/login'\)\} className="btn btn-primary" style=\{\{ padding: '16px 32px' \}\}>\s*Generate API Key\s*<\/button>/,
    `<div style={{ display: 'flex', gap: '16px' }}>
                                <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '16px 32px' }}>
                                    Generate API Key
                                </button>
                                <a href="https://github.com/XibalbaTechSol/integrity-protocol/tree/main/docs" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '16px 32px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}>
                                    Read the Docs
                                </a>
                            </div>`
);

// 3. Update the Developer API Code Snippet to show the transaction gating
const oldCodeSnippet = `<code style={{ color: '#c9a84c' }}>const</code> score = <code style={{ color: '#c9a84c' }}>await</code> client.getAgentScore();
console.log(score.ais); <code style={{ color: 'rgba(255,255,255,0.3)' }}>// -{'>'} 300 (Max)</code>`;

const newCodeSnippet = `<code style={{ color: 'rgba(255,255,255,0.3)' }}>// Ask protocol if transaction is safe</code>
<code style={{ color: '#c9a84c' }}>const</code> txRequest = <code style={{ color: '#c9a84c' }}>await</code> client.proposeTransaction(uniswapSwap);

<code style={{ color: '#c9a84c' }}>if</code> (txRequest.isApproved) {'{'}
  <code style={{ color: 'rgba(255,255,255,0.3)' }}>// Pre-Execution Gated by BCC!</code>
  <code style={{ color: '#c9a84c' }}>await</code> txRequest.execute();
{'}'} <code style={{ color: '#c9a84c' }}>else</code> {'{'}
  console.log(<code style={{ color: '#10b981' }}>'Transaction blocked: Trust Ceiling exceeded'</code>);
{'}'}`;

content = content.replace(oldCodeSnippet, newCodeSnippet);


fs.writeFileSync('src/pages/LandingPage.tsx', content, 'utf8');
console.log('LandingPage.tsx streamline applied!');
