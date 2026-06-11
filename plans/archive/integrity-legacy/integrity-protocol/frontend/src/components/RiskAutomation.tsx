import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE } from '../constants';
import { Shield, ShieldAlert, ShieldCheck, Rocket, Plus, Check, ExternalLink, RefreshCw, AlertTriangle, FileText, Zap } from 'lucide-react';

interface UserContract {
    contract_id: string;
    contract_address: string;
    contract_type: string;
    target_agent_address: string;
    parameters: any;
    status: string;
    created_at: string;
}

export const RiskAutomation = ({ user }: { user: any }) => {
    const [contracts, setContracts] = useState<UserContract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeploying, setIsDeploying] = useState(false);
    const [showSLAForm, setShowSLAForm] = useState(false);
    const [showInsuranceForm, setShowInsuranceForm] = useState(false);

    // Form States
    const [agentAddress, setAgentAddress] = useState('');
    const [amount, setAmount] = useState('100');
    const [minAIS, setMinAIS] = useState('700');
    const [duration, setDuration] = useState('30');

    const fetchContracts = async () => {
        setIsLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await axios.get(`${API_BASE}/v1/user/contracts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setContracts(res.data);
        } catch (e) {
            console.error("Fetch contracts error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchContracts();
    }, [user]);

    const deploySLA = async () => {
        setIsDeploying(true);
        try {
            const token = await user.getIdToken();
            await axios.post(`${API_BASE}/v1/factory/deploy/sla`, {
                agent_address: agentAddress,
                amount_itk: parseFloat(amount),
                min_ais: parseInt(minAIS),
                duration_days: parseInt(duration)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowSLAForm(false);
            fetchContracts();
        } catch (e) {
            console.error("Deploy SLA error:", e);
            alert("Deployment failed. Check console for details.");
        } finally {
            setIsDeploying(false);
        }
    };

    const deployInsurance = async () => {
        setIsDeploying(true);
        try {
            const token = await user.getIdToken();
            await axios.post(`${API_BASE}/v1/factory/deploy/insurance`, {
                target_agent_address: agentAddress,
                payout_itk: parseFloat(amount),
                trigger_ais: parseInt(minAIS),
                duration_days: parseInt(duration)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowInsuranceForm(false);
            fetchContracts();
        } catch (e) {
            console.error("Deploy Insurance error:", e);
            alert("Deployment failed. Check console for details.");
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {/* Header / Intro */}
            <div className="enterprise-card" style={{ padding: 'var(--space-8)', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05), rgba(5, 13, 24, 0.9))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <div style={{ padding: 'var(--space-3)', background: 'var(--gold-muted)', borderRadius: 'var(--r-lg)', color: 'var(--gold)' }}>
                        <Rocket size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.4rem', color: 'white', fontWeight: 800 }}>Risk Automation Factory</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Deploy no-code, reputation-backed smart contracts to mitigate agent risk.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
                    <button 
                        onClick={() => { setShowSLAForm(true); setShowInsuranceForm(false); }}
                        className="btn btn-primary" 
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
                    >
                        <Zap size={16} /> DEPLOY SLA ESCROW
                    </button>
                    <button 
                        onClick={() => { setShowInsuranceForm(true); setShowSLAForm(false); }}
                        className="btn btn-outline" 
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
                    >
                        <ShieldCheck size={16} /> DEPLOY INSURANCE VAULT
                    </button>
                </div>
            </div>

            {/* Forms */}
            {(showSLAForm || showInsuranceForm) && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="enterprise-card" style={{ padding: 'var(--space-8)', border: '1px solid var(--gold-muted)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--gold)', fontWeight: 800, marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {showSLAForm ? <Zap size={18} /> : <ShieldCheck size={18} />}
                        Configure {showSLAForm ? 'SLA Escrow' : 'Parametric Insurance'}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                        <div className="input-group">
                            <label>Target Agent Address</label>
                            <input 
                                type="text" 
                                placeholder="0x..." 
                                value={agentAddress} 
                                onChange={(e) => setAgentAddress(e.target.value)} 
                            />
                        </div>
                        <div className="input-group">
                            <label>{showSLAForm ? 'Escrow Amount (ITK)' : 'Payout Amount (ITK)'}</label>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                            />
                        </div>
                        <div className="input-group">
                            <label>{showSLAForm ? 'Min AIS for Release' : 'Trigger AIS (Fault Condition)'}</label>
                            <input 
                                type="number" 
                                value={minAIS} 
                                onChange={(e) => setMinAIS(e.target.value)} 
                            />
                        </div>
                        <div className="input-group">
                            <label>Duration (Days)</label>
                            <input 
                                type="number" 
                                value={duration} 
                                onChange={(e) => setDuration(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-4)' }}>
                        <button 
                            disabled={isDeploying}
                            onClick={showSLAForm ? deploySLA : deployInsurance}
                            className="btn btn-primary" 
                            style={{ flex: 1 }}
                        >
                            {isDeploying ? <RefreshCw className="animate-spin" /> : (showSLAForm ? 'AUTHORIZE SLA DEPLOYMENT' : 'INITIALIZE INSURANCE VAULT')}
                        </button>
                        <button 
                            onClick={() => { setShowSLAForm(false); setShowInsuranceForm(false); }}
                            className="btn btn-outline" 
                            style={{ width: '120px' }}
                        >
                            CANCEL
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Contract List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>ACTIVE AUTOMATIONS</h3>
                    <button onClick={fetchContracts} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer' }}><RefreshCw size={14} /></button>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>Fetching risk ledger...</div>
                ) : contracts.length === 0 ? (
                    <div className="enterprise-card" style={{ padding: 'var(--space-12)', textAlign: 'center', opacity: 0.6 }}>
                        <AlertTriangle size={32} style={{ margin: '0 auto var(--space-4) auto', color: 'var(--gold)' }} />
                        <p>No active risk contracts found for this identity.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-4)' }}>
                        {contracts.map(c => (
                            <motion.div key={c.contract_id} className="enterprise-card" style={{ padding: 'var(--space-6)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: c.contract_type === 'SLA' ? 'var(--gold)' : '#3b82f6' }} />
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.1em' }}>{c.contract_type} // {c.status}</span>
                                    <a href={`https://sepolia.basescan.org/address/${c.contract_address}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}><ExternalLink size={14} /></a>
                                </div>

                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', marginBottom: 'var(--space-2)' }}>{c.contract_address.slice(0, 10)}...{c.contract_address.slice(-8)}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>Target: {c.target_agent_address.slice(0, 12)}...</div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--r-sm)' }}>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.contract_type === 'SLA' ? 'Escrow' : 'Coverage'}</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>{c.parameters.amount || c.parameters.payout} ITK</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Threshold</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>{c.parameters.min_ais || c.parameters.trigger_ais} AIS</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
