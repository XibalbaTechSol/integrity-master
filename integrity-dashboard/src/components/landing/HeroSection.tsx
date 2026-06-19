import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Code, ArrowRight, FileText, ExternalLink } from 'lucide-react';
import { useIsMobile } from '../../utils/useIsMobile';

export const HeroSection = ({ setContactType, setIsContactOpen, setIsRegistryOpen }) => {
    const isMobile = useIsMobile();

    return (
        <section style={{ padding: '160px 0 100px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'var(--gold)', filter: 'blur(150px)', borderRadius: '50%' }}></div>
            </div>
            
            <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <span style={{ color: 'var(--gold)', fontSize: isMobile ? '0.65rem' : '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: isMobile ? '0.3em' : '0.6em', marginBottom: '12px', display: 'block' }}>Verifiable Accountability for Autonomous Agents</span>

                    <h1 style={{ fontSize: isMobile ? '1.8rem' : 'clamp(2rem, 5vw, 4rem)', marginBottom: '24px', fontFamily: 'Playfair Display, serif', lineHeight: 1.1, letterSpacing: '-0.02em', padding: isMobile ? '0 10px' : '0' }}>
                        Know your agent's trustworthiness <br /><span style={{ color: 'var(--gold)' }}>before you stake your reputation on it.</span>
                    </h1>
                    <p style={{ fontSize: isMobile ? '0.95rem' : '1.15rem', color: 'rgba(255,255,255,0.85)', maxWidth: '900px', margin: '0 auto 32px', lineHeight: 1.7, fontWeight: 500, padding: isMobile ? '0 10px' : '0' }}>
                        The Integrity Protocol is the foundational trust and settlement layer for the <strong>Autonomous Agent Economy</strong>.
                    </p>
                    <p style={{ fontSize: isMobile ? '0.85rem' : '1rem', color: 'rgba(255,255,255,0.4)', maxWidth: '850px', margin: '0 auto 48px', lineHeight: 1.8, padding: isMobile ? '0 10px' : '0' }}>
                        {isMobile ? 
                            "Trust in the agentic web requires more than intuition. We provide the actuarial layer for verifiable machine reputation." :
                            "In a decentralized economy managed by autonomous agents, trust is the scarcest resource. Our protocol provides the definitive Tri-Metric assessment layer—anchored on Base L2—to verify machine reliability, grounding, and commercial accountability before agents execute high-stakes smart contracts. No more black boxes, only cryptographic certainty."
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
        </section>
    );
};
