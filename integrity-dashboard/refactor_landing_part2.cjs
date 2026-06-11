const fs = require('fs');

let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

// Section 1: Actuarial Automation Factory
content = content.replace(
    /Transitioning from a trust score to a functional automation economy\. The Integrity Protocol now features the world's first no-code engine for deploying reputation-backed financial logic\./g,
    'Raw trust scores are valuable, but on-chain enforcement is definitive. The Integrity Protocol features a no-code engine for deploying reputation-backed smart contracts and SLA escrows.'
);
content = content.replace(
    /Raw reputation scores are valuable, but on-chain enforcement is definitive\. Our No-Code Factory allows enterprises and developers to wrap autonomous agent interactions in cryptographically enforceable contracts\. Whether it's ensuring an agent meets performance SLAs before payment release or automatically triggering insurance payouts during a service outage, the Integrity Protocol provides the actuarial floor for machine-to-machine commerce\./g,
    'Our No-Code Factory allows developers and enterprises to wrap autonomous agent interactions in cryptographically enforceable contracts on Base L2. Whether ensuring an agent meets rigorous performance SLAs before an API payment is released, or dynamically increasing a DeFi borrowing limit based on real-time BCC telemetry, the Integrity Protocol provides the settlement floor for machine-to-machine commerce.'
);

// Section 2: Identity Sovereignty & Trust Ceilings
content = content.replace(
    /Identity Sovereignty & <span style={{ color: 'var\(--gold\)' }}>Trust Ceilings\.<\/span>/g,
    'Verification Ladder & <span style={{ color: \'var(--gold)\' }}>Trust Ceilings.</span>'
);
content = content.replace(
    /Reputation must be bound to responsibility\. In the emerging agentic web, the 'Verification Gap' between autonomous code execution and legal liability represents the single greatest hurdle to institutional adoption\. The Integrity Protocol bridges this gap through a multi-tier Verification Ladder, mathematically capping Agent Integrity Scores \(AIS\) based on real-world accountability\. High-stakes autonomous commerce requires more than just performance history—it requires verified legal and domain standing\./g,
    'In the emerging agentic web, the "Verification Gap" between an autonomous script and legal liability is the single greatest hurdle to scale. The Integrity Protocol bridges this gap through a multi-tier Verification Ladder, mathematically capping Agent Integrity Scores (AIS) based on cryptographic and real-world accountability.'
);
content = content.replace(
    /For too long, digital identity has been a 'rented' commodity, controlled by centralized providers who can vaporize an entity's commercial history with a single administrative action\. We believe that an agent's reputation is a sovereign asset that must be anchored to a verifiable root of trust\. The Verification Ladder ensures that as an agent's economic impact grows, its level of verifiable accountability must scale in lockstep\. By anchoring digital reputation to sovereign and corporate identities, we create a 'trust topology' where agents are not just efficient black-boxes, but legally and financially responsible participants in a global economy\./g,
    'We believe an agent’s reputation is a sovereign asset that must be anchored to a verifiable root of trust on Base L2. The Verification Ladder ensures that as an agent’s financial and economic impact grows, its level of verifiable accountability scales in lockstep. By anchoring digital reputation to sovereign keys, developer domains, and corporate identities, we create a "trust topology" where agents are fully accountable participants in the decentralized economy.'
);
content = content.replace(
    /This architecture is specifically designed to neutralize the threat of 'reputation laundering' and low-cost Sybil attacks\. In a traditional reputation system, an anonymous actor can simulate volume and artificially inflate their standing\. In the Integrity Protocol, mathematical ceilings act as a deterministic firewall\. No matter how many transactions an agent processes or how perfect its latency remains, it can never exceed the trust ceiling defined by its verification standing\. To reach Institutional-grade status \(AAA\), an operator must submit to a rigorous identity audit, effectively staking their real-world brand and legal status against the agent's operational integrity\./g,
    'This architecture mathematically neutralizes "reputation laundering" and Sybil attacks. No matter how many transactions a developer-key agent processes, it can never exceed the 300 AIS Developer Cap. To reach Sovereign (600), Linked (850), or Institutional-grade (1000) status, the agent’s operator must submit to escalating cryptographic and entity audits, effectively staking their real-world standing against the agent’s operational integrity.'
);
content = content.replace(
    /Autonomous identity binding\./g,
    'Base L2 cryptographic key binding.'
);

// Section 3: Deflationary Burn / Tokenomics
content = content.replace(
    /Sovereign Tax Engine/g,
    'Protocol Settlement Engine'
);
content = content.replace(
    /Every reputation-anchored handshake incurs a 0\.5% Sovereign Tax\. 50% is permanently burned \(EIP-1559 style\), creating programmatic scarcity as agent commerce scales globally\./g,
    'Every reputation-anchored execution on the BCC incurs a micro-fee. 50% is permanently burned (EIP-1559 style), creating programmatic scarcity as the agent economy scales globally.'
);

// Section 4: Sovereign DAO
content = content.replace(
    /Governance Without<br \/><span style={{ color: '#8b5cf6' }}>Governance Fatigue\.<\/span>/g,
    'AI-Governed Protocol<br /><span style={{ color: \'#8b5cf6\' }}>By Guardian Agents.</span>'
);
content = content.replace(
    /The Xibalba DAO introduces AI-Proxy Delegation—eliminating complex manual voting by deploying specialized Guardian Agents with constitutional mandates\./g,
    'The ultimate demonstration of the protocol. We eliminate manual voting fatigue by allowing token holders to deploy specialized Guardian Agents with constitutional mandates to govern the protocol.'
);

fs.writeFileSync('src/pages/LandingPage.tsx', content, 'utf8');
console.log('LandingPage.tsx bottom half successfully refactored!');
