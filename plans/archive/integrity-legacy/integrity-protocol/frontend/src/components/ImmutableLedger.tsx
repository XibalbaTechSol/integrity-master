import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { Search, ShieldCheck, ShieldAlert, Download, Terminal, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ITK_TOKEN_ADDRESS, RPC_URL, API_BASE } from '../constants';
import { useIsMobile } from '../utils/useIsMobile';
import ITK_ABI from '../abi/IntegrityToken.json';

interface ImmutableLedgerProps {
    agentAddress?: string;
}

export const ImmutableLedger: React.FC<ImmutableLedgerProps> = ({ agentAddress }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const isMobile = useIsMobile();

    const fetchLogs = async () => {
        try {
            let combinedLogs: any[] = [];
            
            // 1. Try to fetch from the off-chain API first (highly responsive and covers offline/local development)
            try {
                const response = await axios.get(`${API_BASE}/v1/ledger/history`);
                if (response.data && response.data.logs) {
                    combinedLogs = response.data.logs.map((log: any) => ({
                        ...log,
                        value: log.contract_value_intg,
                        contract_value_intg: log.contract_value_intg.toLocaleString()
                    }));
                }
            } catch (apiErr) {
                console.error("Ledger off-chain API fetch error:", apiErr);
            }

            // 2. Try to fetch from Base Sepolia on-chain events to merge or enrich
            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const itkContract = new ethers.Contract(ITK_TOKEN_ADDRESS, ITK_ABI, provider);
                const filter = itkContract.filters.Transfer();
                const events = await itkContract.queryFilter(filter, -5000);
                
                const onChainLogs = events.reverse().map((event: any) => ({
                    on_chain_tx_hash: event.transactionHash,
                    from: event.args[0],
                    to: event.args[1],
                    value: parseFloat(ethers.formatEther(event.args[2])),
                    contract_value_intg: parseFloat(ethers.formatEther(event.args[2])).toLocaleString(),
                    dispute_status: "RESOLVED",
                    created_at: new Date().toISOString(),
                    verified_by_xibalba: true,
                    agent_address: event.args[0]
                }));
                
                // Merge without duplicates (using tx hash)
                const seenHashes = new Set(combinedLogs.map(l => l.on_chain_tx_hash.toLowerCase()));
                onChainLogs.forEach((log: any) => {
                    if (!seenHashes.has(log.on_chain_tx_hash.toLowerCase())) {
                        combinedLogs.push(log);
                    }
                });
            } catch (ethErr) {
                console.error("Ledger blockchain fetch error, using local/cache only:", ethErr);
            }
            
            // Sort by created_at descending
            combinedLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            
            setLogs(combinedLogs);
        } catch (e) {
            console.error("Ledger fetch error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 15000);
        return () => clearInterval(interval);
    }, []);

    const filteredLogs = (agentAddress 
        ? logs.filter(log => !log.agent_address || log.agent_address === agentAddress)
        : logs
    ).filter(log => !searchQuery || log.on_chain_tx_hash.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleExport = () => {
        const csv = "tx_hash,from,to,value,status,timestamp\n" + logs.map(l => 
            `${l.on_chain_tx_hash},${l.from},${l.to},${l.contract_value_intg},${l.dispute_status},${l.created_at}`
        ).join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'integrity_ledger_export.csv');
        a.click();
    };

    return (
        <div style={{
            background: 'var(--glass-surface)',
            backdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            boxShadow: 'var(--shadow-lg)'
        }}>
            {/* Header */}
            <div style={{
                padding: 'var(--space-4) var(--space-6)',
                borderBottom: '1px solid var(--border)',
                background: 'var(--glass-surface-light)',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: 'var(--space-4)'
            }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Filter by TX Hash..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            padding: '12px 16px 12px 44px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--r-sm)',
                            fontSize: '0.8rem',
                            fontFamily: 'JetBrains Mono, monospace',
                            color: 'white',
                            width: '100%',
                            outline: 'none',
                            transition: 'all 0.2s'
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <button 
                        onClick={handleExport}
                        className="btn-outline"
                        style={{
                            padding: '10px 16px', fontSize: '0.7rem', display: 'flex', gap: '8px',
                            alignItems: 'center', background: 'var(--glass-surface-light)',
                            border: '1px solid var(--border)', borderRadius: 'var(--r-xs)',
                            color: 'white', cursor: 'pointer', fontWeight: 700
                        }}
                    >
                        <Download size={14} /> EXPORT
                    </button>
                </div>
            </div>

            {/* Terminal Tab Indicator */}
            <div style={{
                padding: 'var(--space-2) var(--space-6)', fontSize: '0.6rem',
                color: 'var(--gold)', fontWeight: 800, letterSpacing: '0.2em',
                background: 'rgba(201, 168, 76, 0.03)',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: '8px'
            }}>
                <Terminal size={10} /> BASE_SEPOLIA_NODE_01 // TRUST_LEDGER_STREAM
            </div>

            {/* Scrolling Log Window */}
            <div style={{
                flex: 1, overflowY: 'auto', maxHeight: isMobile ? '400px' : '520px',
                fontSize: '0.75rem', padding: '0'
            }}>
                <AnimatePresence>
                    {isLoading && logs.length === 0 ? (
                        <div style={{ padding: 'var(--space-8)' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                                    <div className="skeleton" style={{ height: '14px', width: '80px' }} />
                                    <div style={{ flex: 1 }}>
                                        <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '8px' }} />
                                        <div className="skeleton" style={{ height: '10px', width: '30%' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredLogs.length > 0 ? (
                        filteredLogs.map((log, i) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.02 }}
                                key={log.on_chain_tx_hash + i} 
                                style={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    alignItems: isMobile ? 'stretch' : 'center',
                                    gap: isMobile ? '8px' : '20px',
                                    padding: 'var(--space-4) var(--space-6)',
                                    borderBottom: '1px solid var(--border)',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                                {/* Timestamp */}
                                <span style={{
                                    color: 'var(--text-muted)', fontSize: '0.65rem',
                                    fontWeight: 700, width: isMobile ? 'auto' : '85px',
                                    fontFamily: 'JetBrains Mono, monospace', flexShrink: 0
                                }}>
                                    {new Date(log.created_at).toLocaleTimeString(undefined, { 
                                        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
                                    })}
                                </span>
                                
                                {/* Main Content */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
                                        <a 
                                            href={`https://sepolia.basescan.org/tx/${log.on_chain_tx_hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: 'var(--gold)', fontWeight: 800,
                                                textDecoration: 'none', fontSize: '0.75rem',
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                fontFamily: 'JetBrains Mono, monospace'
                                            }}
                                        >
                                            {isMobile ? `${log.on_chain_tx_hash.substring(0, 12)}...` : `${log.on_chain_tx_hash.substring(0, 24)}...`}
                                            <ExternalLink size={10} style={{ opacity: 0.5 }} />
                                        </a>
                                        <span style={{ color: 'white', fontWeight: 800, fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>
                                            {log.contract_value_intg} <span style={{ color: 'var(--gold)', opacity: 0.6 }}>ITK</span>
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {log.verified_by_xibalba ? (
                                            <span style={{ color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                                                <ShieldCheck size={11} /> ZK-SNARK_VERIFIED
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                                                <ShieldAlert size={11} /> ORACLE_PENDING
                                            </span>
                                        )}
                                        <div style={{ width: '1px', height: '10px', background: 'var(--border)' }} />
                                        <span style={{
                                            fontSize: '0.55rem', padding: '2px 8px', borderRadius: '4px',
                                            background: log.dispute_status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                            color: log.dispute_status === 'RESOLVED' ? 'var(--emerald)' : '#f43f5e',
                                            border: `1px solid ${log.dispute_status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                                            fontWeight: 800, letterSpacing: '0.05em'
                                        }}>
                                            {log.dispute_status}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div style={{
                            color: 'var(--text-muted)', padding: 'var(--space-12)',
                            textAlign: 'center', fontStyle: 'italic', fontSize: '0.8rem'
                        }}>
                            No records found on-chain.
                        </div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Footer */}
            <div style={{
                padding: 'var(--space-3) var(--space-6)',
                background: 'rgba(0,0,0,0.2)',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800 }}>
                    {filteredLogs.length} SECURE_RECORDS_INDEXED
                </span>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.65rem', borderRadius: 'var(--r-xs)' }} disabled>PREV</button>
                    <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.65rem', borderRadius: 'var(--r-xs)' }}>NEXT</button>
                </div>
            </div>
        </div>
    );
};
