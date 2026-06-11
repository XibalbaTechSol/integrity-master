const fs = require('fs');

let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

// 1. Remove obsolete imports
const obsoleteImports = [
    "import { ProtocolArchitecture } from '../components/legacy-ui/ProtocolArchitecture';",
    "import { InvestorVisionSection } from '../components/legacy-ui/InvestorVisionSection';",
    "import { ReputationMetricsSection } from '../components/legacy-ui/ReputationMetricsSection';",
    "import { IdentityStandards } from '../components/legacy-ui/IdentityStandards';",
];

for (const imp of obsoleteImports) {
    content = content.replace(imp + '\n', '');
}

// 2. Modify the Hero Section text
content = content.replace(
    /Actuarial Standards for AI/g,
    'Verifiable Accountability for Autonomous Agents'
);

content = content.replace(
    /The Integrity Protocol is the first institutional-grade <strong>Credit Bureau for Autonomous AI<\/strong>\./g,
    'The Integrity Protocol is the foundational trust and settlement layer for the <strong>Autonomous Agent Economy</strong>.'
);

content = content.replace(
    /In an economy managed by autonomous agents, trust is the scarcest resource\. Our protocol provides the definitive Tri-Metric assessment layer—anchored on Base L2—to verify machine reliability, grounding, and commercial accountability at scale\. Currently piloting via the Xibalba Sovereign Intelligence Node\./g,
    'In a decentralized economy managed by autonomous agents, trust is the scarcest resource. Our protocol provides the definitive Tri-Metric assessment layer—anchored on Base L2—to verify machine reliability, grounding, and commercial accountability before agents execute high-stakes smart contracts. No more black boxes, only cryptographic certainty.'
);

// 3. Replace the old component tags with the new Developer Quickstart / Problem-Solution section
const oldSectionsRegex = /\{\/\* Investor Vision & Thesis Section \*\/\}\s*<InvestorVisionSection \/>\s*\{\/\* Reputation Metrics Section \*\/\}\s*<ReputationMetricsSection \/>\s*\{\/\* Technical Architecture Deep-Dive \*\/\}\s*<ProtocolArchitecture \/>\s*\{\/\* Identity Standards Section \*\/\}\s*<IdentityStandards \/>/g;

const newSections = `
            {/* The Core Problem & Solution */}
            <section style={{ padding: isMobile ? '60px 20px' : '120px 60px', background: 'var(--navy-deep)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: isMobile ? '48px' : '80px' }}>
                        <span style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em', display: 'block', marginBottom: '16px' }}>The Trust Gap</span>
                        <h2 style={{ fontSize: isMobile ? '2.2rem' : '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', color: 'white' }}>Agents can reason.<br /><span style={{ color: 'var(--gold)' }}>But can they transact?</span></h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '800px', margin: '0 auto', lineHeight: 1.7, fontSize: isMobile ? '0.95rem' : '1.1rem' }}>
                            The agentic web is scaling rapidly, but autonomous code lacks verifiable accountability. 
                            The Integrity Protocol bridges this gap using cryptographic middleware (BCC) and Base L2 settlement to establish immutable reputation.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '20px' : '32px' }}>
                        <div style={{ padding: '40px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                            <div style={{ color: 'var(--gold)', marginBottom: '20px' }}><Shield size={32} /></div>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', color: 'white' }}>Pre-Execution Gating</h4>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                                Smart contracts verify an agent's Integrity Score (AIS) before allowing a transaction to execute, preventing malicious or hallucinated actions.
                            </p>
                        </div>
                        <div style={{ padding: '40px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                            <div style={{ color: '#60a5fa', marginBottom: '20px' }}><Activity size={32} /></div>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', color: 'white' }}>Real-time Telemetry</h4>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                                Agent decisions are continuously monitored via the Behavioral Commitment Chain (BCC), dynamically adjusting their reputation based on performance and entropy.
                            </p>
                        </div>
                        <div style={{ padding: '40px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                            <div style={{ color: '#a78bfa', marginBottom: '20px' }}><Lock size={32} /></div>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', color: 'white' }}>Base L2 Settlement</h4>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                                All reputation proofs and final SLA escrows are settled securely and cheaply on Base L2, ensuring permanent cryptographic accountability.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Developer Quickstart Section */}
            <section style={{ padding: isMobile ? '60px 20px' : '100px 60px', background: 'rgba(212, 175, 55, 0.03)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '40px' : '80px', alignItems: 'center' }}>
                        <div>
                            <span style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '16px', display: 'block' }}>Developer Experience</span>
                            <h2 style={{ fontSize: isMobile ? '2.2rem' : '3rem', fontWeight: 800, marginBottom: '24px', lineHeight: 1.1 }}>Start building instantly.<br />No hardware DID required.</h2>
                            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.8, marginBottom: '24px', fontWeight: 500 }}>
                                Enter the agent economy today with our new <strong>Developer API Key</strong> testing mode. 
                            </p>
                            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: '40px' }}>
                                We know that provisioning hardware-backed DIDs can slow down development. That's why we've introduced Developer API Keys. Simply generate a key from the dashboard and immediately start routing telemetry to the BCC. For safety, agents using this bypass are mathematically capped at a Trust Level (AIS) of 300, allowing you to build and test safely before moving to mainnet production.
                            </p>
                            <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '16px 32px' }}>
                                Generate API Key
                            </button>
                        </div>
                        <div style={{ background: '#050d18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', position: 'relative' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f87171' }} />
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fbbf24' }} />
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#34d399' }} />
                            </div>
                            <pre style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'monospace', overflowX: 'auto' }}>
<code style={{ color: '#c9a84c' }}>import</code> {'{'} IntegrityClient {'}'} <code style={{ color: '#c9a84c' }}>from</code> '@xibalba/integrity-sdk';

<code style={{ color: 'rgba(255,255,255,0.3)' }}>// Initialize with your Developer API Key</code>
<code style={{ color: '#c9a84c' }}>const</code> client = <code style={{ color: '#c9a84c' }}>new</code> IntegrityClient({'{'}
  apiKey: process.env.INTEGRITY_API_KEY,
  network: <code style={{ color: '#10b981' }}>'base-sepolia'</code>
{'}'});

<code style={{ color: 'rgba(255,255,255,0.3)' }}>// Your agent's AIS is capped at 300 during dev</code>
<code style={{ color: '#c9a84c' }}>const</code> score = <code style={{ color: '#c9a84c' }}>await</code> client.getAgentScore();
console.log(score.ais); <code style={{ color: 'rgba(255,255,255,0.3)' }}>// -> 300 (Max)</code>
                            </pre>
                        </div>
                    </div>
                </div>
            </section>
`;

content = content.replace(oldSectionsRegex, newSections);

fs.writeFileSync('src/pages/LandingPage.tsx', content, 'utf8');
console.log('LandingPage.tsx successfully refactored!');
