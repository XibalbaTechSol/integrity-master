import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '../utils/useIsMobile';
import { API_BASE } from '../constants';

// Xibalba Solutions: Live Telemetry Stream Visualizer (v1.0)
// Real-time scrolling feed for monitoring agentic performance pulses.

export const TelemetryStream = () => {
    const isMobile = useIsMobile();
    const [stream, setStream] = useState<any[]>([]);

    useEffect(() => {
        const fetchTelemetry = async () => {
            try {
                const res = await axios.get(`${API_BASE}/v1/telemetry/latest`);
                setStream(res.data);
            } catch (e) {
                console.error("Telemetry fetch error:", e);
            }
        };

        fetchTelemetry();
        const interval = setInterval(fetchTelemetry, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="enterprise-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>

            <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: isMobile ? '16px' : '24px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
                        <Activity size={20} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.25em', fontFamily: 'Inter, sans-serif', margin: 0 }}>Live Telemetry</h2>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.3em', marginTop: '2px' }}>Ingestion In-Progress</span>
                    </div>
                </div>
                {!isMobile && (
                    <div className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Radio size={12} />
                        Syncing
                    </div>
                )}
            </div>
            <div style={{ padding: isMobile ? '16px' : '16px 32px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'justify' }}>
                Real-time ingestion of active node performance metrics. Latency, accuracy, and operational streams are continuously analyzed to feed the protocol's reputation engine.
            </div>

            {/* FIXED SIZE SCROLLING WINDOW */}
            <div className="card-body mono" style={{ flex: 1, overflowY: 'auto', maxHeight: '420px', fontSize: '0.75rem', padding: '24px' }}>
                <AnimatePresence initial={false}>
                    {stream.map((data) => {
                        const isWarning = data.latency > 1000 || data.accuracy < 0.5;
                        
                        if (isMobile) {
                            return (
                                <motion.div
                                    key={data.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        marginBottom: '16px',
                                        padding: '16px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${isWarning ? 'rgba(244, 63, 94, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                                        borderRadius: '16px',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {isWarning && (
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#f43f5e' }} />
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className={isWarning ? "" : "animate-pulse"} style={{ width: '8px', height: '8px', borderRadius: '50%', background: isWarning ? '#f43f5e' : '#10b981' }} />
                                            <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'white' }}>{data.agent}</span>
                                        </div>
                                        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{data.type}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}>LATENCY</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 900, color: isWarning ? '#f43f5e' : 'white' }}>{data.latency}ms</div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}>FIDELITY</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 900, color: isWarning ? '#f43f5e' : 'var(--gold)' }}>{data.accuracy.toFixed(2)}</div>
                                        </div>
                                    </div>
                                    {data.metadata && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.65rem' }}>
                                            {data.metadata.tee_attestation && (
                                                <span style={{ color: '#10b981', fontWeight: 800 }}>[TEE]</span>
                                            )}
                                            {data.metadata.semantic_drift !== undefined && data.metadata.semantic_drift > 0 && (
                                                <span style={{ color: 'rgba(255,255,255,0.3)' }}>Drift: <span style={{ color: 'white' }}>{(data.metadata.semantic_drift * 100).toFixed(0)}%</span></span>
                                            )}
                                            {data.metadata.transaction_velocity !== undefined && (
                                                <span style={{ color: 'rgba(255,255,255,0.3)' }}>Vel: <span style={{ color: 'white' }}>{data.metadata.transaction_velocity.toFixed(0)}/s</span></span>
                                            )}
                                            {data.metadata.discrepancy_ratio !== undefined && data.metadata.discrepancy_ratio > 0 && (
                                                <span style={{ color: 'rgba(255,255,255,0.3)' }}>Disc: <span style={{ color: 'white' }}>{(data.metadata.discrepancy_ratio * 100).toFixed(0)}%</span></span>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        }

                        return (
                            <motion.div
                                key={data.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '24px',
                                    paddingBottom: '8px',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    color: isWarning ? '#f43f5e' : 'rgba(255,255,255,0.7)'
                                }}
                            >
                                <span style={{ opacity: 0.6, width: '60px', fontSize: '0.65rem' }}>{new Date(data.timestamp).getSeconds()}:{new Date(data.timestamp).getMilliseconds()}</span>
                                <span style={{ width: '80px', fontWeight: 700, letterSpacing: '0.05em', color: data.type === 'INGEST' ? '#60a5fa' : data.type === 'VALIDATE' ? 'var(--gold)' : 'inherit' }}>
                                    {data.type}
                                </span>
                                <span style={{ width: '100px', color: 'white', fontWeight: 700 }}>{data.agent}</span>
                                <span style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                    <span style={{ fontWeight: 700 }}>LATENCY: <span style={{ color: isWarning ? '#f43f5e' : 'white' }}>{data.latency}ms</span></span>
                                    <span style={{ fontWeight: 700 }}>ACC: <span style={{ color: isWarning ? '#f43f5e' : 'white' }}>{data.accuracy.toFixed(2)}</span></span>
                                    {data.metadata?.tee_attestation && (
                                        <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.7rem', border: '1px solid rgba(16,185,129,0.3)', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.05)' }}>[TEE_SECURE]</span>
                                    )}
                                    {data.metadata?.semantic_drift !== undefined && data.metadata.semantic_drift > 0 && (
                                        <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>DRIFT: <span style={{ color: 'white' }}>{(data.metadata.semantic_drift * 100).toFixed(1)}%</span></span>
                                    )}
                                    {data.metadata?.transaction_velocity !== undefined && (
                                        <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>VEL: <span style={{ color: 'white' }}>{data.metadata.transaction_velocity.toFixed(1)}/s</span></span>
                                    )}
                                    {data.metadata?.discrepancy_ratio !== undefined && data.metadata.discrepancy_ratio > 0 && (
                                        <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>DISC: <span style={{ color: data.metadata.discrepancy_ratio > 0.2 ? '#f43f5e' : 'white' }}>{(data.metadata.discrepancy_ratio * 100).toFixed(1)}%</span></span>
                                    )}
                                </span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
            
            <div className="card-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', padding: '12px 32px' }}>
                <span className="mono" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>STREAM_BUFFER: {stream.length}/50</span>
            </div>
        </div>
    );
};
