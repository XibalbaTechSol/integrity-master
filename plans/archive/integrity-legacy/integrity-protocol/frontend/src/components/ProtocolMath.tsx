import React from 'react';
import { Sigma, BrainCircuit, ShieldCheck, Activity, Lock } from 'lucide-react';
import Latex from 'react-latex-next';
import { useIsMobile } from '../utils/useIsMobile';

interface ProtocolMathProps {
    agent?: any;
}

export const ProtocolMath: React.FC<ProtocolMathProps> = ({ agent }) => {
    const isMobile = useIsMobile();
    const ds = agent ? Math.exp(-1.5 * Math.pow(agent.performance_variance || 0, 2)) : 0.98;
    const gb = agent ? 1.0 + ((agent.grounding_score || 0) / 1000 * 0.2) : 1.15;
    const b = agent ? (agent.current_ais / (ds * gb)) : 740;

    return (
        <div className="enterprise-card" style={{ height: '100%' }}>

            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: isMobile ? '16px' : '24px' }}>
                <Sigma size={18} style={{ color: 'var(--gold)' }} />
                <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.25em', margin: 0, fontFamily: 'Inter, sans-serif' }}>Tri-Metric Engine</h2>
            </div>
            <div style={{ padding: isMobile ? '0 16px 16px' : '0 32px 16px', fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.5, borderBottom: '1px solid var(--border)', textAlign: 'justify' }}>
                The mathematical foundation of the Integrity Protocol. Performance telemetry is routed through these deterministic algorithms to produce a tamper-proof rating. The Tri-Metric Engine balances base operational history with exponential decay penalties for instability, ensuring that only consistently reliable nodes achieve Tier 1 status while unstable or malicious actors face immediate algorithmic slashing of their reputation capital.
            </div>
            
            <div className="card-body" style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Master Equation */}
                <div style={{ backgroundColor: 'var(--navy-deep)', border: '1px solid var(--gold)', padding: isMobile ? '16px' : '24px', borderRadius: 'var(--r-md)', position: 'relative', color: 'white' }}>
                    <p style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '16px' }}>AIS v8.0 Correlated Logic</p>
                    <div className="mono" style={{ color: 'white', fontSize: '1rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <p style={{ fontWeight: 700, margin: 0, fontSize: isMobile ? '1.1rem' : '1.4rem' }}>
                            <Latex>{'$AIS = (B \\times D_s \\times G_b)$'}</Latex>
                        </p>
                        <div style={{ height: '1px', backgroundColor: 'rgba(212, 175, 55, 0.2)', width: '100%', margin: '12px 0' }} />
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, margin: 0 }}>B <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>— Base Integrity {isMobile ? '' : '(Sacrifice, Staking, Volume)'}</span></p>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, margin: 0 }}>D_s <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>— Stability Drag (<Latex>{'$e^{-1.5\\sigma^2}$'}</Latex>)</span></p>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, margin: 0 }}>G_b <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>— Grounding Boost (<Latex>{'$1 + 0.2HGI$'}</Latex>)</span></p>
                    </div>
                </div>

                {/* Sub Equations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '20px', backgroundColor: 'var(--background)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--gold)' }}>
                                <Activity size={16} />
                                <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0, fontFamily: 'Inter, sans-serif', color: 'var(--navy)' }}>Stability Drag (D_s)</h3>
                            </div>
                            <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--gold)' }}>{ds.toFixed(3)}</span>
                        </div>
                        <p className="mono" style={{ color: 'var(--navy)', fontSize: '0.85rem', marginBottom: '12px', fontWeight: 700 }}>
                            <Latex>{'$D_s = \\exp(-1.5 \\cdot \\sigma^2)$'}</Latex>
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>Exponential decay based on performance variance. Ensures that unstable nodes are penalized regardless of their stake or history.</p>
                    </div>

                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '20px', backgroundColor: 'var(--background)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--navy-light)' }}>
                                <ShieldCheck size={16} />
                                <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0, fontFamily: 'Inter, sans-serif', color: 'var(--navy)' }}>Grounding Boost (G_b)</h3>
                            </div>
                            <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--navy-light)' }}>{gb.toFixed(3)}</span>
                        </div>
                        <p className="mono" style={{ color: 'var(--navy)', fontSize: '0.85rem', marginBottom: '12px', fontWeight: 700 }}>
                            <Latex>{'$G_b = 1.0 + (HGI \\cdot 0.2)$'}</Latex>
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>Human-in-the-Loop feedback provides a multiplier (up to 20%) to the base integrity, rewarding high-accountability nodes.</p>
                    </div>

                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '20px', backgroundColor: 'var(--background)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                                <BrainCircuit size={16} />
                                <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0, fontFamily: 'Inter, sans-serif', color: 'var(--navy)' }}>Base Integrity (B)</h3>
                            </div>
                            <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-muted)' }}>{Math.round(b)}</span>
                        </div>
                        <p className="mono" style={{ color: 'var(--navy)', fontSize: '0.85rem', marginBottom: '12px', fontWeight: 700 }}>
                            <Latex>{'$B = \\sum (W_i \\cdot Metric_i)$'}</Latex>
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>Weighted sum of Trustflow (25%), Xibalba Audit (25%), Sacrifice (20%), Staking Age (15%), and Volume (15%).</p>
                    </div>
                </div>

                {/* Identity Ceiling Protocol */}
                <div style={{ padding: '24px', background: 'var(--navy-deep)', borderRadius: 'var(--r-md)', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <Lock size={16} style={{ color: 'var(--gold)' }} />
                        <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', margin: 0 }}>Identity Ceiling Protocol</h3>
                    </div>
                    <div className="mono" style={{ fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                            <span style={{ opacity: 0.6 }}>TIER 1 (SOVEREIGN)</span>
                            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>600 MAX AIS</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                            <span style={{ opacity: 0.6 }}>TIER 2 (LINKED)</span>
                            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>850 MAX AIS</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ opacity: 0.6 }}>TIER 3 (INSTITUTIONAL)</span>
                            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>1000 MAX AIS</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
