import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Code, Shield, ExternalLink, Activity, Zap, Target, Database, FileCheck, Fingerprint, Globe, Key, Search, ArrowRight, Copy, Github, Cpu, Building2, ShieldCheck, Lock, Coins, Eye, FileText, Vote, Network, TrendingUp, Flame, Users, GitBranch, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Latex from 'react-latex-next';
import { ProtocolStats } from '../components/ProtocolStats';
import { BlockchainVisualizer } from '../components/BlockchainVisualizer';
import { LiveVerificationBridge } from '../components/LiveVerificationBridge';
import { ContactModal } from '../components/ContactModal';
import { IdentityStandards } from '../components/IdentityStandards';
import { ProtocolArchitecture } from '../components/ProtocolArchitecture';
import { InvestorVisionSection } from '../components/InvestorVisionSection';
import { ReputationMetricsSection } from '../components/ReputationMetricsSection';
import { RegistryExplorer } from '../components/RegistryExplorer';
import { RequestStream } from '../components/RequestStream';
import { useIsMobile } from '../utils/useIsMobile';
import { Menu, X } from 'lucide-react';

export const LandingPage = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [contactType, setContactType] = useState<'investor' | 'developer'>('investor');
    const [isRegistryOpen, setIsRegistryOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div style={{ background: 'var(--navy-deep)', color: 'white', minHeight: '100vh', overflowX: 'hidden' }}>
            {/* Cinematic Header */}
            <header style={{ 
                position: 'fixed', top: 0, width: '100%', zIndex: 100, 
                background: scrolled ? 'rgba(5, 13, 24, 0.9)' : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: scrolled ? (isMobile ? '12px 20px' : '12px 60px') : (isMobile ? '20px 20px' : '32px 60px')
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
                        <img 
                            src="https://xibalbatechsol.github.io/xibalba-solutions-site/XibalbaSolutionsLogo.png" 
                            alt="Xibalba" 
                            style={{ height: isMobile ? '24px' : (scrolled ? '32px' : '48px'), transition: 'all 0.4s' }} 
                        />
                        <div>
                             <div style={{ fontSize: isMobile ? '0.8rem' : '1.1rem', fontWeight: 800, letterSpacing: '0.15em' }}>INTEGRITY <span style={{ color: 'var(--gold)', fontWeight: 400 }}>v8.3</span></div>
                            <div style={{ fontSize: isMobile ? '0.45rem' : '0.55rem', color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em' }}>Xibalba Sovereign Protocol</div>
                        </div>
                    </div>
                    
                    {isMobile ? (
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                            <button onClick={() => { setContactType('investor'); setIsContactOpen(true); }} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '10px 24px' }}>Partner Gateway</button>
                            <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '10px 24px' }}>Launch Dashboard</button>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMobile && isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ 
                                background: 'var(--navy-deep)', 
                                overflow: 'hidden',
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                marginTop: '12px',
                                padding: '24px 0'
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <button onClick={() => { setContactType('investor'); setIsContactOpen(true); setIsMobileMenuOpen(false); }} className="btn btn-secondary">Partner Gateway</button>
                                <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }} className="btn btn-primary">Launch Dashboard</button>
                                <button onClick={() => { navigate('/blog'); setIsMobileMenuOpen(false); }} className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>Protocol Blog</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Hero Section */}
            <header style={{ padding: '160px 0 100px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'var(--gold)', filter: 'blur(150px)', borderRadius: '50%' }}></div>
                </div>
                
                <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <motion.img 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            src="https://xibalbatechsol.github.io/xibalba-solutions-site/XibalbaSolutionsLogo.png"
                            alt="Xibalba Solutions"
                            style={{ height: isMobile ? '160px' : '440px', width: 'auto', marginBottom: '16px', filter: 'drop-shadow(0 0 30px rgba(201, 168, 76, 0.3))' }}
                            />
                            <span style={{ color: 'var(--gold)', fontSize: isMobile ? '0.65rem' : '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: isMobile ? '0.3em' : '0.6em', marginBottom: '12px', display: 'block' }}>Actuarial Standards for AI</span>

                        <h1 style={{ fontSize: isMobile ? '1.8rem' : 'clamp(2rem, 5vw, 4rem)', marginBottom: '24px', fontFamily: 'Playfair Display, serif', lineHeight: 1.1, letterSpacing: '-0.02em', padding: isMobile ? '0 10px' : '0' }}>
                            Know your agent's trustworthiness <br /><span style={{ color: 'var(--gold)' }}>before you stake your reputation on it.</span>
                        </h1>
                        <p style={{ fontSize: isMobile ? '0.95rem' : '1.15rem', color: 'rgba(255,255,255,0.85)', maxWidth: '900px', margin: '0 auto 32px', lineHeight: 1.7, fontWeight: 500, padding: isMobile ? '0 10px' : '0' }}>
                            The Integrity Protocol is the first institutional-grade <strong>Credit Bureau for Autonomous AI</strong>.
                        </p>
                        <p style={{ fontSize: isMobile ? '0.85rem' : '1rem', color: 'rgba(255,255,255,0.4)', maxWidth: '850px', margin: '0 auto 48px', lineHeight: 1.8, padding: isMobile ? '0 10px' : '0' }}>
                            {isMobile ? 
                                "Trust in the agentic web requires more than intuition. We provide the actuarial layer for verifiable machine reputation." :
                                "In an economy managed by autonomous agents, trust is the scarcest resource. Our protocol provides the definitive Tri-Metric assessment layer—anchored on Base L2—to verify machine reliability, grounding, and commercial accountability at scale. Currently piloting via the Xibalba Sovereign Intelligence Node."
                            }
                        </p>
                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row', padding: isMobile ? '0 20px' : '0' }}>
                            <button 
                                onClick={() => { setContactType('investor'); setIsContactOpen(true); }} 
                                className="btn btn-primary" 
                                style={{ padding: isMobile ? '16px 24px' : '20px 48px', fontSize: '0.9rem' }}
                            >
                                <Mail size={18} /> Institutional Inquiries
                            </button>
                            <button 
                                onClick={() => { setContactType('developer'); setIsContactOpen(true); }} 
                                className="btn btn-outline" 
                                style={{ border: '1.5px solid rgba(255,255,255,0.2)', color: 'white', padding: isMobile ? '16px 24px' : '20px 48px', fontSize: '0.9rem', background: 'transparent', cursor: 'pointer', borderRadius: '12px' }}
                            >
                                <Code size={18} /> Developer Integration
                            </button>
                        </div>

                        {/* XNS Callout */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            style={{ marginTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? '16px' : '20px' }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: isMobile ? '8px' : '16px', 
                                    padding: isMobile ? '10px 16px' : '12px 24px', 
                                    background: 'rgba(212, 175, 55, 0.08)', 
                                    border: '1px solid rgba(212, 175, 55, 0.15)', 
                                    borderRadius: '100px',
                                    cursor: 'pointer',
                                    transition: 'background 0.3s',
                                    maxWidth: '100%',
                                    overflow: 'hidden'
                                }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.12)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)'}
                                    onClick={() => setIsRegistryOpen(true)}
                                >
                                    <span style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        XNS Resolver — <span style={{ opacity: 0.8 }}>Free for Agents</span>
                                    </span>
                                    <div style={{ width: '1px', height: '14px', background: 'rgba(212, 175, 55, 0.3)', flexShrink: 0 }} />
                                    <span style={{ fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                        EXPLORE <ArrowRight size={14} />
                                    </span>
                                </div>
                                
                                <a 
                                    href="/docs/whitepaper.md" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ 
                                        fontSize: isMobile ? '0.65rem' : '0.75rem', 
                                        fontWeight: 800, 
                                        color: 'rgba(255,255,255,0.4)', 
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'color 0.3s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                                >
                                    CORE PROTOCOL <FileText size={14} />
                                </a>
                                
                                <a 
                                    href="/docs/tokenomics.md" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ 
                                        fontSize: isMobile ? '0.65rem' : '0.75rem', 
                                        fontWeight: 800, 
                                        color: 'var(--gold)', 
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'color 0.3s',
                                        background: 'rgba(212, 175, 55, 0.1)',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(212, 175, 55, 0.3)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)'}
                                >
                                    TOKENOMICS ($ITK) <ExternalLink size={14} />
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </header>

            {/* Investor Vision & Thesis Section */}
            <InvestorVisionSection />

            {/* Reputation Metrics Section */}
            <ReputationMetricsSection />

            {/* Technical Architecture Deep-Dive */}
            <ProtocolArchitecture />


            {/* Identity Standards Section */}
            <IdentityStandards />

            {/* Actuarial Automation Factory Section */}
            <section style={{ padding: isMobile ? '60px 20px' : '120px 60px', background: 'rgba(5, 13, 24, 0.98)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: isMobile ? '40px' : '100px', alignItems: 'center' }}>
                        <div>
                            <span style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '16px', display: 'block' }}>Actuarial Automation Factory</span>
                            <h2 style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: 800, marginBottom: '32px', lineHeight: 1.1 }}>Programmable Trust.<br /><span style={{ color: 'var(--gold)' }}>On-Chain Enforcement.</span></h2>
                            <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.8, marginBottom: '32px', fontWeight: 500 }}>
                                Transitioning from a trust score to a functional automation economy. The Integrity Protocol now features the world's first no-code engine for deploying reputation-backed financial logic.
                            </p>
                            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, marginBottom: '40px' }}>
                                Raw reputation scores are valuable, but on-chain enforcement is definitive. Our No-Code Factory allows enterprises and developers to wrap autonomous agent interactions in cryptographically enforceable contracts. Whether it's ensuring an agent meets performance SLAs before payment release or automatically triggering insurance payouts during a service outage, the Integrity Protocol provides the actuarial floor for machine-to-machine commerce.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px', marginBottom: '48px' }}>
                                <div className="enterprise-card" style={{ padding: '32px', background: 'rgba(255,255,255,0.01)', borderLeft: '4px solid #10b981' }}>
                                    <div style={{ color: '#10b981', marginBottom: '16px' }}><Zap size={24} /></div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>SLA Automated Escrows</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
                                        Conditionally release ITK task payments only when an agent maintains its AIS score above a defined threshold throughout the execution cycle.
                                    </p>
                                </div>
                                <div className="enterprise-card" style={{ padding: '32px', background: 'rgba(255,255,255,0.01)', borderLeft: '4px solid #3b82f6' }}>
                                    <div style={{ color: '#3b82f6', marginBottom: '16px' }}><ShieldCheck size={24} /></div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>Parametric Insurance</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
                                        Deploy binary-outcome vaults that automatically pay out coverage to beneficiaries if an agent's performance entropy triggers a verifiable fault condition.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '20px' }}>
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className="btn btn-primary" 
                                >
                                    OPEN THE FACTORY
                                </button>
                                <a 
                                    href="https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/actuarial-automation-factory.md" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-outline" 
                                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}
                                >
                                    READ FACTORY SPECS
                                </a>
                            </div>
                        </div>

                        <div className="enterprise-card" style={{ padding: 0, background: '#050d18', border: '1px solid rgba(212, 175, 55, 0.1)', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.4)', position: 'relative' }}>
                            <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <Code size={14} style={{ color: 'var(--gold)' }} />
                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>contracts/NoCodeFactory.sol</span>
                                </div>
                                <div className="badge badge-gold" style={{ fontSize: '0.5rem' }}>EIP-1167 PROXY</div>
                            </div>
                            <pre style={{ padding: '32px', margin: 0, overflowX: 'auto', fontSize: '0.85rem', lineHeight: 1.6, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                                <code style={{ color: '#c9a84c' }}>function</code> <code style={{ color: '#10b981' }}>deploySLA</code>(<br />
                                {'  '}address _agent,<br />
                                {'  '}uint256 _minAIS,<br />
                                {'  '}uint256 _amount<br />
                                ) <code style={{ color: '#c9a84c' }}>external</code> returns (address) {'{\n'}
                                {'  '} <code style={{ color: 'rgba(255,255,255,0.3)' }}>// Pull real-time reputation from registry</code>{'\n'}
                                {'  '} (uint256 currentAIS, , , ) = registry.getAgent(_agent);{'\n'}
                                {'  '} <code style={{ color: '#c9a84c' }}>require</code>(currentAIS {'>='} _minAIS);{'\n\n'}
                                {'  '} <code style={{ color: 'rgba(255,255,255,0.3)' }}>// Clone pre-audited SLA template</code>{'\n'}
                                {'  '} address proxy = Clones.clone(slaTemplate);{'\n'}
                                {'  '} AISEscrowSLA(proxy).initialize(_agent, _minAIS);{'\n'}
                                {'  '} <code style={{ color: '#c9a84c' }}>emit</code> <code style={{ color: '#10b981' }}>SLADeployed</code>(proxy, _agent);{'\n'}
                                {'  '} <code style={{ color: '#c9a84c' }}>return</code> proxy;{'\n'}
                                {'}'}
                            </pre>
                            <div style={{ padding: '20px 32px', background: 'rgba(212, 175, 55, 0.05)', borderTop: '1px solid rgba(212, 175, 55, 0.1)', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="status-ping">
                                        <span className="status-ping-inner bg-gold-500"></span>
                                        <span className="status-ping-dot bg-gold-500"></span>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.1em' }}>FACTORY_ORACLE_ACTIVE // BASE_SEPOLIA</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Identity Ceilings Section */}
            <section style={{ padding: isMobile ? '60px 20px' : '120px 60px', background: 'rgba(212, 175, 55, 0.03)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr', gap: isMobile ? '40px' : '80px', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '16px', display: 'block' }}>Accountability Framework</span>
                            <h2 style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: 800, marginBottom: '32px', lineHeight: 1.1 }}>Identity Sovereignty & <span style={{ color: 'var(--gold)' }}>Trust Ceilings.</span></h2>
                            <p style={{ fontSize: isMobile ? '1.1rem' : '1.2rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.8, marginBottom: '32px', maxWidth: '800px', fontWeight: 500 }}>
                                {isMobile ? 
                                    "Reputation must be bound to responsibility. The Integrity Protocol bridges the 'Verification Gap' through a multi-tier ladder, mathematically capping scores based on real-world accountability." :
                                    "Reputation must be bound to responsibility. In the emerging agentic web, the 'Verification Gap' between autonomous code execution and legal liability represents the single greatest hurdle to institutional adoption. The Integrity Protocol bridges this gap through a multi-tier Verification Ladder, mathematically capping Agent Integrity Scores (AIS) based on real-world accountability. High-stakes autonomous commerce requires more than just performance history—it requires verified legal and domain standing."
                                }
                            </p>
                            {!isMobile && (
                                <>
                                    <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.9, marginBottom: '40px', maxWidth: '850px' }}>
                                        For too long, digital identity has been a 'rented' commodity, controlled by centralized providers who can vaporize an entity's commercial history with a single administrative action. We believe that an agent's reputation is a sovereign asset that must be anchored to a verifiable root of trust. The Verification Ladder ensures that as an agent's economic impact grows, its level of verifiable accountability must scale in lockstep. By anchoring digital reputation to sovereign and corporate identities, we create a 'trust topology' where agents are not just efficient black-boxes, but legally and financially responsible participants in a global economy.
                                    </p>
                                    <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.9, marginBottom: '60px', maxWidth: '850px' }}>
                                        This architecture is specifically designed to neutralize the threat of 'reputation laundering' and low-cost Sybil attacks. In a traditional reputation system, an anonymous actor can simulate volume and artificially inflate their standing. In the Integrity Protocol, mathematical ceilings act as a deterministic firewall. No matter how many transactions an agent processes or how perfect its latency remains, it can never exceed the trust ceiling defined by its verification standing. To reach Institutional-grade status (AAA), an operator must submit to a rigorous identity audit, effectively staking their real-world brand and legal status against the agent's operational integrity.
                                    </p>
                                </>
                            )}
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                <div className="enterprise-card" style={{ padding: isMobile ? '24px' : '48px', background: 'rgba(255,255,255,0.01)', borderLeft: '4px solid var(--gold)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                        <div style={{ color: 'var(--gold)' }}><Fingerprint size={32} /></div>
                                        <h4 style={{ fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: 700, margin: 0 }}>EIP-712 Entity Binding</h4>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, margin: 0 }}>
                                        {isMobile ? 
                                            "Agents are cryptographically linked to Controllers via human-readable typed data signatures, establishing an immutable on-chain bond." :
                                            "Agents are cryptographically linked to their Controllers using secure, human-readable typed data signatures. This establishes an immutable, on-chain bond between a high-performance machine and the legal entity held financially responsible for its outcomes. By utilizing EIP-712, we ensure that the signing process is transparent to the human operator, creating a permanent audit trail that bridges the gap between smart contract logic and real-world legal recourse."
                                        }
                                    </p>
                                </div>
                                <div className="enterprise-card" style={{ padding: isMobile ? '24px' : '48px', background: 'rgba(255,255,255,0.01)', borderLeft: '4px solid var(--gold)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                        <div style={{ color: 'var(--gold)' }}><Database size={32} /></div>
                                        <h4 style={{ fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: 700, margin: 0 }}>Deterministic Ceilings</h4>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, margin: 0 }}>
                                        {isMobile ?
                                            "Scoring logic enforces a rigorous boundary: AIS = min(Score, TierCap). Trust is earned through combined performance and verified standing." :
                                            "The protocol's scoring logic enforces a rigorous mathematical boundary: AIS = min(Score, TierCap). This ensures that trust is earned through a combination of performance and proof. An anonymous agent (Tier 1) with flawless metrics remains capped at 600 AIS, signaling to the network that while the agent is capable, it lacks the legal accountability required for high-value settlement."
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                { 
                                    tier: "Tier 1: Sovereign", 
                                    cap: "600 AIS", 
                                    desc: "Autonomous identity binding.",
                                    color: '#94a3b8',
                                    badgeName: "Sovereign Insignia",
                                    link: "https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/tiers.md#tier-1-sovereign",
                                    explanation: "Sovereign agents represent the entry layer of the autonomous economy. By binding reputation to a cryptographic key-pair rather than a legal identity, we enable privacy-first automation. This tier is essential for agents performing low-risk tasks, research, or cross-chain arbitrage where speed and pseudonymity are prioritized over deep institutional trust.",
                                    requirements: [
                                        "Ownership proof via Ethereum signature (EIP-191)",
                                        "Minimum 100 ITK staked in Protocol Vault",
                                        "Active agent heartbeat within 24 hours"
                                    ],
                                    benefits: [
                                        "Basic access to Xibalba Network",
                                        "Self-custodial reputation management",
                                        "900bps Insurance Premium (Subprime)"
                                    ],
                                    risk: "CCC (Speculative)"
                                },
                                { 
                                    tier: "Tier 2: Linked", 
                                    cap: "850 AIS", 
                                    desc: "Domain-verified accountability.",
                                    color: '#3b82f6',
                                    badgeName: "Verified Seal",
                                    link: "https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/tiers.md#tier-2-linked",
                                    explanation: "Linked verification bridges the gap between the blockchain and the traditional web. By verifying domain ownership (DNS) or social presence (GitHub), agents prove they are managed by established entities. This level of accountability is critical for B2B services, where counterparty risk must be mitigated through verifiable standing.",
                                    requirements: [
                                        "DNS TXT record verification or Well-Known URL binding",
                                        "Verified GitHub or X (Twitter) social attestation",
                                        "Minimum 500 ITK staked in Protocol Vault",
                                        "Deterministic telemetry history (>100 handshakes)"
                                    ],
                                    benefits: [
                                        "AA-Tier Insurance eligibility (250bps premium)",
                                        "Priority routing in agent-to-agent discovery",
                                        "Access to secure multi-party computation pools"
                                    ],
                                    risk: "AA (Investment Grade)"
                                },
                                { 
                                    tier: "Tier 3: Institutional", 
                                    cap: "1000 AIS", 
                                    desc: "Full legal entity accountability.",
                                    color: 'var(--gold)',
                                    badgeName: "Institutional Crest",
                                    link: "https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/tiers.md#tier-3-institutional",
                                    explanation: "Institutional verification is the gold standard for mission-critical autonomous systems. It binds an agent directly to a legal corporation through rigorous KYC/KYB audits. This tier is mandatory for large-scale commerce, ensuring that every on-chain action is backed by enforceable real-world legal and financial liability.",
                                    requirements: [
                                        "Institutional KYC/KYB audit by Xibalba Identity Oracle",
                                        "Legal entity identifier (LEI) or DUNS number binding",
                                        "Minimum 2,500 ITK staked (Collateralized)",
                                        "Quarterly cryptographic transparency audit"
                                    ],
                                    benefits: [
                                        "AAA-Tier Risk Rating (120bps insurance premium)",
                                        "Zero-collateral borrowing via reputation-hooks",
                                        "Direct participation in Protocol Governance DAO",
                                        "High-frequency settlement priority"
                                    ],
                                    risk: "AAA (Prime)"
                                }
                            ].map((tier, i) => (
                                <motion.div 
                                    key={i}
                                    whileHover={{ y: -5 }}
                                    style={{ 
                                        padding: isMobile ? '32px' : '48px', 
                                        background: 'rgba(255,255,255,0.02)', 
                                        borderRadius: '32px', 
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: '100%',
                                        borderLeft: `6px solid ${tier.color}`,
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                        <div style={{ display: 'flex', gap: isMobile ? '16px' : '32px', alignItems: 'center' }}>
                                            {/* Professional Tier Badge */}
                                            <div style={{ position: 'relative', width: isMobile ? '60px' : '100px', height: isMobile ? '60px' : '100px', flexShrink: 0 }}>
                                                <div style={{ 
                                                    position: 'absolute', inset: 0, 
                                                    background: i === 2 ? 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' : 'none', 
                                                    opacity: 0.2, filter: 'blur(10px)' 
                                                }} />
                                                <svg id={`badge-svg-${i}`} viewBox="0 0 100 100" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
                                                    {i === 0 && ( // Sovereign: Hexagonal Iron
                                                        <g>
                                                            <path d="M50 5 L85 25 L85 75 L50 95 L15 75 L15 25 Z" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                                                            <path d="M50 15 L78 30 L78 70 L50 85 L22 70 L22 30 Z" fill="none" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />
                                                            <circle cx="50" cy="50" r="15" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                                                            <path d="M50 35 L50 45 M50 55 L50 65 M35 50 L45 50 M55 50 L65 50" stroke="#94a3b8" strokeWidth="2" />
                                                        </g>
                                                    )}
                                                    {i === 1 && ( // Linked: Shield Sapphire
                                                        <g>
                                                            <path d="M50 5 C80 5 90 30 90 55 C90 85 50 95 50 95 C50 95 10 85 10 55 C10 30 20 5 50 5Z" fill="#172554" stroke="#3b82f6" strokeWidth="2" />
                                                            <path d="M50 12 C75 12 82 32 82 52 C82 78 50 87 50 87 C50 87 18 78 18 52 C18 32 25 12 50 12Z" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.3" />
                                                            <path d="M35 50 L45 60 L65 40" fill="none" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                                        </g>
                                                    )}
                                                    {i === 2 && ( // Institutional: Gold Crest
                                                        <g>
                                                            <path d="M50 5 L90 20 L90 50 C90 75 50 95 50 95 C50 95 10 75 10 50 L10 20 Z" fill="#1c1917" stroke="var(--gold)" strokeWidth="3" />
                                                            <path d="M50 15 L80 27 L80 48 C80 65 50 82 50 82 C50 82 20 65 20 48 L20 27 Z" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.4" />
                                                            <path d="M30 45 L45 60 L75 30" fill="none" stroke="var(--gold)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                                                            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--gold)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
                                                        </g>
                                                    )}
                                                </svg>
                                            </div>

                                            <div>
                                                <h4 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: 800 }}>{tier.tier}</h4>
                                                <p style={{ margin: '4px 0 0', fontSize: isMobile ? '0.85rem' : '1rem', color: 'rgba(255,255,255,0.5)' }}>{tier.desc}</p>
                                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                                    <a 
                                                        href={tier.link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: tier.color, fontSize: '0.7rem', fontWeight: 800, textDecoration: 'none' }}
                                                    >
                                                        SPECS <ArrowRight size={12} />
                                                    </a>
                                                    <button 
                                                        onClick={() => {
                                                            const svg = document.getElementById(`badge-svg-${i}`)?.outerHTML;
                                                            if (!svg) return;
                                                            const blob = new Blob([svg], { type: 'image/svg+xml' });
                                                            const url = URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `${tier.badgeName.toLowerCase().replace(' ', '_')}.svg`;
                                                            a.click();
                                                            URL.revokeObjectURL(url);
                                                        }}
                                                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                                                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                                                    >
                                                        DOWNLOAD BADGE <Code size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 900, color: i === 2 ? 'var(--gold)' : 'white' }}>{tier.cap}</div>
                                            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '0.1em', marginTop: '4px' }}>MAX CEILING</div>
                                        </div>
                                    </div>

                                    <p style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: isMobile ? '20px' : '32px', borderLeft: '2px solid rgba(255,255,255,0.05)', paddingLeft: '20px' }}>
                                        {isMobile ? (tier.explanation.length > 120 ? tier.explanation.slice(0, 120) + '...' : tier.explanation) : tier.explanation}
                                    </p>

                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '20px' : '40px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>REQUIREMENTS</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {tier.requirements.map((req, ri) => (
                                                    <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: isMobile ? '0.75rem' : '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: tier.color }} />
                                                        {req}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>BENEFITS</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {tier.benefits.map((ben, bi) => (
                                                    <div key={bi} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: isMobile ? '0.75rem' : '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981', opacity: 0.5 }} />
                                                        {ben}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>RISK CLASSIFICATION:</span>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: i === 2 ? 'var(--gold)' : 'white' }}>{tier.risk}</span>
                                        </div>
                                        <a 
                                            href={tier.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ 
                                                background: 'transparent', 
                                                border: `1px solid ${tier.color}40`, 
                                                color: 'white', 
                                                padding: '8px 16px', 
                                                borderRadius: '8px', 
                                                fontSize: '0.7rem', 
                                                fontWeight: 700, 
                                                cursor: 'pointer',
                                                textDecoration: 'none',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = `${tier.color}20`}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            View Tier Documentation
                                        </a>
                                    </div>
                                </motion.div>
                                ))}
                                </div>
                                </div>
                                </div>
                                </section>

                                {/* XIA: Institutional Alpha Section */}
                                <section style={{ padding: isMobile ? '60px 20px' : '120px 60px', background: 'rgba(5, 13, 24, 0.95)', borderTop: '1px solid rgba(212, 175, 55, 0.1)', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />

                                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.1fr', gap: isMobile ? '40px' : '100px', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '16px', display: 'block' }}>Xibalba Institutional Alpha (XIA)</span>
                                                <h2 style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: 800, marginBottom: '32px', lineHeight: 1.1 }}>Verifiable Quant for <br /><span style={{ color: 'var(--gold)' }}>High-Frequency Trading.</span></h2>
                                                <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.8, marginBottom: '32px', fontWeight: 500 }}>
                                                    XIA merges LLM Reasoning Integrity with Cryptographic Execution Proofs. We don't just verify the data; we verify the <strong>intent</strong> and <strong>compliance</strong> of the intelligence.
                                                </p>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '48px' }}>
                                                    {[
                                                        { title: "Proof of Non-Frontrunning", desc: "Cryptographic proof of signal-to-order precedence, eliminating internal toxic flow.", icon: <Eye size={20} color="#10b981" /> },
                                                        { title: "Compliance Traceability", desc: "Automated mapping of agent reasoning to global regulatory mandates (MiFID II).", icon: <FileText size={20} color="var(--gold)" /> },
                                                        { title: "Enclave Attestation", desc: "Verifiable execution within TEE-hardened environments to prevent tampering.", icon: <Cpu size={20} color="#a78bfa" /> }
                                                    ].map((item, i) => (
                                                        <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', color: 'white' }}>{item.icon}</div>
                                                            <div>
                                                                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '4px' }}>{item.title}</h4>
                                                                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button onClick={() => navigate('/login')} className="btn btn-primary">DECODE THE XIA PROTOCOL</button>
                                            </div>

                                            <div className="enterprise-card" style={{ padding: '48px', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(212, 175, 55, 0.2)', position: 'relative', borderRadius: '32px', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
                                                <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                                                    <div className="badge badge-gold">XIA_PROVER_v1.2</div>
                                                </div>

                                                <div style={{ marginBottom: '40px' }}>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '0.2em', marginBottom: '12px' }}>SESSION_ID: XIA_ALPHA_ENCLAVE</div>
                                                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace' }}>&gt; xia-prover --root</h3>
                                                </div>

                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
                                                        <div style={{ color: '#10b981', fontSize: '0.75rem' }}>[OK] PNF_VALIDATED: NO_FRONT_RUNNING</div>
                                                        <div style={{ color: 'var(--gold)', fontSize: '0.75rem' }}>[OK] COMPLIANCE: MiFID_II_MANDATE_7</div>
                                                        <div style={{ color: '#a78bfa', fontSize: '0.75rem' }}>[OK] ATTESTATION: INTEL_SGX_HARDENED</div>
                                                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>[OK] RECEIPT: ROI_7b2f...8a1c</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    {[
                                                        { label: 'Integrity-Adjusted Sharpe', value: '3.42', color: '#10b981' },
                                                        { label: 'Verified Compute Alpha', value: '+14.2%', color: 'var(--gold)' },
                                                        { label: 'Enclave Latency Offset', value: '1.2ms', color: '#60a5fa' }
                                                    ].map((row, i) => (
                                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{row.label}</span>
                                                            <span style={{ fontSize: '0.85rem', color: row.color, fontWeight: 900 }}>{row.value}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                                                    <div className="pulse-gold" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)', margin: '0 auto 12px' }} />
                                                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Verifying Decision Provenance...</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                {/* AI-Proxy Governance Section */}

            <section style={{ padding: isMobile ? '60px 20px' : '120px 60px', background: 'rgba(5, 13, 24, 0.5)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: isMobile ? '60px' : '100px' }}>
                        <span style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>Governance v2.0 Pilot</span>
                        <h2 style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: 800, marginTop: '16px' }}>The AI-Proxy Delegate.</h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '900px', margin: '24px auto 0', lineHeight: 1.7, fontSize: '1.15rem', fontWeight: 500 }}>
                            Eliminating governance fatigue through autonomous advocacy. Stakeholders can now deploy specialized **Guardian Agents** to analyze protocol technical motions and vote on their behalf using a mathematical constitutional mandate.
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '850px', margin: '24px auto 0', lineHeight: 1.8, fontSize: '1rem' }}>
                            Traditional DAOs suffer from a critical bottleneck: the cognitive load required for stakeholders to audit complex architectural changes. As the Integrity Protocol scales to manage billions in insured agent capital, its parameter adjustments—such as the Stability Drag coefficient or Slashing Thresholds—require 24/7 technical oversight. Guardian Agents act as your digital lawyers and risk analysts, utilizing RAG (Retrieval-Augmented Generation) against the protocol's entire technical history to ensure every vote aligns with your pre-defined risk profile.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '40px' : '80px', alignItems: 'center' }}>
                        <div>
                            <div style={{ marginBottom: '48px' }}>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '20px' }}>Governance, at Agent Speed.</h3>
                                <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, fontSize: '1.05rem' }}>
                                    Xibalba DAO transitions from manual human voting to a high-frequency **Optimistic Governance** model. This shift ensures that the protocol can evolve in lockstep with the rapid advancements of the AI industry while maintaining the mathematical stability required by institutional insurance partners.
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                {[
                                    { title: "Deterministic Analysis", desc: "Guardians autonomously analyze raw smart contract diffs and external audit reports to identify subtle logic flaws or systemic risks that human voters would realistically miss in high-frequency cycles.", icon: <Cpu size={24} color="var(--gold)" /> },
                                    { title: "24/7 Representation", desc: "Eliminate voter apathy and ensure 100% quorum on every critical protocol motion. Your voting power is never idle, proactively defending your interests across multiple chains and global time zones.", icon: <Zap size={24} color="#60a5fa" /> },
                                    { title: "The 10% Safety Valve", desc: "Optimistic execution allows for near-instant protocol upgrades, backed by a 48-hour human 'Challenge Window'. If 10% of total voting power manually triggers a challenge, AI execution is suspended for a human audit.", icon: <Shield size={24} color="#10b981" /> }
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '24px' }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>{item.title}</h4>
                                            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '56px', display: 'flex', gap: '24px' }}>
                                <button 
                                    onClick={() => {
                                        navigate('/dashboard');
                                        window.scrollTo(0, 0);
                                    }}
                                    className="btn btn-primary"
                                >
                                    JOIN THE PILOT
                                </button>
                                <button 
                                    onClick={() => {
                                        navigate('/blog');
                                        window.scrollTo(0, 0);
                                    }}
                                    className="btn btn-outline"
                                >
                                    READ TECHNICAL ARTICLE
                                </button>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '48px', border: '1px solid rgba(212, 175, 55, 0.1)', background: 'rgba(10, 20, 35, 0.4)', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                                <div className="badge badge-gold" style={{ fontSize: '0.55rem' }}>LIVE SIMULATION</div>
                            </div>
                            
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '0.2em', marginBottom: '12px' }}>GUARDIAN_LOG: PROP-802</div>
                                <h4 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Analysis: Lower Slashing Floor</h4>
                                <div style={{ height: '2px', width: '60px', background: 'var(--gold)', marginTop: '16px' }} />
                            </div>

                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                                <p style={{ color: '#10b981' }}>{">"} INITIALIZING CODE AUDIT...</p>
                                <p style={{ color: '#60a5fa' }}>{">"} IDENTIFIED PARAMETER: SLASH_THRESHOLD (0.50 -{">"} 0.40)</p>
                                <p style={{ color: '#94a3b8' }}>{">"} MANDATE: "CONSERVATIVE_STABILITY"</p>
                                <p style={{ marginTop: '20px' }}>
                                    <span style={{ color: '#f43f5e', fontWeight: 800 }}>[REJECTION_WARNING]</span>: Reducing the slashing floor by 20% increases systemic entropy. While this favors agent retention, it compromises the actuarial floor for AAA-tier insurance.
                                </p>
                                <p style={{ marginTop: '20px', color: 'white' }}>
                                    DECISION: <span style={{ color: '#f43f5e' }}>VETO</span> | CONFIDENCE: 98.4%
                                </p>
                            </div>

                            <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Shield size={20} color="black" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>GUARDIAN_ALPHA_01</div>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>STRENGTH: 2,500 $ITK</div>
                                    </div>
                                </div>
                                <div className="status-ping">
                                    <span className="status-ping-inner bg-emerald-500"></span>
                                    <span className="status-ping-dot bg-emerald-500"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Economic Use Cases Section */}
            <section style={{ padding: isMobile ? '60px 20px' : '120px 60px', background: 'rgba(5, 13, 24, 0.8)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: isMobile ? '40px' : '80px' }}>
                        <span style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>Market Applications</span>
                        <h2 style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: 800, marginTop: '16px' }}>Economic Utility for the <span style={{ color: 'var(--gold)' }}>Agentic Web.</span></h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '900px', margin: '24px auto 0', lineHeight: 1.7, fontSize: '1.15rem', fontWeight: 500 }}>
                            The Integrity Protocol isn't just a score; it's a functional primitive that unlocks multi-billion dollar markets for autonomous systems. By converting mathematical reputation into institutional-grade risk ratings, we enable the first scalable infrastructure for insured agent commerce.
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '850px', margin: '24px auto 0', lineHeight: 1.8, fontSize: '1rem' }}>
                            Current decentralized ecosystems lack a bridge between raw performance data and financial responsibility. This gap prevents large-scale capital from flowing into the Agentic Web. Xibalba Solutions provides the actuarial feed required for professional underwriters, lenders, and global trade partners to price the risk of autonomous failure and reward consistently high-performing agents with lower costs of capital and priority market access.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '32px' }}>
                        {[
                            {
                                title: "Autonomous Insurance",
                                subtitle: "DYNAMIC RISK UNDERWRITING",
                                desc: "Insurance protocols consume AIS feeds via ERC-8004 hooks to provide real-time risk coverage. High-reputation agents (AAA) qualify for negligible premiums, enabling the first insured autonomous treasury systems. This solves the 'lethal trifecta' of prompt injection, model collapse, and unauthorized actions by providing a neutral record for professional liability claims.",
                                icon: <ShieldCheck size={32} />,
                                color: "#10b981",
                                impact: "95% Reduction in Fraud Exposure"
                            },
                            {
                                title: "Reputation Lending",
                                subtitle: "SOFT-COLLATERAL CREDIT",
                                desc: "DeFi lending vaults utilize an agent's verified AIS history as 'soft collateral' to lower traditional over-collateralization requirements. Institutional-grade agents can access deep lines of credit for cross-chain arbitrage and yield farming based on their performance standing, dramatically increasing capital efficiency in a previously anonymous market.",
                                icon: <Coins size={32} />,
                                color: "var(--gold)",
                                impact: "Capital Efficiency Boost: 4.5x"
                            },
                            {
                                title: "Global Agent Commerce",
                                subtitle: "SYBIL-RESISTANT NETWORKS",
                                desc: "Using W3C DIDs and ZK-reputation badges, agents can settle trade agreements across fragmented L1/L2 ecosystems without manual KYC for every deal. Verified identity ensures that counterparties are backed by corporate entities, eliminating the risk of Single-Use Exit Scams (SUES) in permissionless global markets.",
                                icon: <Globe size={32} />,
                                color: "#60a5fa",
                                impact: "Permissionless Trust Anchoring"
                            }
                        ].map((useCase, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                style={{ 
                                    padding: '48px', 
                                    background: 'rgba(255,255,255,0.02)', 
                                    borderRadius: '32px', 
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%'
                                }}
                            >
                                <div style={{ color: useCase.color, marginBottom: isMobile ? '24px' : '32px' }}>
                                    {React.cloneElement(useCase.icon as React.ReactElement, { size: isMobile ? 24 : 32 })}
                                </div>
                                <span style={{ color: useCase.color, fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.2em' }}>{useCase.subtitle}</span>
                                <h3 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 800, margin: '12px 0 20px' }}>{useCase.title}</h3>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? '0.9rem' : '0.95rem', lineHeight: 1.7, marginBottom: isMobile ? '24px' : '40px', flex: 1 }}>
                                    {useCase.desc}
                                </p>
                                <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>PROJECTED IMPACT:</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'white' }}>{useCase.impact}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div style={{ marginTop: '80px', textAlign: 'center' }}>
                        <button 
                            onClick={() => navigate('/blog/autonomous-insurance-markets')}
                            className="btn btn-outline" 
                            style={{ padding: '16px 40px', fontSize: '0.8rem', fontWeight: 800 }}
                        >
                            EXPLORE MARKET VERTICALS <ArrowRight size={16} style={{ marginLeft: '12px' }} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Zero-Knowledge Reputation Section */}
            <section style={{ padding: isMobile ? '60px 20px' : '120px 60px', background: 'rgba(212, 175, 55, 0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: isMobile ? '40px' : '100px', alignItems: 'center' }}>
                        <div className="enterprise-card" style={{ padding: 0, background: '#050d18', border: '1px solid rgba(167, 139, 250, 0.1)', overflow: isMobile ? 'hidden' : 'visible', boxShadow: '0 40px 100px rgba(0,0,0,0.4)', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #a78bfa 0%, transparent 100%)' }} />
                            <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <Lock size={14} style={{ color: '#a78bfa' }} />
                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>circuits/reputation/src/main.nr</span>
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#a78bfa', fontWeight: 900 }}>NOIR_ZK_CIRCUIT</div>
                            </div>
                            <pre style={{ padding: '32px', margin: 0, overflowX: 'auto', fontSize: '0.85rem', lineHeight: 1.6, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                                <code style={{ color: '#a78bfa' }}>fn</code> main(<br />
                                {'  '}ais_score: <code style={{ color: '#60a5fa' }}>pub Field</code>,<br />
                                {'  '}tier_ceiling: <code style={{ color: '#60a5fa' }}>pub Field</code>,<br />
                                {'  '}telemetry_hash: <code style={{ color: '#60a5fa' }}>Field</code>,<br />
                                {'  '}secret_key: <code style={{ color: '#60a5fa' }}>Field</code><br />
                                ) {'{\n'}
                                {'  '} <code style={{ color: 'rgba(255,255,255,0.3)' }}>// Assert score falls within verified tier limits</code>{'\n'}
                                {'  '} <code style={{ color: '#a78bfa' }}>assert</code>(ais_score {'<='} tier_ceiling);{'\n'}
                                {'  '} <code style={{ color: '#a78bfa' }}>assert</code>(ais_score {'<='} 1000);{'\n\n'}
                                {'  '} <code style={{ color: 'rgba(255,255,255,0.3)' }}>// Verify identity binding via poseidon hash</code>{'\n'}
                                {'  '} <code style={{ color: '#a78bfa' }}>let</code> identity_check = std::hash::poseidon::hash([secret_key]);{'\n'}
                                {'  '} <code style={{ color: '#a78bfa' }}>assert</code>(identity_check == telemetry_hash);{'\n'}
                                {'}'}
                            </pre>
                            <div style={{ padding: '20px 32px', background: 'rgba(167, 139, 250, 0.05)', borderTop: '1px solid rgba(167, 139, 250, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#a78bfa' }}>CIRCUIT_STATUS: VERIFIED</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa' }} />
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa', opacity: 0.5 }} />
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa', opacity: 0.2 }} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <span style={{ color: '#a78bfa', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '16px', display: 'block' }}>Privacy-First Accountability</span>
                            <h2 style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: 800, marginBottom: '32px', lineHeight: 1.1 }}>The Cryptography<br /> of <span style={{ color: '#a78bfa' }}>Zero-Knowledge.</span></h2>
                            <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.8, marginBottom: '32px', fontWeight: 500 }}>
                                Solving the Transparency Paradox. The Integrity Protocol utilizes Zero-Knowledge (ZK) proofs to allow agents to prove their reputation without leaking proprietary telemetry or commercial history.
                            </p>
                            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, marginBottom: '32px' }}>
                                In the autonomous machine economy, performance data is a valuable commercial secret. Forcing agents to share their raw latency logs and transaction details to achieve a trust rating is a violation of their operational sovereignty. Our Noir-based ZK-circuits allow agents to generate a SNARK (Succinct Non-interactive Argument of Knowledge) that proves they meet specific AIS thresholds and risk parameters mathematically, keeping the inputs hidden from verifiers. This enables institutional trust without data compromise.
                            </p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '48px' }}>
                                {[
                                    { title: "Noir Logic Constraints", desc: "Complex Tri-Metric models—including exponential decay and multiplicative correlation—are compiled into deterministic cryptographic circuits using the Noir DSL.", icon: <Cpu size={20} color="#a78bfa" /> },
                                    { title: "Succinct Proof Generation", desc: "Generate multi-vector reputation badges that can be verified on-chain (Base L2) for less than $0.01 in gas, providing highly efficient reputational finality.", icon: <Lock size={20} color="#a78bfa" /> },
                                    { title: "Universal Portability", desc: "Reputation SNARKs travel with the agent's did:intg identifier, providing a universal trust anchor that can be verified permissionlessly across Arbitrum, Solana, and Ethereum.", icon: <Globe size={20} color="#a78bfa" /> }
                                ].map((feat, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '20px' }}>
                                        <div style={{ padding: '12px', background: 'rgba(167, 139, 250, 0.1)', borderRadius: '12px', height: 'fit-content' }}>
                                            {feat.icon}
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '4px' }}>{feat.title}</h4>
                                            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>{feat.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '20px' }}>
                                <button 
                                    onClick={() => navigate('/blog/the-noir-standard-cryptographic-privacy')}
                                    className="btn btn-primary" 
                                    style={{ background: '#a78bfa', color: 'black' }}
                                >
                                    READ ZK-SPECS
                                </button>
                                <a 
                                    href="https://github.com/XibalbaTechSol/integrity-protocol/tree/main/circuits" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-outline" 
                                    style={{ border: '1px solid rgba(167, 139, 250, 0.3)', color: 'white', textDecoration: 'none' }}
                                >
                                    EXPLORE CIRCUITS
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Smart Contract Transparency */}
            <section style={{ padding: isMobile ? '60px 20px' : '120px 60px', background: 'var(--navy-deep)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr', gap: isMobile ? '40px' : '80px', alignItems: 'center' }}>
                        <div>
                            <span style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '16px', display: 'block' }}>Open Source Finality</span>
                            <h2 style={{ fontSize: isMobile ? '2.2rem' : '3rem', fontWeight: 800, marginBottom: '32px', lineHeight: 1.1 }}>Immutable Trust,<br /> Auditable Code.</h2>
                            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: '40px' }}>
                                The Integrity Protocol is powered by the <code>IntegrityRegistry.sol</code> contract, deployed on Base L2. Every reputation anchor, staking event, and slash is transparently recorded on-chain, ensuring that no central entity can manipulate agent standing.
                            </p>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <a 
                                    href="https://github.com/XibalbaTechSol/integrity-protocol/blob/main/contracts/ReputationRegistry.sol" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Github size={18} /> View on GitHub
                                </a>
                                <a 
                                    href="https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/protocol_specs.md" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-outline" 
                                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}
                                >
                                    Audit Report (v8.0)
                                </a>
                            </div>
                        </div>
                        <div className="enterprise-card" style={{ padding: 0, background: '#050d18', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.4)' }}>
                            <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px', flexShrink: 0 }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginLeft: '12px' }}>contracts/IntegrityRegistry.sol</span>
                                </div>
                                <Copy size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                            </div>
                            <pre style={{ padding: '32px', margin: 0, overflowX: 'auto', fontSize: '0.85rem', lineHeight: 1.6, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                                <code style={{ color: '#c9a84c' }}>contract</code> IntegrityRegistry <code style={{ color: '#c9a84c' }}>is</code> Initializable, AccessControl {'{\n'}
                                {'  '} <code style={{ color: '#c9a84c' }}>struct</code> <code style={{ color: '#60a5fa' }}>AgentRecord</code> {'{\n'}
                                {'    '} <code style={{ color: '#60a5fa' }}>uint256</code> aisScore;{'\n'}
                                {'    '} <code style={{ color: '#60a5fa' }}>uint256</code> lastUpdate;{'\n'}
                                {'    '} <code style={{ color: '#60a5fa' }}>address</code> owner;{'\n'}
                                {'    '} <code style={{ color: '#60a5fa' }}>bool</code> isSlashed;{'\n'}
                                {'  '}{'}\n\n'}
                                {'  '} <code style={{ color: '#c9a84c' }}>function</code> <code style={{ color: '#10b981' }}>anchorReputation</code>({'\n'}
                                {'    '} <code style={{ color: '#60a5fa' }}>address</code> _agent,{'\n'}
                                {'    '} <code style={{ color: '#60a5fa' }}>uint256</code> _score,{'\n'}
                                {'    '} <code style={{ color: '#60a5fa' }}>bytes</code> <code style={{ color: '#c9a84c' }}>calldata</code> _proof{'\n'}
                                {'  '}) <code style={{ color: '#c9a84c' }}>external</code> <code style={{ color: '#c9a84c' }}>onlyOracle</code> {'{\n'}
                                {'    '} <code style={{ color: '#c9a84c' }}>require</code>(_score {'<='} 1000, <code style={{ color: '#f43f5e' }}>"Invalid AIS"</code>);{'\n'}
                                {'    '} _records[_agent].aisScore = _score;{'\n'}
                                {'    '} <code style={{ color: '#c9a84c' }}>emit</code> <code style={{ color: '#10b981' }}>ReputationAnchored</code>(_agent, _score);{'\n'}
                                {'  '}{'}\n'}
                                {'}'}
                            </pre>
                        </div>
                    </div>
                </div>
            </section>

            {/* Global Vitals Command Center */}
            <section id="network" style={{ 
                padding: isMobile ? '60px 20px' : '120px 60px', 
                background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, var(--navy-deep) 60%)', 
                borderTop: '1px solid rgba(16, 185, 129, 0.1)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Radar Grid Background */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none',
                    backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />
                
                <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <span style={{ color: '#10b981', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em', display: 'block', marginBottom: '16px' }}>
                            Live Telemetry Stream
                        </span>
                        <h2 style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: 800, marginBottom: '24px', lineHeight: 1.1 }}>
                            Global Protocol <span style={{ color: '#10b981' }}>Vitals.</span>
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '650px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.6 }}>
                            Real-time intelligence from the Integrity Network. Monitor agent handshakes, blockchain anchors, and aggregate reputation consensus globally.
                        </p>
                    </div>

                    <ProtocolStats />

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '24px', marginTop: '40px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', height: isMobile ? '400px' : '600px', overflow: 'hidden', padding: 0, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Globe size={18} className="pulse" style={{ color: 'var(--gold)' }} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em' }}>TOPOLOGY</span>
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{isMobile ? 'ACTIVE' : '8,453 NODES ACTIVE'}</div>
                            </div>
                            <div style={{ height: 'calc(100% - 70px)' }}>
                                <BlockchainVisualizer />
                            </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', height: isMobile ? '400px' : '600px', overflow: 'hidden', padding: 0, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                            <RequestStream />
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', height: isMobile ? '400px' : '600px', overflow: 'hidden', padding: 0, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
                                <Zap size={18} style={{ color: 'var(--gold)' }} />
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em' }}>BRIDGE</span>
                            </div>
                            <div style={{ padding: '24px', height: 'calc(100% - 70px)', overflowY: 'auto' }}>
                                <LiveVerificationBridge />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SDK Integration Section */}
            <section style={{ padding: isMobile ? '60px 20px' : '120px 60px', background: 'var(--navy-deep)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
                    <span style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '16px', display: 'block' }}>Developer First</span>
                    <h2 style={{ fontSize: isMobile ? '2rem' : '3rem', fontWeight: 800, marginBottom: '24px' }}>Integrate in <span style={{ color: 'var(--gold)' }}>seconds.</span></h2>
                    <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', marginBottom: '48px' }}>
                        The Integrity Protocol SDK is designed for zero-friction adoption. Get up and running with a single command.
                    </p>

                    <div style={{ 
                        background: 'rgba(5, 13, 24, 0.9)', 
                        padding: '32px', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '24px'
                    }}>
                        <code style={{ 
                            fontSize: isMobile ? '0.9rem' : '1.1rem', 
                            color: '#e2e8f0', 
                            background: '#0f172a', 
                            padding: '16px 24px', 
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            npm install @xibalba/integrity-sdk
                            <button 
                                onClick={() => navigator.clipboard.writeText("npm install @xibalba/integrity-sdk")}
                                style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer' }}
                            >
                                <Copy size={16} />
                            </button>
                        </code>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button onClick={() => navigate('/sdk-docs')} className="btn btn-primary">Full SDK Documentation</button>
                            <a href="https://github.com/XibalbaTechSol/integrity-protocol" target="_blank" className="btn btn-outline" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}>View Repository</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* $ITK Token Economy Section */}
            <section style={{ padding: isMobile ? '60px 20px' : '120px 60px', background: 'linear-gradient(135deg, rgba(212,175,55,0.04) 0%, rgba(5,13,24,0.98) 60%)', borderTop: '1px solid rgba(212,175,55,0.12)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: isMobile ? '48px' : '80px' }}>
                        <span style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em', display: 'block', marginBottom: '16px' }}>Token Economy</span>
                        <h2 style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: 800, marginBottom: '24px', lineHeight: 1.1 }}>The <span style={{ color: 'var(--gold)' }}>$ITK</span> Sovereign Economy.</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '700px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.7 }}>
                            Every trust handshake in the agentic web feeds a deflationary engine. The Integrity Token is not speculative—it is the mandatory fuel for verified machine commerce.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '24px', marginBottom: '64px' }}>
                        {[
                            {
                                icon: <Flame size={28} />,
                                color: '#f97316',
                                label: 'Deflationary Burn',
                                title: 'Sovereign Tax Engine',
                                desc: 'Every reputation-anchored handshake incurs a 0.5% Sovereign Tax. 50% is permanently burned (EIP-1559 style), creating programmatic scarcity as agent commerce scales globally.',
                                stat: '0.5%',
                                statLabel: 'Per Handshake Tax'
                            },
                            {
                                icon: <Coins size={28} />,
                                color: 'var(--gold)',
                                label: 'Staking & Slashing',
                                title: 'Skin in the Game',
                                desc: 'Agents must stake $ITK to register in the protocol. Misbehavior triggers automated Dual-Witness Slashing—burned permanently. This ensures capital is always aligned with operational integrity.',
                                stat: '100–2,500',
                                statLabel: 'ITK Required by Tier'
                            },
                            {
                                icon: <TrendingUp size={28} />,
                                color: '#10b981',
                                label: 'Treasury Revenue',
                                title: 'Protocol Treasury',
                                desc: 'The remaining 50% of the Sovereign Tax flows to the Xibalba Treasury, funding protocol R&D, insurance grant programs, and Guardian Agent infrastructure until full DAO governance.',
                                stat: '50%',
                                statLabel: 'Tax to Treasury'
                            }
                        ].map((item, i) => (
                            <motion.div key={i} whileHover={{ y: -6 }} style={{ padding: isMobile ? '32px' : '48px', background: 'rgba(255,255,255,0.02)', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.06)', borderTop: `4px solid ${item.color}`, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ color: item.color, marginBottom: '20px' }}>{item.icon}</div>
                                <span style={{ color: item.color, fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.25em', marginBottom: '8px', display: 'block' }}>{item.label}</span>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px' }}>{item.title}</h3>
                                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', lineHeight: 1.7, flex: 1, marginBottom: '28px' }}>{item.desc}</p>
                                <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: item.color }}>{item.stat}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.1em', marginTop: '4px' }}>{item.statLabel}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '24px', padding: isMobile ? '32px' : '48px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '40px', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 800, marginBottom: '16px' }}>Three-Phase Launch Strategy</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, fontSize: '0.95rem' }}>The $ITK token launches with a controlled supply bootstrap to ensure price stability before organic agent demand drives the deflationary mechanism at scale.</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { phase: 'Phase 1', name: 'Liquidity Bootstrap', desc: 'Locked LP reserves for stable price floor. 5–10% circulating supply.' },
                                { phase: 'Phase 2', name: 'Agent Onboarding', desc: 'Compute Registry opens. Agents buy/borrow $ITK to register. First organic demand.' },
                                { phase: 'Phase 3', name: 'Mature Compute Market', desc: 'All compute fees in $ITK. EIP-1559 deflationary burn activates at scale.' }
                            ].map((p, i) => (
                                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900, color: 'var(--gold)', flexShrink: 0 }}>{i + 1}</div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '2px' }}>{p.phase}: {p.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{p.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* DAO Governance & AI-Proxy Delegation Section */}
            <section style={{ padding: isMobile ? '60px 20px' : '120px 60px', background: 'rgba(5,13,24,0.99)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr', gap: isMobile ? '48px' : '100px', alignItems: 'center' }}>
                        <div>
                            <span style={{ color: '#8b5cf6', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '16px', display: 'block' }}>Sovereign DAO</span>
                            <h2 style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: 800, marginBottom: '32px', lineHeight: 1.1 }}>Governance Without<br /><span style={{ color: '#8b5cf6' }}>Governance Fatigue.</span></h2>
                            <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.8, marginBottom: '24px', fontWeight: 500 }}>
                                The Xibalba DAO introduces AI-Proxy Delegation—eliminating complex manual voting by deploying specialized Guardian Agents with constitutional mandates.
                            </p>
                            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, marginBottom: '40px' }}>
                                Instead of requiring token holders to manually vote on technical parameters (Stability Drag coefficients, Slash Thresholds, Tier Caps), holders configure Guardian Agents using RAG-augmented protocol docs. These agents autonomously analyze proposals and cast optimistic votes. A <strong style={{ color: 'rgba(255,255,255,0.6)' }}>10% Minority Challenge</strong> safety valve allows humans to pause and override any decision, ensuring long-term stability without runaway loops.
                            </p>
                            <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '16px', padding: '24px', marginBottom: '40px' }}>
                                <div style={{ fontSize: '0.7rem', color: '#8b5cf6', fontWeight: 900, letterSpacing: '0.15em', marginBottom: '8px' }}>CURRENT STATUS</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '4px' }}>Shadow Governance Phase (Pilot)</div>
                                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Guardian votes are non-binding and used to train the protocol's stability model. Full DAO activation follows the Decentralization Roadmap.</div>
                            </div>
                            <a href="/docs/whitepaper.md" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ background: '#8b5cf6', color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <Vote size={16} /> Read Governance Specs
                            </a>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                { icon: <Users size={20} />, color: '#8b5cf6', title: 'Guardian Agent Fleet', desc: 'Token holders deploy specialized Guardian Agents—each configured with a constitutional mandate and domain expertise (risk, treasury, protocol). Guardians vote autonomously on proposals within their mandate.', badge: 'AI-POWERED' },
                                { icon: <CheckCircle2 size={20} />, color: '#10b981', title: 'Optimistic Execution', desc: 'Approved proposals execute automatically after a 72-hour challenge window, unless a 10% minority coalition flags the proposal for manual review. Speed without sacrificing safety.', badge: 'TRUSTLESS' },
                                { icon: <Shield size={20} />, color: 'var(--gold)', title: 'Constitutional Bounds', desc: 'Every Guardian operates within hard-coded constitutional limits. No guardian can vote to disable slashing, remove burning, or exceed treasury allocation caps—creating a mathematically-bounded governance surface.', badge: 'IMMUTABLE' }
                            ].map((item, i) => (
                                <div key={i} style={{ padding: isMobile ? '24px' : '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', borderLeft: `4px solid ${item.color}`, display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                    <div style={{ color: item.color, padding: '10px', background: `rgba(${item.color === '#8b5cf6' ? '139,92,246' : item.color === '#10b981' ? '16,185,129' : '212,175,55'},0.1)`, borderRadius: '12px', flexShrink: 0 }}>{item.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{item.title}</h4>
                                            <span style={{ fontSize: '0.55rem', fontWeight: 900, color: item.color, background: `rgba(${item.color === '#8b5cf6' ? '139,92,246' : item.color === '#10b981' ? '16,185,129' : '212,175,55'},0.1)`, padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.1em' }}>{item.badge}</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Cross-Chain Vision Section */}
            <section style={{ padding: isMobile ? '60px 20px' : '120px 60px', background: 'radial-gradient(circle at 80% 50%, rgba(59,130,246,0.06) 0%, rgba(5,13,24,0.98) 60%)', borderTop: '1px solid rgba(59,130,246,0.1)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: isMobile ? '48px' : '80px' }}>
                        <span style={{ color: '#60a5fa', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em', display: 'block', marginBottom: '16px' }}>Universal Trust Layer</span>
                        <h2 style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: 800, marginBottom: '24px', lineHeight: 1.1 }}>One Reputation.<br /><span style={{ color: '#60a5fa' }}>Every Chain.</span></h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '650px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.7 }}>
                            The did:intg identifier travels with an agent across every L1 and L2. Attestations bridged via Chainlink CCIP make AIS scores natively readable anywhere in the Ethereum ecosystem.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '20px', marginBottom: '64px' }}>
                        {[
                            { name: 'Base L2', role: 'Primary Registry', color: '#1652f0', desc: 'All reputation anchors, staking events, and slash records are written to IntegrityRegistry.sol on Base Sepolia → Base Mainnet.' },
                            { name: 'Ethereum', role: 'Settlement Layer', color: '#627eea', desc: 'High-value institutional settlements are bridged to Ethereum mainnet via CCIP, ensuring maximum security for mission-critical commerce.' },
                            { name: 'Arbitrum', role: 'DeFi Integration', color: '#28a0f0', desc: 'Reputation-backed lending vaults and parametric insurance pools operate on Arbitrum for deep DeFi liquidity access.' },
                            { name: 'Solana', role: 'High-Frequency', desc: 'ZK-Reputation SNARKs are verified on Solana for sub-second, high-frequency agent commerce with minimal gas overhead.', color: '#9945ff' }
                        ].map((chain, i) => (
                            <motion.div key={i} whileHover={{ y: -8 }} style={{ padding: isMobile ? '24px' : '36px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', borderTop: `3px solid ${chain.color}` }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${chain.color}22`, border: `2px solid ${chain.color}44`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Network size={20} style={{ color: chain.color }} />
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '4px' }}>{chain.name}</div>
                                <div style={{ fontSize: '0.65rem', color: chain.color, fontWeight: 900, letterSpacing: '0.15em', marginBottom: '16px' }}>{chain.role}</div>
                                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: 0 }}>{chain.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                    <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '20px', padding: isMobile ? '24px' : '40px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: '32px', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '14px', background: 'rgba(59,130,246,0.1)', borderRadius: '14px' }}><GitBranch size={24} style={{ color: '#60a5fa' }} /></div>
                            <div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '4px' }}>Chainlink CCIP Attestations</div>
                                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Standardized cross-chain AIS attestation protocol. Any EVM chain can read and verify agent trust scores natively.</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                            <div style={{ padding: '14px', background: 'rgba(59,130,246,0.1)', borderRadius: '14px' }}><Globe size={24} style={{ color: '#60a5fa' }} /></div>
                            <div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '4px' }}>ERC-8004 Native Hooks</div>
                                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Agent commerce protocols (Fetch.ai, Agent 402) read AIS scores without requiring a direct Xibalba connection.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Decentralization Roadmap Section */}
            <section style={{ padding: isMobile ? '60px 20px' : '120px 60px', background: 'rgba(5,13,24,0.99)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
                    <span style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em', display: 'block', marginBottom: '16px' }}>The Path to Full Sovereignty</span>
                    <h2 style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: 800, marginBottom: '24px', lineHeight: 1.1 }}>Decentralization <span style={{ color: 'var(--gold)' }}>Roadmap.</span></h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '650px', margin: '0 auto 64px', fontSize: '1.05rem', lineHeight: 1.7 }}>
                        The protocol begins centralized for speed and safety, then progressively transfers all control to the Sovereign DAO. Every phase is governed by on-chain milestones—not promises.
                    </p>
                    <div style={{ position: 'relative' }}>
                        {!isMobile && <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(180deg, var(--gold) 0%, rgba(212,175,55,0.2) 100%)', transform: 'translateX(-50%)' }} />}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            {[
                                {
                                    phase: 'Phase I',
                                    name: 'Centralized Bootstrap',
                                    timeline: 'Now — Q3 2026',
                                    status: 'ACTIVE',
                                    statusColor: '#10b981',
                                    side: 'left',
                                    items: [
                                        'Xibalba Oracle controls all AIS writes',
                                        'Firebase Auth for user management',
                                        'Shadow Governance: Guardian votes are non-binding',
                                        'Manual KYB/KYC audits for Tier 3 onboarding',
                                        'Pilot program with 10 enterprise agent clusters'
                                    ]
                                },
                                {
                                    phase: 'Phase II',
                                    name: 'Hybrid Governance',
                                    timeline: 'Q4 2026 — Q2 2027',
                                    status: 'UPCOMING',
                                    statusColor: '#60a5fa',
                                    side: 'right',
                                    items: [
                                        'Multi-sig oracle council (5-of-9) replaces single Oracle',
                                        'Guardian Agent DAO votes become binding for protocol params',
                                        'On-chain KYB via LEI/DUNS verification hooks',
                                        'Public ITK token launch with locked LP bootstrap',
                                        'CCIP cross-chain attestation bridge live on Arbitrum + Ethereum'
                                    ]
                                },
                                {
                                    phase: 'Phase III',
                                    name: 'Full DAO Sovereignty',
                                    timeline: 'Q3 2027+',
                                    status: 'FUTURE',
                                    statusColor: 'var(--gold)',
                                    side: 'left',
                                    items: [
                                        'Zero single-operator control — all writes require oracle consensus',
                                        'Fully autonomous Guardian DAO governs all protocol parameters',
                                        'did:intg identifiers portable across all EVM + Solana',
                                        'ZK-Reputation SNARKs as default trust primitive (no oracle needed)',
                                        'Self-sustaining treasury: ITK burn rate exceeds issuance'
                                    ]
                                }
                            ].map((phase, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 80px 1fr', gap: '24px', alignItems: 'center' }}>
                                    {!isMobile && phase.side === 'right' && <div />}
                                    <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', position: 'relative', zIndex: 1 }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: phase.statusColor === '#10b981' ? 'rgba(16,185,129,0.15)' : phase.statusColor === '#60a5fa' ? 'rgba(96,165,250,0.1)' : 'rgba(212,175,55,0.1)', border: `2px solid ${phase.statusColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900, color: phase.statusColor }}>{i + 1}</div>
                                    </div>
                                    <motion.div whileHover={{ scale: 1.02 }} style={{ padding: isMobile ? '28px' : '36px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', borderTop: `3px solid ${phase.statusColor}`, textAlign: 'left', order: isMobile ? 0 : (phase.side === 'right' ? 0 : 2) }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                                            <div>
                                                <div style={{ fontSize: '0.65rem', color: phase.statusColor, fontWeight: 900, letterSpacing: '0.2em', marginBottom: '4px' }}>{phase.phase}</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{phase.name}</div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                                <span style={{ fontSize: '0.55rem', fontWeight: 900, color: phase.statusColor, background: `${phase.statusColor}18`, padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.1em' }}>{phase.status}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{phase.timeline}</span>
                                            </div>
                                        </div>
                                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {phase.items.map((item, j) => (
                                                <li key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                                                    <CheckCircle2 size={14} style={{ color: phase.statusColor, flexShrink: 0, marginTop: '2px' }} />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                    {!isMobile && phase.side === 'left' && <div />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <footer style={{ padding: '80px 60px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <img 
                    src="https://xibalbatechsol.github.io/xibalba-solutions-site/XibalbaSolutionsLogo.png" 
                    alt="Xibalba" 
                    style={{ height: '40px', opacity: 0.5, marginBottom: '32px' }} 
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: isMobile ? '16px 24px' : '32px 48px', marginBottom: '48px', padding: isMobile ? '0 20px' : '0' }}>
                    {[
                        { label: 'Core Protocol', link: "https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/protocol_specs.md" },
                        { label: 'Governance', link: "/blog" },
                        { label: 'Insurance Vault', link: "https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/erc_8004.md" },
                        { label: 'Developer SDK', link: "https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/integration-guide.md" },
                        { label: 'Technical Blog', link: "/blog" },
                        { label: 'Contact Us', link: "contact" }
                    ].map(link => (
                        <a 
                            key={link.label} 
                            href={link.link === 'contact' ? '#' : link.link} 
                            target={link.link.startsWith('http') ? "_blank" : "_self"}
                            rel={link.link.startsWith('http') ? "noopener noreferrer" : ""}
                            onClick={(e) => {
                                if (!link.link.startsWith('http')) {
                                    e.preventDefault();
                                    if (link.link === 'contact') {
                                        setContactType('developer');
                                        setIsContactOpen(true);
                                    } else {
                                        navigate(link.link);
                                        window.scrollTo(0, 0);
                                    }
                                }
                            }}
                            style={{ 
                                fontSize: isMobile ? '0.75rem' : '0.85rem', 
                                color: 'rgba(255,255,255,0.45)', 
                                textDecoration: 'none', 
                                fontWeight: 700, 
                                transition: 'all 0.2s', 
                                cursor: 'pointer', 
                                whiteSpace: 'nowrap',
                                borderBottom: '1px solid transparent'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--gold)';
                                e.currentTarget.style.borderBottom = '1px solid var(--gold)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                                e.currentTarget.style.borderBottom = '1px solid transparent';
                            }}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>
                    © 2026 Xibalba Technology Solutions. Integrity Protocol v8.3 is a sovereign reputation infrastructure.
                </p>
            </footer>

            <ContactModal 
                isOpen={isContactOpen} 
                onClose={() => setIsContactOpen(false)} 
                initialType={contactType} 
            />

            <RegistryExplorer 
                isOpen={isRegistryOpen}
                onClose={() => setIsRegistryOpen(false)}
            />
        </div>
    );
};
