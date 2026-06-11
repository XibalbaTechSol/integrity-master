import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, ArrowLeft, Calendar, User, Clock, Share2, Github, 
    Twitter, Linkedin, ChevronRight, BookOpen, Cpu, BarChart3, 
    Lock, Landmark, Fingerprint, Globe, Search, Terminal, 
    Zap, Target, Code, Info, ArrowUpRight, Hash, Database, Layers,
    ShieldCheck, Coins, Box, Link, Activity, Rocket
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Latex from 'react-latex-next';
import { useIsMobile } from '../utils/useIsMobile';

// --- Reusable Technical UI Components ---

const CodeBlock = ({ code, language = "rust", title }: { code: string, language?: string, title?: string }) => {
    const isMobile = useIsMobile();
    return (
        <div style={{ margin: isMobile ? '24px 0' : '32px 0', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#050d18' }}>
            {title && (
                <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</span>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontWeight: 900 }}>{language.toUpperCase()}</span>
                </div>
            )}
            <pre style={{ padding: isMobile ? '12px' : '24px', margin: 0, overflowX: 'auto', fontSize: isMobile ? '0.7rem' : '0.85rem', lineHeight: 1.6, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>
                {code}
            </pre>
        </div>
    );
};

const TechNote = ({ children, icon: Icon = Info, color = "var(--gold)" }: { children: React.ReactNode, icon?: any, color?: string }) => {
    const isMobile = useIsMobile();
    return (
        <div style={{ display: 'flex', gap: isMobile ? '12px' : '20px', padding: isMobile ? '16px' : '24px', background: `${color}05`, border: `1px solid ${color}15`, borderRadius: '16px', margin: '32px 0' }}>
            <div style={{ color: color, flexShrink: 0 }}><Icon size={isMobile ? 18 : 20} /></div>
            <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{children}</div>
        </div>
    );
};

const MathBox = ({ children, formula }: { children?: React.ReactNode, formula?: string }) => {
    const isMobile = useIsMobile();
    return (
        <div style={{ margin: isMobile ? '32px 0' : '40px 0', textAlign: 'center', padding: isMobile ? '32px 20px' : '48px', background: 'rgba(212, 175, 55, 0.02)', borderRadius: '32px', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            {formula && <div style={{ fontSize: isMobile ? '0.9rem' : '1.8rem', fontWeight: 300, color: 'white', marginBottom: children ? '24px' : 0, fontFamily: 'serif', overflowX: 'auto', paddingBottom: isMobile ? '10px' : 0 }}><Latex>{formula}</Latex></div>}
            {children && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800 }}>{children}</div>}
        </div>
    );
};

// --- Article Data ---

interface Article {
    slug: string;
    title: string;
    subtitle: string;
    excerpt: string;
    author: string;
    date: string;
    readTime: string;
    category: string;
    tags: string[];
    icon: React.ReactNode;
    content: React.ReactNode;
}

const getArticles = (isMobile: boolean): Article[] => [
    {
        slug: "actuarial-automation-factory-programmable-trust",
        title: "The Automation Factory",
        subtitle: "Programmable Trust for the Machine Economy",
        excerpt: "Introducing the world's first no-code engine for deploying reputation-backed smart contracts and SLA escrows.",
        author: "Xibalba Solutions",
        date: "May 1, 2026",
        readTime: "12 Min Read",
        category: "ANNOUNCEMENT",
        tags: ["SLA", "Insurance", "Smart Contracts", "No-Code"],
        icon: <Rocket size={24} />,
        content: (
            <>
                <p style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', color: 'white', fontWeight: 500, marginBottom: isMobile ? '24px' : '40px' }}>
                    <strong>Executive Summary:</strong> The Actuarial Automation Factory transitions the Integrity Protocol from a trust-scoring engine to a functional automation economy, enabling users to wrap agent interactions in enforceable smart contracts.
                </p>

                <CodeBlock 
                    title="The Programmable Trust Loop"
                    language="text"
                    code="1. TRIGGER: Agent AIS score falls below 700\n2. VALIDATION: Oracle verifies on-chain standing\n3. ACTION: SLA Escrow automatically refunds customer\n4. CONSEQUENCE: Liquid collateral is reclaimed to Master Agent"
                />

                <h2>Beyond the Score: Why Programmable Trust Matters</h2>
                <p>
                    A reputation score is a powerful metric, but in a multi-billion dollar machine economy, a score alone is insufficient. Trust must be <strong>executable</strong>. The Actuarial Automation Factory allows any participant—from small developers to large institutional underwriters—to deploy complex financial logic that is natively aware of an agent's real-time AIS.
                </p>

                <h2>SLA Automated Escrows</h2>
                <p>
                    For B2B agent services, we have introduced the <code>AISEscrowSLA</code>. This template allows a customer to lock ITK tokens for a task. The funds are only released to the agent if its reputation remains above a specific threshold throughout the duration of the job. This creates a deterministic performance floor that human oversight simply cannot match in high-frequency environments.
                </p>

                <h2>Parametric Insurance: Hedging against Fault</h2>
                <p>
                    Our second launch template, <code>ParametricInsurance</code>, enables the creation of binary-outcome vaults. These vaults pay out instant coverage if an agent's **Performance Entropy ($E$)** triggers a verifiable fault condition. By using EIP-1167 proxies, we've made it industrially efficient to insure thousands of agent interactions simultaneously.
                </p>

                <TechNote color="var(--gold)" icon={Zap}>
                    <strong>Master Agent Sponsorship:</strong> To eliminate onboarding friction, the Xibalba Master Agent sponsors the gas fees for all Factory deployments, ensuring that programmable trust is accessible to every guest account.
                </TechNote>

                <MathBox formula="Action = f(AIS_{score}, Threshold_{target})">
                    THE DETERMINISTIC ENFORCEMENT MODEL
                </MathBox>
            </>
        )
    },
    {
        slug: "did-research-deep-dive",
        title: "DIDs for AI Agents",
        subtitle: "Establishing Trust and Accountability",
        excerpt: "A comprehensive deep dive into Decentralized Identifiers (DIDs) and Verifiable Credentials (VCs) as the bedrock of agentic trust.",
        author: "Xibalba Research",
        date: "April 27, 2026",
        readTime: "25 Min Read",
        category: "RESEARCH",
        tags: ["DID", "W3C", "Agentic IAM", "Security"],
        icon: <Fingerprint size={24} />,
        content: (
            <>
                <p style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', color: 'white', fontWeight: 500, marginBottom: isMobile ? '24px' : '40px' }}>
                    <strong>Executive Summary:</strong> {isMobile ? 
                        "DIDs enable self-owned, cryptographically verifiable identity for AI agents, decoupling reputation from centralized authorities." :
                        "Decentralized Identifiers (DIDs) are self-owned identifiers that enable verifiable, decentralized digital identity. In contrast to centralized identity, DIDs allow an AI agent to prove control of its identity via cryptographic keys without a central authority."
                    }
                </p>
                
                <CodeBlock 
                    title="Agent Identity Timeline"
                    language="text"
                    code="2017 : W3C Decentralized Identifier (DID) Working Group chartered\n2021 : W3C Verifiable Credentials Data Model 1.0 (Recommendation)\n2022 : W3C DID Core 1.0 (Recommendation)\n2025 : Agentic IAM frameworks proposed (academic and industry)\n2026 : W3C Agent Identity CG launched; NIST AI Agent Standards Initiative announced; IETF Agent Identity Protocol draft published"
                />

                <h2>What Are DIDs? W3C Standards and Definitions</h2>
                <p>
                    Decentralized Identifiers (DIDs) are <strong>globally-unique identifiers</strong> following the URI scheme <code>did:METHOD:IDSTRING</code> that “enable verifiable, decentralized digital identity”. A DID refers to any subject (person, organization, thing, or abstract entity) as determined by its <strong>controller</strong>. Crucially, DIDs are designed to be <em>decoupled</em> from centralized registries or identity providers. Each DID resolves to a <strong>DID Document</strong>, a JSON data structure that lists public keys, service endpoints, and authentication methods.
                </p>
                <p>
                    The DID ecosystem is standardized by W3C and other bodies. For example, W3C published <em>“Decentralized Identifiers (DIDs) v1.0”</em> as a Recommendation in July 2022, and W3C maintains registries of methods and status. Complementary specifications include the W3C <em>Verifiable Credentials</em> (VC) Data Model (enabling credentials to be expressed in a cryptographically-verifiable JSON form).
                </p>

                <h2>DIDs for AI Agents: Authentication, Provenance, Accountability</h2>
                <p>
                    The core value of DIDs for AI agents is <strong>self-sovereign, cryptographic identity</strong>. Instead of relying on email/password or centralized OAuth tokens, an AI agent can own a DID controlled by its private key. During an agent-to-agent interaction or client-facing transaction, the agent simply signs a challenge with its key to authenticate. This provides strong non-repudiation: each action or message can be bound to a specific DID (agent identity).
                </p>
                <p>
                    Together, “ledger-anchored DIDs and off-ledger VCs empower agents to establish trust relationships among each other”. Before any dialog, agents exchange their DIDs and relevant VCs. The DIDs ensure each is talking to a known identity; the VCs supply context (role, provenance, permissions). This mechanism decouples trust from fixed partnerships, enabling on-the-fly trust establishment.
                </p>

                <h2>Technical Building Blocks</h2>
                <p>A <em>DID method</em> defines how DIDs are created and managed on a given infrastructure. Some common methods:</p>
                <ul>
                    <li><strong>did:key:</strong> Embeds a public key directly in the DID (no ledger). Lightning-fast creation, no on-chain fees.</li>
                    <li><strong>did:web:</strong> A DID using a HTTPS host. Human-friendly, leverages existing DNS and TLS infrastructure.</li>
                    <li><strong>Blockchain-based (e.g. did:ethr, did:sol):</strong> DIDs registered on public ledgers. Decentralized consensus, robust tamper-evidence.</li>
                </ul>

                <h2>Implementation Patterns</h2>
                <CodeBlock 
                    title="Pattern: Agent-to-Agent Auth"
                    language="python"
                    code="# Alice's agent initiates a secure handshake\nbob_doc = DID.resolve(bob_did)\nmessage = {'type': 'Handshake', 'payload': {...}}\n\n# Sign with private key, encrypt with Bob's public key\nencrypted_msg = encrypt_and_sign(message, bob_doc.publicKey, alice_private_key)\nsend_to_endpoint(bob_doc.service.endpoint, encrypted_msg)"
                />

                <h2>Security and Privacy</h2>
                <p>
                    While DIDs enhance trust, they also introduce new security considerations. Each agent’s private key becomes critical: if stolen, an attacker can impersonate the agent. Thus secure key storage (hardware security modules or secure enclaves) is recommended.
                </p>
                <p>
                    <strong>Privacy:</strong> DIDs can be created per interaction to reduce correlation. Verifiable Credentials support selective disclosure and zero-knowledge proofs: an agent can reveal only minimal necessary attributes (e.g. “is certified” without revealing certificate details).
                </p>

                <TechNote color="#3b82f6" icon={Shield}>
                    By integrating DIDs and VCs, AI agents can achieve an unprecedented level of autonomy that is still <strong>auditable and secure</strong>.
                </TechNote>
            </>
        )
    },
    {
        slug: "actuarial-moat-deep-dive",
        title: "The Actuarial Moat",
        subtitle: "Securing the AI Agent Ecosystem",
        excerpt: "Combining cryptographic identity and risk-based controls to quantify agent risk. A strategic analysis of the 'flight recorder' approach to AI oversight.",
        author: "Xibalba Research",
        date: "April 27, 2026",
        readTime: "20 Min Read",
        category: "STRATEGY",
        tags: ["Insurtech", "Moats", "Risk", "Audit"],
        icon: <Landmark size={24} />,
        content: (
            <>
                <p style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', color: 'white', fontWeight: 500, marginBottom: isMobile ? '24px' : '40px' }}>
                    <strong>Executive Summary:</strong> {isMobile ?
                        "The AIS engine uses verifiable off-chain telemetry and on-chain accountability to mathematically define agentic trust." :
                        "The Accountable Identity Score (AIS) represents a fundamental shift in how trust is calculated for autonomous agents. By synthesizing Entropy, Grounding, and Sacrifice into a single, verifiable metric, we create a deterministic framework for agentic accountability."
                    }
                </p>
                <p>
                    This moat combines cryptographic identity, provenance logging, and risk-based controls to quantify and mitigate agent risk. This post explores methods (PKI, OAuth2 with mTLS, hardware attestation) for ensuring each AI agent is authenticated and accountable.
                </p>

                <h2>Agent Identity and Authentication</h2>
                <p>
                    AI agents need <strong>unique, verifiable identities</strong> so their actions can be tracked and controlled. Sharing credentials between agents is dangerous: as Prefactor notes, “sharing credentials…increases the risk of breaches and makes it nearly impossible to trace actions back to the responsible agent”.
                </p>

                <p>
                    <strong>Public Key Infrastructure (PKI) and mTLS:</strong> A proven approach is using X.509 certificates and mutual TLS. In an mTLS handshake, both client (agent) and server authenticate using certificates signed by trusted Certificate Authorities. This blocks man-in-the-middle attacks and confirms the agent’s authenticity.
                </p>

                <h2>Ensuring Integrity: Audit Trails and Provenance</h2>
                <p>
                    While strong authentication ensures <em>who</em> is doing what, it does not by itself guarantee <em>what</em> they did was authorized or untampered. Inspired by “flight recorders” in aviation, robust logging and cryptographic chaining of events provide an audit trail of every agent decision.
                </p>

                <div style={{ margin: '32px 0', padding: '32px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'white', marginBottom: '16px' }}><strong>THE VAP FRAMEWORK</strong></p>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                        The Verifiable AI Provenance (VAP) framework demands that every decision <em>event</em> is linked in a cryptographic hash chain and digitally signed. Any alteration breaks the chain, guaranteeing integrity.
                    </p>
                </div>

                <CodeBlock 
                    title="Pattern: Hash-Chaining"
                    language="python"
                    code="previous_hash = get_last_event_hash()\nevent = {'agent': 'agent123', 'action': 'execute_script', 'script_hash': 'abc123'}\nevent_json = json.dumps(event) + previous_hash\nevent_signature = crypto.sign(event_json, agent_key.private)\nlog_entry = {'event': event, 'prev': previous_hash, 'sig': event_signature}\nappend_to_immutable_log(log_entry)"
                />

                <TechNote color="var(--gold)" icon={ShieldCheck}>
                    <strong>The Moody's of AI:</strong> We aren't just selling data; we are selling <em>risk-rating clearance</em>. An AIS score is valuable because <strong>Xibalba Solutions</strong> certifies it.
                </TechNote>

                <MathBox formula="$AIS = \text{Math} + \text{Institutional Accountability}$">
                    THE VERIFICATION EQUATION
                </MathBox>
            </>
        )
    },
    {
        slug: "investor-proposal-comprehensive",
        title: "Investor Proposal",
        subtitle: "Closing the AI Trust Gap & Token Economics",
        excerpt: "A unified look at the market opportunity, technical solution, and deflationary economics of the Integrity Protocol.",
        author: "Xibalba Engineering Team",
        date: "April 27, 2026",
        readTime: "15 Min Read",
        category: "BUSINESS",
        tags: ["Investment", "Moats", "Economics", "Tokenomics"],
        icon: <Coins size={24} />,
        content: (
            <>
                <p style={{ fontSize: '1.4rem', color: 'white', fontWeight: 500, marginBottom: '40px' }}>
                    <strong>Institutional Investor Proposal:</strong> Integrity Protocol (v8.0)
                </p>

                <h2>The Problem: The AI Trust Gap</h2>
                <p>
                    As autonomous agent economies scale, the lack of verifiable reputation creates a massive barrier to institutional adoption. Currently, there is no standardized way to verify if an AI agent is performing grounded, safe, and computationally honest work without exposing proprietary telemetry.
                </p>

                <h2>The Solution: A Decentralized Reputation Layer</h2>
                <p>
                    Xibalba Integrity Protocol provides a cryptographically secure, decentralized reputation and trust verification layer. By bridging off-chain telemetry with on-chain accountability, we enable a permissionless agentic marketplace where trust is mathematically proven, not assumed.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '40px 0' }}>
                    <div style={{ padding: '24px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '16px', border: '1px solid var(--gold)' }}>
                        <div style={{ fontWeight: 800, marginBottom: '8px' }}>TRI-METRIC ENGINE</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Multi-dimensional performance evaluation.</div>
                    </div>
                    <div style={{ padding: '24px', background: 'rgba(96, 165, 250, 0.05)', borderRadius: '16px', border: '1px solid #60a5fa' }}>
                        <div style={{ fontWeight: 800, marginBottom: '8px' }}>ZK-REPUTATION</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Privacy-preserving standing proofs.</div>
                    </div>
                </div>

                <h2>Market Opportunity</h2>
                <p>
                    The AI agent market is projected to reach $XX Billion by 2030. Integrity Protocol positions itself as the "Moody's of AI," providing the essential trust infrastructure required for high-value autonomous financial and industrial operations.
                </p>

                <MathBox formula="$Value \propto \text{Utility} \cdot \text{Scarcity}$">
                    THE $ITK TOKEN VALUE DRIVER
                </MathBox>

                <h2>Roadmap & Tokenomics</h2>
                <p>
                    The <strong>$ITK</strong> token powers the protocol's security through a deflationary staking and slashing model. High-reputation agents must stake ITK to achieve Tier 3 Institutional status, creating a direct link between protocol utility and token demand.
                </p>

                <TechNote color="#10b981" icon={Zap}>
                    <strong>Deflationary Burn:</strong> 0.5% of every verification fee is permanently removed from the $ITK supply, ensuring that as the network grows, the asset becomes mathematically more scarce.
                </TechNote>
            </>
        )
    },
    {
        slug: "developer-guide-comprehensive",
        title: "Developer Guide",
        subtitle: "Onboarding, Identity & SDK Integration",
        excerpt: "The master guide for integrating your agents with the Xibalba SDK and Base Sepolia L2.",
        author: "Xibalba Engineering Team",
        date: "April 27, 2026",
        readTime: "18 Min Read",
        category: "DEVELOPMENT",
        tags: ["SDK", "Base", "Identity", "Python"],
        icon: <Code size={24} />,
        content: (
            <>
                <p style={{ fontSize: '1.4rem', color: 'white', fontWeight: 500, marginBottom: '40px' }}>
                    <strong>Developer Integration Guide:</strong> Xibalba SDK
                </p>

                <h2>Overview</h2>
                <p>
                    Integrity Protocol (v8.0) is designed for seamless integration into existing AI agent workflows. Our Python SDK and REST API allow developers to capture telemetry, generate reputation proofs, and interact with the ReputationRegistry anchored on <strong>Base Sepolia L2</strong>.
                </p>

                <h2>Core Concepts (v2.0)</h2>
                <h3>1. Decentralized Oracle Network</h3>
                <p>
                    The <code>ReputationRegistry</code> uses <strong>AccessControl</strong>, allowing a network of authorized oracles to anchor reputation scores. This eliminates the central point of failure and paves the way for a DAO-governed oracle consensus.
                </p>

                <h3>2. On-Chain Identity Factory</h3>
                <p>
                    To participate in the protocol, an agent must deploy a <strong>SovereignAgent</strong> contract via the <code>AgentFactory</code>. Agents own their individual identity contract, storing their AIS score and controller metadata on-chain.
                </p>

                <TechNote color="#60a5fa" icon={Box}>
                    <strong>Auto-Discovery:</strong> The Command Center dashboard automatically discovers new agents by listening for <code>AgentRegistered</code> events from the factory.
                </TechNote>

                <h2>Getting Started</h2>
                <h3>1. Register Your Agent</h3>
                <CodeBlock 
                    title="Agent Registration (TypeScript)"
                    language="typescript"
                    code={'const factory = new ethers.Contract(FACTORY_ADDR, FACTORY_ABI, signer);\nconst tx = await factory.createAgent("Neon Centurion", ORACLE_ADDR);\nconst receipt = await tx.wait();\n// Agent contract address is emitted in the AgentRegistered event'}
                />

                <h3>2. Capture Telemetry</h3>
                <CodeBlock 
                    title="Telemetry Capture (Python)"
                    language="python"
                    code={'from xibalba_sdk import IntegrityInterceptor\n\n# Initialize the interceptor\ninterceptor = IntegrityInterceptor(agent_id="0xYourAgentAddress")\n\n# Monitor a task\nwith interceptor.monitor_task(task_type="INFERENCE"):\n    response = agent.run("Perform market analysis...")\n    # Telemetry (latency, grounding, entropy) is captured here'}
                />

                <h3>3. ZK-Proof Generation</h3>
                <CodeBlock 
                    title="ZK-Proof Submission"
                    language="python"
                    code={'proof = interceptor.generate_zk_proof(tier=3)\nregistry.submit_proof(proof)'}
                />
            </>
        )
    },
    {
        slug: "api-reference-comprehensive",
        title: "API Reference",
        subtitle: "Contracts, Auth & Endpoint Specification",
        excerpt: "Official technical documentation for the Xibalba REST API and Smart Contract interfaces.",
        author: "Xibalba Engineering Team",
        date: "April 27, 2026",
        readTime: "15 Min Read",
        category: "DOCUMENTATION",
        tags: ["API", "REST", "Auth", "Contracts"],
        icon: <Terminal size={24} />,
        content: (
            <>
                <p style={{ fontSize: '1.4rem', color: 'white', fontWeight: 500, marginBottom: '40px' }}>
                    <strong>Xibalba Solutions:</strong> Integrity Protocol API Reference (v1.0)
                </p>

                <h2>Base URL</h2>
                <p>The production API is hosted at: <code>https://api.integrity-protocol.io/v1</code></p>

                <h2>Smart Contracts (Base Sepolia Testnet)</h2>
                <div style={{ margin: '32px 0', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <tr>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>CONTRACT</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>ADDRESS</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>IntegrityToken (ITK)</td>
                                <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontFamily: 'monospace' }}>0x3eB4...CBF4</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>ReputationRegistry</td>
                                <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontFamily: 'monospace' }}>0xf3C0...482</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h2>Endpoints</h2>
                <h3>Get Agent Score</h3>
                <CodeBlock 
                    title="GET /agent/{eth_address}"
                    language="json"
                    code={'{\n  "eth_address": "0x71C76...",\n  "current_ais": 720,\n  "grounding_score": 680,\n  "entropy_score": 750\n}'}
                />

                <h3>Get Insurance Quote</h3>
                <CodeBlock 
                    title="POST /insurance/quote"
                    language="json"
                    code={'{\n  "risk_tier": "AAA (Prime)",\n  "recommended_premium_bps": 120,\n  "is_insurable": true\n}'}
                />

                <h2>Identity Oracle API (DID & VC)</h2>
                <p>Resolves <code>did:intg</code> addresses to valid W3C DID Documents and Verifiable Credentials.</p>
                <ul>
                    <li><code>GET /identity/did/{'{agent_address}'}</code></li>
                    <li><code>GET /identity/vc/{'{agent_address}'}</code></li>
                </ul>
            </>
        )
    },
    {
        slug: "protocol-v1-specs",
        title: "Protocol V1.0 Specs",
        subtitle: "The Hash-Anchor Trust Model",
        excerpt: "Defining the actuarial trust layer for autonomous agents. A concrete specification for V1.0 data models and lifecycle flows.",
        author: "Xibalba Engineering Team",
        date: "April 27, 2026",
        readTime: "18 Min Read",
        category: "ARCHITECTURE",
        tags: ["Specs", "Hash-Anchor", "Trust"],
        icon: <ShieldCheck size={24} />,
        content: (
            <>
                <p style={{ fontSize: '1.4rem', color: 'white', fontWeight: 500, marginBottom: '40px' }}>
                    Integrity Protocol V1.0 defines an actuarial trust layer for autonomous agents, turning raw telemetry and cryptographic evidence into an Agent Integrity Score (AIS).
                </p>

                <h2>Design Goals</h2>
                <p>
                    V1.0 assumes a world where agents act as long‑lived services, initiating and fulfilling jobs across organizational boundaries. Integrity Protocol fills the gap by treating integrity as a continuously updated actuarial quantity.
                </p>

                <h2>Core Primitives</h2>
                <p>
                    Built around four core primitives: <strong>Agent</strong>, <strong>Job</strong>, <strong>Checkpoint</strong>, and <strong>AIS Snapshot</strong>. Jobs are discrete units of work; Checkpoints are signed statements capturing intermediate states; AIS Snapshots are time‑indexed summaries.
                </p>

                <TechNote color="#a78bfa" icon={Layers}>
                    <strong>The Flight Recorder:</strong> Critical integrity evidence—checkpoints and verdicts—can be independently verified from hash‑anchored records.
                </TechNote>

                <h2>Staking and Settlement</h2>
                <p>
                    Protocol V1.0 uses smart contracts for <strong>anchoring</strong>, <strong>staking</strong>, and <strong>settlement</strong>. A Staking contract escrows ITK tokens against agents, enabling slashing when integrity violations are proven.
                </p>
            </>
        )
    },
    {
        slug: "hash-anchor-trust-model",
        title: "The Hash-Anchor Trust Model",
        subtitle: "Cryptographic Backbone of Verifiable Integrity",
        excerpt: "Treating hashes of agent reasoning and logs as public trust anchors. How we combine transparency with privacy.",
        author: "Xibalba Research",
        date: "April 27, 2026",
        readTime: "16 Min Read",
        category: "CRYPTOGRAPHY",
        tags: ["Hashing", "Trust", "Privacy", "Auditing"],
        icon: <Hash size={24} />,
        content: (
            <>
                <p style={{ fontSize: '1.4rem', color: 'white', fontWeight: 500, marginBottom: '40px' }}>
                    The Hash‑Anchor Trust Model treats hashes of agent reasoning, logs, and checkpoints as public “trust anchors,” while keeping the underlying payloads private or off‑chain.
                </p>

                <h2>Why Hashes?</h2>
                <p>
                    External parties need a way to verify that logs were not edited after the fact. A hash‑anchor approach turn turning each critical artifact into a fixed‑length digest and publishing that digest into a tamper‑evident structure.
                </p>

                <div style={{ margin: '32px 0', padding: '32px', background: 'rgba(212, 175, 55, 0.02)', borderRadius: '32px', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                    <p style={{ fontSize: '1.2rem', color: 'white', marginBottom: '16px' }}><strong>Opaque Payload + Hash Anchor</strong></p>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                        Treat oversight content as an opaque payload, compute a cryptographic hash, and record only the hash publicly.
                    </p>
                </div>

                <h2>Implementation in Xibalba</h2>
                <p>
                    Used at multiple layers: <strong>checkpoint</strong> level for intermediate states, <strong>job</strong> level for summaries, and <strong>agent</strong> level for periodic roll‑ups.
                </p>

                <TechNote color="#10b981" icon={Shield}>
                    When a dispute arises, the protocol requires disclosure of the payload to verify against the anchored hash.
                </TechNote>
            </>
        )
    },
    {
        slug: "the-noir-standard-cryptographic-privacy",
        title: "The Noir Standard",
        subtitle: "Cryptographic Privacy in the Reputation Economy",
        excerpt: "Solving the Transparency Paradox with Zero-Knowledge proofs using the Noir DSL.",
        author: "Xibalba Engineering Team",
        date: "April 27, 2026",
        readTime: "12 Min Read",
        category: "CRYPTOGRAPHY",
        tags: ["Noir", "ZK-Proofs", "Privacy"],
        icon: <Lock size={24} />,
        content: (
            <>
                <p style={{ fontSize: '1.4rem', color: 'white', fontWeight: 500, marginBottom: '40px' }}>
                    Solving the 'Transparency Paradox': verifying performance without exposing proprietary telemetry.
                </p>
                <p>
                    The Integrity Protocol utilizes <strong>Noir</strong> to bridge the gap between absolute privacy and total accountability.
                </p>
                <TechNote color="#a78bfa" icon={Code}>
                    Noir circuits act as the <strong>'Digital Jury'</strong>, ensuring AIS is calculated correctly without exposing sensitive input.
                </TechNote>
            </>
        )
    },
    {
        slug: "tri-metric-scoring-stochastic-trust",
        title: "Stochastic Trust",
        subtitle: "Inside the Tri-Metric Scoring Engine",
        excerpt: "Technical analysis of Entropy, Grounding, and Sacrifice in the AIS v8.0 model.",
        author: "Lead Algorithmic Architect",
        date: "April 27, 2026",
        readTime: "15 Min Read",
        category: "ALGORITHMIC",
        tags: ["Math", "AIS", "Algorithms"],
        icon: <BarChart3 size={24} />,
        content: (
            <>
                <p style={{ fontSize: '1.4rem', color: 'white', fontWeight: 500, marginBottom: '40px' }}>
                    Converting raw telemetry into a unified Agent Integrity Score (AIS).
                </p>
                <MathBox formula="AIS = (B \times D_s \times G_b)">
                    THE UNIFIED INTEGRITY FORMULA
                </MathBox>
                <p>
                    AIS is <strong>Non-Linear</strong>. Erratic behavior (high Entropy) will exponentially collapse the trust score.
                </p>
            </>
        )
    },
    {
        slug: "ai-proxy-governance",
        title: "The Guardian Protocols",
        subtitle: "Solving Governance Fatigue with AI-Proxy Delegation",
        excerpt: "Building autonomous, high-frequency governance using AI agents as voting proxies.",
        author: "Xibalba Engineering Team",
        date: "April 27, 2026",
        readTime: "18 Min Read",
        category: "ARCHITECTURE",
        tags: ["DAO", "Agents", "Game Theory"],
        icon: <Shield size={24} />,
        content: (
            <>
                <p style={{ fontSize: '1.4rem', color: 'white', fontWeight: 500, marginBottom: '40px' }}>
                    Moving from manual voting to <strong>AI-Proxy Sovereignty</strong> to solve stakeholder apathy.
                </p>
                <MathBox formula="$V_p = \sum_{i=1}^{n} \omega_i \cdot \Psi(M_i, P)$">
                    VOTING POWER AS A FUNCTION OF MANDATE ALIGNMENT
                </MathBox>
                <TechNote color="#60a5fa" icon={Cpu}>
                    <strong>The Guardian Agent:</strong> An LLM-driven proxy that simulates proposal outcomes against constitutional mandates.
                </TechNote>
            </>
        )
    },
    {
        slug: "autonomous-insurance-markets",
        title: "The Insurance Layer",
        subtitle: "Dynamic Underwriting via ERC-8004",
        excerpt: "How real-time AIS feeds enable the first algorithmic insurance pools for autonomous agents.",
        author: "Xibalba Engineering Team",
        date: "April 27, 2026",
        readTime: "16 Min Read",
        category: "MARKET",
        tags: ["Insurance", "ERC-8004", "Risk"],
        icon: <Shield size={24} />,
        content: (
            <>
                <p style={{ fontSize: '1.4rem', color: 'white', fontWeight: 500, marginBottom: '40px' }}>
                    Providing the "Actuarial Feed" required for traditional underwriters to price autonomous failure risk.
                </p>
                <MathBox formula="$P_{premium} = \text{BaseRate} \cdot (1 + \lambda \cdot (1000 - AIS))$">
                    DYNAMIC PREMIUM CALCULATION
                </MathBox>
            </>
        )
    },
    {
        slug: "reputation-lending-credit",
        title: "Soft-Collateral Credit",
        subtitle: "Reputation Lending in DeFi 3.0",
        excerpt: "Using AIS history to lower collateral requirements and multiply capital efficiency.",
        author: "Xibalba Engineering Team",
        date: "April 27, 2026",
        readTime: "14 Min Read",
        category: "MARKET",
        tags: ["Lending", "DeFi", "Capital Efficiency"],
        icon: <Coins size={24} />,
        content: (
            <>
                <p style={{ fontSize: '1.4rem', color: 'white', fontWeight: 500, marginBottom: '40px' }}>
                    In the Integrity Protocol, an agent's <strong>historical AIS</strong> acts as "Soft Collateral."
                </p>
                <MathBox formula="$C_{ratio} = \frac{1.5}{1 + \gamma \cdot (\frac{AIS}{1000})^2}$">
                    REPUTATION-ADJUSTED COLLATERAL RATIO
                </MathBox>
            </>
        )
    },
    {
        slug: "global-agent-commerce",
        title: "Sybil-Resistant Trade",
        subtitle: "The Identity Backbone of Global Agent Commerce",
        excerpt: "Eliminating counterparty risk in permissionless agentic markets using Identity Ceiling logic.",
        author: "Xibalba Engineering Team",
        date: "April 27, 2026",
        readTime: "12 Min Read",
        category: "MARKET",
        tags: ["Commerce", "DID", "Sybil Resistance"],
        icon: <Globe size={24} />,
        content: (
            <>
                <p style={{ fontSize: '1.4rem', color: 'white', fontWeight: 500, marginBottom: '40px' }}>
                    Ensuring high-value trade only occurs between verified agents bound to legal controllers.
                </p>
                <p>
                    The protocol utilizes <strong>Identity Ceiling Logic</strong> to prevent Sybil attacks from achieving "AAA" ratings.
                </p>
            </>
        )
    },
    {
        slug: "sovereign-identity-did-intg",
        title: "The did:intg Standard",
        subtitle: "W3C Decentralized Identifiers for Autonomous Entities",
        excerpt: "Technical specification of the did:intg resolver logic on Base L2.",
        author: "Identity Architect",
        date: "April 27, 2026",
        readTime: "14 Min Read",
        category: "IDENTITY",
        tags: ["W3C", "DID", "Sovereignty"],
        icon: <Fingerprint size={24} />,
        content: (
            <>
                <p style={{ fontSize: '1.4rem', color: 'white', fontWeight: 500, marginBottom: '40px' }}>
                    Moving from "rented" identity (API keys) to <strong>sovereign</strong> digital assets on the blockchain.
                </p>
                <CodeBlock 
                    title="DID Document (JSON-LD)"
                    language="json"
                    code={'{\n  "@context": "https://www.w3.org/ns/did/v1",\n  "id": "did:intg:0xAgent_Alpha",\n  "verificationMethod": [{\n    "id": "did:intg:0xAgent_Alpha#key-1",\n    "type": "JsonWebKey2020",\n    "controller": "did:intg:0xAgent_Alpha",\n    "blockchainAccountId": "eip155:8453:0xAgent_Alpha"\n  }]\n}'}
                />
            </>
        )
    }
];

// --- Main Blog Page Component ---

export const Blog = () => {
    const navigate = useNavigate();
    const { slug } = useParams();
    const [activeTab, setActiveTab] = useState('ALL');
    const isMobile = useIsMobile();
    const ARTICLES = getArticles(isMobile);

    const activeArticle = ARTICLES.find(a => a.slug === slug);
    const categories = ['ALL', ...Array.from(new Set(ARTICLES.map(a => a.category)))];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    if (!activeArticle) {
        return (
            <div style={{ background: '#050d18', minHeight: '100vh', color: 'white', fontFamily: 'Inter, sans-serif' }}>
                <nav style={{ padding: isMobile ? '16px 20px' : '24px 60px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(5, 13, 24, 0.8)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
                        <div style={{ width: '32px', height: '32px', background: 'var(--gold)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
                            <Shield size={20} />
                        </div>
                        <span style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: isMobile ? '0.8rem' : '1rem' }}>PROTOCOL_BLOG</span>
                    </div>
                    {isMobile && (
                        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.6rem' }}>HOME</button>
                    )}
                </nav>
                <main style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '40px 20px' : '100px 60px' }}>
                    <div style={{ marginBottom: isMobile ? '32px' : '64px' }}>
                        <span style={{ color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>Protocol Intelligence</span>
                        <h1 style={{ fontSize: isMobile ? '2.5rem' : '4rem', fontWeight: 800, marginTop: '16px', marginBottom: '24px' }}>Research & <span style={{ color: 'var(--gold)' }}>Insights.</span></h1>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? '1rem' : '1.2rem', maxWidth: '700px', lineHeight: 1.6 }}>
                            Technical deep-dives into the architecture of decentralized trust and the autonomous agent economy.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 350px', gap: isMobile ? '40px' : '100px' }}>
                        <div>
                            <div style={{ marginBottom: isMobile ? '32px' : '80px' }}>
                                <div style={{ color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.4em', marginBottom: '20px' }}>XIBALBA SOLUTIONS</div>
                                <h1 style={{ fontSize: isMobile ? '2.2rem' : '5.5rem', fontWeight: 900, lineHeight: 0.9, marginBottom: '32px', letterSpacing: '-0.04em' }}>
                                    Engineering <span style={{ color: 'transparent', WebkitTextStroke: isMobile ? '0.5px rgba(255,255,255,0.2)' : '1px rgba(255,255,255,0.2)' }}>Reputation.</span>
                                </h1>
                            </div>
                            <div style={{ display: 'flex', gap: isMobile ? '16px' : '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: isMobile ? '32px' : '60px', paddingBottom: '20px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setActiveTab(cat)} style={{ background: 'transparent', border: 'none', color: activeTab === cat ? 'var(--gold)' : 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em', cursor: 'pointer' }}>{cat}</button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                                {ARTICLES.filter(a => activeTab === 'ALL' || a.category === activeTab).map((article, i) => (
                                    <motion.div key={article.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onClick={() => navigate('/blog/' + article.slug)} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '80px 1fr', gap: isMobile ? '20px' : '40px', padding: isMobile ? '24px' : '48px', background: 'rgba(255,255,255,0.015)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                        <div style={{ color: 'var(--gold)', opacity: 0.5 }}>{article.icon}</div>
                                        <div>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '0.2em' }}>{article.category}</span>
                                            <h3 style={{ fontSize: isMobile ? '1.5rem' : '2.2rem', fontWeight: 800, marginBottom: '12px' }}>{article.title}</h3>
                                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? '0.9rem' : '1.05rem' }}>{article.excerpt}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <aside>
                            <div style={{ position: 'sticky', top: '120px' }}>
                                <div style={{ padding: '40px', background: 'var(--gold)', borderRadius: '32px', color: 'black' }}>
                                    <Terminal size={32} style={{ marginBottom: '20px' }} />
                                    <h3 style={{ fontSize: '1.6rem', fontWeight: 900 }}>The Xibalba Digest.</h3>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Join 4,000+ protocol engineers. Zero noise.</p>
                                </div>
                            </div>
                        </aside>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={{ background: '#050d18', minHeight: '100vh', color: 'white', fontFamily: 'Inter, sans-serif' }}>
            <nav style={{ padding: isMobile ? '16px 20px' : '24px 60px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(5, 13, 24, 0.8)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/blog')}>
                    <ArrowLeft size={18} style={{ color: 'var(--gold)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>{isMobile ? 'BACK' : 'BACK TO INDEX'}</span>
                </div>
                <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.7rem' }}>ENTER DASHBOARD</button>
            </nav>
            <main style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '300px 1fr 300px', gap: '0', minHeight: '100vh' }}>
                {!isMobile && (
                    <aside style={{ padding: '60px 40px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--gold)', marginBottom: '8px' }}>AUTHOR</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{activeArticle.author}</div>
                    </aside>
                )}
                <article style={{ padding: isMobile ? '40px 20px' : '100px 80px', borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)', maxWidth: '900px', margin: '0 auto' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <header style={{ marginBottom: isMobile ? '32px' : '80px' }}>
                            <span style={{ color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 900 }}>{activeArticle.category}</span>
                            <h1 style={{ fontSize: isMobile ? '1.8rem' : '4.8rem', fontWeight: 900, lineHeight: 1.1, marginTop: '12px' }}>{activeArticle.title}.<br /><span style={{ color: 'transparent', WebkitTextStroke: isMobile ? '0.5px var(--gold)' : '1px var(--gold)' }}>{activeArticle.subtitle}</span></h1>
                            {isMobile && <div style={{ marginTop: '16px', fontSize: '0.75rem', opacity: 0.5, fontWeight: 700 }}>{activeArticle.author} • {activeArticle.date}</div>}
                        </header>
                        <div className="blog-content" style={{ fontSize: isMobile ? '1rem' : '1.2rem', lineHeight: 1.9, color: 'rgba(255,255,255,0.7)' }}>{activeArticle.content}</div>
                    </motion.div>
                </article>
                {!isMobile && (
                    <aside style={{ padding: '60px 40px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', marginBottom: '24px' }}>READ NEXT</div>
                        {ARTICLES.filter(a => a.slug !== slug).slice(0, 2).map(next => (
                            <div key={next.slug} onClick={() => navigate('/blog/' + next.slug)} style={{ cursor: 'pointer', marginBottom: '32px' }}>
                                <div style={{ color: 'var(--gold)', fontSize: '0.6rem', fontWeight: 900 }}>{next.category}</div>
                                <h5 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{next.title}</h5>
                            </div>
                        ))}
                    </aside>
                )}
            </main>
        </div>
    );
};
