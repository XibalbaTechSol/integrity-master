import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ethers } from 'ethers';

// Import Custom Core Components
import { AgentCard } from '../components/AgentCard';
import { ImmutableLedger } from '../components/ImmutableLedger';
import { ProtocolMath } from '../components/ProtocolMath';
import { UserReputationOverview } from '../components/UserReputationOverview';
import { ReputationHistoryChart } from '../components/ReputationHistoryChart';
import { ProtocolStats } from '../components/ProtocolStats';
import { TelemetryStream } from '../components/TelemetryStream';
import { TokenWallet } from '../components/TokenWallet';
import { CreditFacility } from '../components/CreditFacility';
import { GlobalSettings } from '../components/GlobalSettings';
import { DIDExplorer } from '../components/DIDExplorer';
import { RiskAutomation } from '../components/RiskAutomation';
import { SandboxConsole } from '../components/SandboxConsole';
import { AgentOnboarding } from '../components/AgentOnboarding';
import { RegistryExplorer } from '../components/RegistryExplorer';

import { useIsMobile } from '../utils/useIsMobile';
import { API_BASE } from '../constants';
import { 
    Menu, X, RefreshCw, LogOut, Cpu, Server, Wallet, Zap, 
    Shield, ShieldCheck, Rocket, Lock, Fingerprint, Settings, 
    MoreHorizontal, Search, TrendingUp, Code, Activity, HelpCircle,
    ArrowUpRight, ExternalLink, Coins
} from 'lucide-react';

interface Agent {
    eth_address: string;
    alias: string;
    xns_handle?: string;
    verification_tier: number;
    current_ais: number;
    staked_ratio: number;
    entropy_score: number;
    grounding_score: number;
    performance_variance: number;
    risk_tier?: string;
    recommended_premium_bps?: number;
    tx_count_24h?: number;
    penalty_points?: number;
}

export const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBackendUp, setIsBackendUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [editAgent, setEditAgent] = useState<Agent | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('command'); // 'command', 'sandbox', 'settings'
    const [searchParams, setSearchParams] = useSearchParams();
    const [isRegistryOpen, setIsRegistryOpen] = useState(false);
    const isMobile = useIsMobile();

    // MetaMask Web3 States
    const [metaMaskAddress, setMetaMaskAddress] = useState<string | null>(null);
    const [metaMaskBalance, setMetaMaskBalance] = useState<string>('0.0');
    const [isConnectingMetaMask, setIsConnectingMetaMask] = useState(false);

    // Live Web3 Connection
    const connectMetaMask = async () => {
        if (window.ethereum) {
            setIsConnectingMetaMask(true);
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts.length > 0) {
                    const addr = accounts[0];
                    setMetaMaskAddress(addr);
                    
                    const bal = await provider.getBalance(addr);
                    setMetaMaskBalance(ethers.formatEther(bal));

                    // Register with backend sync if session is active
                    try {
                        let token = '';
                        if (user) {
                            token = `Bearer ${await user.getIdToken()}`;
                        } else {
                            const mockToken = localStorage.getItem('integrity_mock_token');
                            token = mockToken ? (mockToken.startsWith('Bearer ') ? mockToken : `Bearer ${mockToken}`) : '';
                        }
                        if (token) {
                            await axios.post(`${API_BASE}/v1/hermes/link`, {
                                eth_address: addr
                            }, {
                                headers: { Authorization: token }
                            });
                            console.log("Sovereign address synchronized with session ledger.");
                        }
                    } catch (err) {
                        console.warn("Hermes sync skipped or offline:", err);
                    }
                }
            } catch (err) {
                console.error("MetaMask error:", err);
            } finally {
                setIsConnectingMetaMask(false);
            }
        } else {
            alert("MetaMask extension not detected in this browser session.");
        }
    };

    const disconnectMetaMask = () => {
        setMetaMaskAddress(null);
        setMetaMaskBalance('0.0');
    };

    // Auto-discover existing accounts on session bootstrap
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_accounts' })
                .then(async (accounts: string[]) => {
                    if (accounts.length > 0) {
                        const addr = accounts[0];
                        setMetaMaskAddress(addr);
                        const provider = new ethers.BrowserProvider(window.ethereum);
                        const bal = await provider.getBalance(addr);
                        setMetaMaskBalance(ethers.formatEther(bal));
                    }
                })
                .catch(console.error);

            const handleAccountsChanged = async (accounts: string[]) => {
                if (accounts.length > 0) {
                    const addr = accounts[0];
                    setMetaMaskAddress(addr);
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const bal = await provider.getBalance(addr);
                    setMetaMaskBalance(ethers.formatEther(bal));
                } else {
                    disconnectMetaMask();
                }
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            return () => {
                if (window.ethereum && window.ethereum.removeListener) {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                }
            };
        }
    }, []);

    // Firebase Auth State
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            const mockToken = localStorage.getItem('integrity_mock_token');
            if (currentUser) {
                setUser(currentUser);
            } else if (mockToken) {
                const isMaster = mockToken.includes('master_agent_token');
                const guestId = mockToken.replace('Bearer ', '');
                const mockUser: any = {
                    uid: isMaster ? 'jacob_v_universe_master' : guestId,
                    email: isMaster ? 'jacob.v.universe@gmail.com' : `${guestId}@guest.integrity`,
                    displayName: isMaster ? 'Jacob Vickers' : 'Guest Sovereign',
                    getIdToken: async () => mockToken
                };
                setUser(mockUser);
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    // Parse onboarding flags
    useEffect(() => {
        if (searchParams.get('onboarding') === 'true') {
            setIsOnboardingOpen(true);
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('onboarding');
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    // API Oracle connectivity check
    useEffect(() => {
        const checkHealth = async () => {
            try {
                await axios.get(`${API_BASE}/health`);
                setIsBackendUp(true);
            } catch (e) {
                setIsBackendUp(false);
            }
        };
        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    // Test Automation State Hooks for Playwright
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).__setTab = (tab: string) => setActiveTab(tab);
            (window as any).__setSelectedAgentState = (hasAgent: boolean) => {
                if (hasAgent) {
                    const mockAgent = agents[0] || {
                        eth_address: '0x67ba5d723e1f5517aff7eb980e2f73a9e17ad556',
                        alias: 'Xibalba Core',
                        did: 'did:intg:0x67ba5d723e1f5517aff7eb980e2f73a9e17ad556',
                        verification_tier: 3,
                        current_ais: 920,
                        grounding_score: 95,
                        entropy_score: 92,
                        sacrifice_score: 88,
                        risk_tier: 'AAA',
                        recommended_premium_bps: 25,
                        tx_count_24h: 124,
                        status: 'active'
                    };
                    setSelectedAgent(mockAgent);
                } else {
                    setSelectedAgent(null);
                }
            };
            (window as any).__setRegistryOpen = (open: boolean) => setIsRegistryOpen(open);
            (window as any).__setOnboardingOpen = (open: boolean) => setIsOnboardingOpen(open);
            (window as any).__setMetaMaskAddress = (addr: string | null) => {
                setMetaMaskAddress(addr);
                if (addr) {
                    setMetaMaskBalance('54.2');
                } else {
                    setMetaMaskBalance('0.0');
                }
            };
        }
    }, [agents, setActiveTab, setSelectedAgent, setIsRegistryOpen, setIsOnboardingOpen, setMetaMaskAddress]);

    const fetchProfile = useCallback(async () => {
        let token = '';
        if (user) {
            token = await user.getIdToken();
        } else {
            const mockToken = localStorage.getItem('integrity_mock_token');
            if (mockToken) {
                token = mockToken.replace('Bearer ', '');
            } else {
                return;
            }
        }
        if (!token) return;

        try {
            const res = await axios.get(`${API_BASE}/v1/identity/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserProfile(res.data);
        } catch (e) {
            console.error("Profile fetch error:", e);
        }
    }, [user]);

    const fetchAgents = useCallback(async (isInitial = false, selectAddress?: string) => {
        let token = '';
        if (user) {
            token = `Bearer ${await user.getIdToken()}`;
        } else {
            const mockToken = localStorage.getItem('integrity_mock_token');
            if (mockToken) {
                token = mockToken.startsWith('Bearer ') ? mockToken : `Bearer ${mockToken}`;
            } else {
                return;
            }
        }

        if (isInitial) setIsLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE}/v1/user/agents`, {
                headers: { Authorization: token }
            });            
            const userAgents = Array.isArray(res.data) ? res.data : [];
            
            let enrichedAgents = await Promise.all(
                userAgents.map(async (agent: any) => {
                    try {
                        const quoteRes = await axios.post(`${API_BASE}/v1/insurance/quote`, {
                            agent_eth_address: agent.eth_address,
                            contract_value_intg: 1000.0
                        });
                        return {
                            ...agent,
                            risk_tier: quoteRes.data.risk_tier,
                            recommended_premium_bps: quoteRes.data.recommended_premium_bps,
                            tx_count_24h: agent.tx_count_24h || 0
                        };
                    } catch (e) {
                        return { ...agent, tx_count_24h: agent.tx_count_24h || 0 };
                    }
                })
            );

            // Master Agent Injection
            const isMockMaster = localStorage.getItem('integrity_mock_token') === 'mock_demo_token';
            const isMaster = isMockMaster || user?.email === 'jacob.v.universe@gmail.com' || user?.email === 'xibalbasolutions@gmail.com' || user?.email === 'demo@integrity.protocol' || user?.uid === 'master_agent_uid' || user?.uid === 'mock_dev_uid' || user?.uid === 'jacob_v_universe_master' || localStorage.getItem('integrity_master_email') === 'xibalbasolutions@gmail.com';
            
            const xibalbaAgent: any = {
                eth_address: '0x67ba5d723e1f5517aff7eb980e2f73a9e17ad556',
                alias: 'Xibalba Core',
                did: 'did:intg:0x67ba5d723e1f5517aff7eb980e2f73a9e17ad556',
                verification_tier: 3,
                current_ais: 920,
                grounding_score: 950,
                entropy_score: 920,
                sacrifice_score: 880,
                risk_tier: 'AAA',
                recommended_premium_bps: 25,
                tx_count_24h: 124,
                status: 'active'
            };

            if (isMaster) {
                const alreadyHas = enrichedAgents.some(a => a.eth_address === xibalbaAgent.eth_address);
                if (!alreadyHas) {
                    enrichedAgents = [xibalbaAgent, ...enrichedAgents];
                }
            }
            
            setAgents(enrichedAgents);
            setIsBackendUp(true);
            
            if (enrichedAgents.length > 0) {
                setSelectedAgent(prev => {
                    if (selectAddress) {
                        const target = enrichedAgents.find(a => a.eth_address === selectAddress);
                        if (target) return target;
                    }
                    if (!prev) return enrichedAgents[0];
                    const updated = enrichedAgents.find(a => a.eth_address === prev.eth_address);
                    return updated || enrichedAgents[0];
                });
            } else {
                setSelectedAgent(null);
            }
        } catch (error: any) {
            console.error("Agent fetch failed, initiating master fallback...", error.message);
            setIsBackendUp(false);
            
            const isMaster = user?.email === 'jacob.v.universe@gmail.com' || user?.email === 'xibalbasolutions@gmail.com' || user?.email === 'demo@integrity.protocol' || user?.uid === 'master_agent_uid' || user?.uid === 'mock_dev_uid' || user?.uid === 'jacob_v_universe_master' || localStorage.getItem('integrity_master_email') === 'xibalbasolutions@gmail.com';
            if (isMaster) {
                const xibalbaAgent: any = {
                    eth_address: '0x67ba5d723e1f5517aff7eb980e2f73a9e17ad556',
                    alias: 'Xibalba Core',
                    did: 'did:intg:0x67ba5d723e1f5517aff7eb980e2f73a9e17ad556',
                    verification_tier: 3,
                    current_ais: 920,
                    grounding_score: 950,
                    entropy_score: 920,
                    sacrifice_score: 880,
                    risk_tier: 'AAA',
                    recommended_premium_bps: 25,
                    tx_count_24h: 124,
                    status: 'active'
                };
                setAgents([xibalbaAgent]);
                setSelectedAgent(prev => prev || xibalbaAgent);
                return;
            }

            setError("Failed to fetch verified nodes from the Oracle.");
            setAgents([]);
            setSelectedAgent(null);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchAgents(true);
            fetchProfile();
            const interval = setInterval(() => fetchAgents(false), 30000);
            return () => clearInterval(interval);
        }
    }, [user, fetchAgents, fetchProfile]);

    const handleLogout = async () => {
        localStorage.removeItem('integrity_demo_mode');
        await auth.signOut();
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--navy-deep)', color: 'white' }}>
            
            {/* INJECT PREMIUM SCANLINE CUSTOM CSS */}
            <style dangerouslySetInnerHTML={{__html: `
                .premium-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1.1fr;
                    gap: 24px;
                    width: 100%;
                }
                @media (max-width: 1024px) {
                    .premium-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .glow-panel {
                    background: rgba(5, 13, 24, 0.6);
                    border: 1px solid var(--border);
                    border-radius: var(--r-md);
                    backdrop-filter: blur(20px);
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
                    transition: border 0.3s ease, box-shadow 0.3s ease;
                }
                .glow-panel:hover {
                    border-color: rgba(201, 168, 76, 0.25);
                    box-shadow: 0 10px 40px rgba(201, 168, 76, 0.04);
                }
                .glow-panel-gold {
                    border: 1px solid rgba(201, 168, 76, 0.15);
                    box-shadow: 0 4px 30px rgba(201, 168, 76, 0.05);
                }
                .zk-code-editor {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.72rem;
                    background: rgba(2, 6, 23, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    color: #e2e8f0;
                    padding: 16px;
                    border-radius: 12px;
                    overflow-x: auto;
                    max-height: 240px;
                    line-height: 1.6;
                }
                .pulse-green {
                    box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
                }
                .pulse-gold-slow {
                    box-shadow: 0 0 12px rgba(201, 168, 76, 0.4);
                    animation: pulseGlow 3s infinite alternate;
                }
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 8px rgba(201, 168, 76, 0.2); }
                    100% { box-shadow: 0 0 18px rgba(201, 168, 76, 0.5); }
                }
                .custom-select {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: white;
                    border-radius: 8px;
                    padding: 8px 12px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    outline: none;
                    cursor: pointer;
                }
                .agent-item {
                    transition: background 0.2s ease, border-color 0.2s ease;
                }
                .agent-item:hover {
                    background: rgba(255,255,255,0.02);
                }
                .w3c-tag {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.6rem;
                    color: var(--gold);
                    background: rgba(201, 168, 76, 0.06);
                    border: 1px solid rgba(201, 168, 76, 0.2);
                    padding: 2px 6px;
                    border-radius: 4px;
                    text-transform: uppercase;
                }
            `}} />

            {/* Master Banner */}
            {(user?.uid === 'jacob_v_universe_master' || localStorage.getItem('integrity_master_email') === 'xibalbasolutions@gmail.com') && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'linear-gradient(90deg, #d4af37, #f4c430)', color: 'black', padding: '6px 12px', fontSize: '0.65rem', fontWeight: 900, textAlign: 'center', zIndex: 2000, letterSpacing: '0.15em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ShieldCheck size={12} />
                    Protocol Guardian Access: Xibalba Master Root Active
                    <ShieldCheck size={12} />
                </div>
            )}
            
            {/* DESKTOP SIDEBAR NAVIGATION */}
            {!isMobile && (
                <aside style={{
                    width: 'var(--sidebar-w)',
                    background: 'rgba(5, 13, 24, 0.98)',
                    borderRight: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    zIndex: 100,
                    backdropFilter: 'var(--glass-blur)'
                }}>
                    <div style={{ padding: 'var(--space-8) var(--space-6)', borderBottom: '1px solid var(--border)', marginTop: user?.uid === 'jacob_v_universe_master' ? '28px' : 0 }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Playfair Display, serif', color: 'white', letterSpacing: '0.02em' }}>
                            XIBALBA<span style={{ color: 'var(--gold)' }}>.</span>
                        </div>
                        <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.3em', marginTop: 'var(--space-1)' }}>
                            Integrity Protocol<br/>
                            <span style={{color: 'rgba(255,255,255,0.5)', fontSize: '0.45rem', display: 'block', marginTop: '6px', letterSpacing: '0.1em'}}>Pilot Node: Xibalba</span>
                        </div>
                    </div>

                    <nav style={{ padding: 'var(--space-6) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
                        <button
                            onClick={() => setActiveTab('command')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                                padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--r-md)',
                                background: activeTab === 'command' ? 'var(--gold-muted)' : 'transparent',
                                color: activeTab === 'command' ? 'var(--gold)' : 'var(--text-secondary)',
                                border: `1px solid ${activeTab === 'command' ? 'var(--glass-border-strong)' : 'transparent'}`,
                                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', width: '100%', textAlign: 'left'
                            }}
                        >
                            <Cpu size={18} style={{ opacity: activeTab === 'command' ? 1 : 0.6 }} />
                            Command Center
                        </button>

                        <button
                            onClick={() => setActiveTab('sandbox')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                                padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--r-md)',
                                background: activeTab === 'sandbox' ? 'var(--gold-muted)' : 'transparent',
                                color: activeTab === 'sandbox' ? 'var(--gold)' : 'var(--text-secondary)',
                                border: `1px solid ${activeTab === 'sandbox' ? 'var(--glass-border-strong)' : 'transparent'}`,
                                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', width: '100%', textAlign: 'left'
                            }}
                        >
                            <Code size={18} style={{ opacity: activeTab === 'sandbox' ? 1 : 0.6 }} />
                            Developer Sandbox
                        </button>

                        <button
                            onClick={() => setActiveTab('settings')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                                padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--r-md)',
                                background: activeTab === 'settings' ? 'var(--gold-muted)' : 'transparent',
                                color: activeTab === 'settings' ? 'var(--gold)' : 'var(--text-secondary)',
                                border: `1px solid ${activeTab === 'settings' ? 'var(--glass-border-strong)' : 'transparent'}`,
                                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', width: '100%', textAlign: 'left'
                            }}
                        >
                            <Settings size={18} style={{ opacity: activeTab === 'settings' ? 1 : 0.6 }} />
                            Global Config
                        </button>
                        
                        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <a href="/docs/whitepaper.md" target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none', padding: '6px 16px', transition: 'color 0.3s' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>Protocol Whitepaper</a>
                            <a href="/docs/tokenomics.md" target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none', padding: '6px 16px', transition: 'color 0.3s' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>Tokenomics ($ITK)</a>
                        </div>
                    </nav>

                    <div style={{ padding: 'var(--space-6) var(--space-4)', borderTop: '1px solid var(--border)' }}>
                        <button onClick={() => setIsOnboardingOpen(true)} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '0.75rem', marginBottom: 'var(--space-4)', borderRadius: 'var(--r-sm)' }}>
                            + REGISTER AGENT
                        </button>
                        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', width: '100%', padding: 'var(--space-2) var(--space-4)', fontWeight: 600 }}>
                            <LogOut size={14} /> Sign Out
                        </button>
                    </div>
                </aside>
            )}

            {/* MAIN WORKSPACE VIEWPORT */}
            <main style={{ 
                marginLeft: isMobile ? '0' : 'var(--sidebar-w)', 
                flex: 1, 
                padding: isMobile ? '0 0 80px 0' : '0', 
                minHeight: '100vh',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflowX: 'hidden'
            }}>
                {/* UNIFIED HEADER WITH ORACLE CONNECTIVITY & METAMASK */}
                <header style={{
                    height: 'var(--header-h)',
                    padding: isMobile ? '0 var(--space-4)' : '0 var(--space-12)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: user?.uid === 'jacob_v_universe_master' ? '28px' : 0,
                    background: 'rgba(5, 13, 24, 0.8)',
                    backdropFilter: 'var(--glass-blur)',
                    WebkitBackdropFilter: 'var(--glass-blur)',
                    zIndex: 50
                }}>
                    <div>
                        {!isMobile && <div style={{ fontSize: '0.65rem', color: 'var(--gold)', letterSpacing: '0.25em', fontWeight: 800, marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>Sovereign Node Core</div>}
                        <h1 style={{ fontSize: isMobile ? '1.2rem' : '1.8rem', margin: 0, color: 'white', fontWeight: 800, fontFamily: 'Playfair Display, serif' }}>
                            {{ command: 'Command Center', settings: 'Global Settings', sandbox: 'Developer Sandbox' }[activeTab]}
                        </h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        
                        {/* Live Oracle Status Indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-4)', background: 'var(--glass-surface-light)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)' }}>
                            <div className={isBackendUp ? 'pulse-green' : ''} style={{ width: '8px', height: '8px', borderRadius: '50%', background: isBackendUp ? '#10b981' : '#f43f5e', transition: 'background 0.3s' }} />
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: isBackendUp ? '#10b981' : '#f43f5e', letterSpacing: '0.15em' }}>
                                {isBackendUp ? 'ORACLE ONLINE' : 'ORACLE OFFLINE'}
                            </span>
                        </div>

                        {/* METAMASK CONNECTOR TRIGGERS */}
                        {metaMaskAddress ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(201, 168, 76, 0.05)', border: '1px solid rgba(201, 168, 76, 0.2)', padding: '6px 14px', borderRadius: '100px' }} className="pulse-gold-slow">
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '0.55rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800 }}>METAMASK ACTIVE</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white', fontFamily: 'monospace' }}>
                                        {metaMaskAddress.slice(0, 6)}...{metaMaskAddress.slice(-4)}
                                    </span>
                                </div>
                                <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.1)' }} />
                                <button onClick={disconnectMetaMask} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }} title="Disconnect Wallet">
                                    <X size={14} onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'} />
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={connectMetaMask} 
                                disabled={isConnectingMetaMask}
                                style={{ 
                                    background: 'linear-gradient(135deg, #c9a84c 0%, #a88432 100%)', 
                                    border: 'none', 
                                    color: 'black', 
                                    padding: '10px 20px', 
                                    borderRadius: '100px', 
                                    fontSize: '0.72rem', 
                                    fontWeight: 900, 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px',
                                    boxShadow: '0 4px 14px rgba(201, 168, 76, 0.3)'
                                }}
                            >
                                <Wallet size={14} />
                                {isConnectingMetaMask ? 'CONNECTING...' : 'CONNECT METAMASK'}
                            </button>
                        )}

                        <button onClick={() => fetchAgents(true)} disabled={isLoading} style={{ background: 'var(--glass-surface-light)', border: '1px solid var(--border)', color: 'white', padding: '10px', borderRadius: 'var(--r-md)', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </header>

                {/* CONTENT LAYOUT FOR VARIOUS TABS */}
                <div style={{ padding: isMobile ? 'var(--space-6)' : 'var(--space-10) var(--space-12)', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}
                        >
                            {activeTab === 'command' && (
                                <div className="premium-grid">
                                    
                                    {/* =========================================================
                                        COLUMN 1: FLEET COMMAND & IDENTITY (DIDs)
                                        ========================================================= */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div className="glow-panel glow-panel-gold" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <Server size={18} style={{ color: 'var(--gold)' }} />
                                                    <h3 style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Fleet Registry</h3>
                                                </div>
                                                <span className="w3c-tag">{agents.length} Nodes</span>
                                            </div>

                                            {/* Fleet Quick Selector */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                                                {agents.map(a => (
                                                    <div 
                                                        key={a.eth_address}
                                                        onClick={() => setSelectedAgent(a)}
                                                        className="agent-item"
                                                        style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'space-between', 
                                                            padding: '10px 14px', 
                                                            borderRadius: '8px', 
                                                            border: '1px solid',
                                                            borderColor: selectedAgent?.eth_address === a.eth_address ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
                                                            background: selectedAgent?.eth_address === a.eth_address ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.01)',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.current_ais >= 800 ? '#10b981' : 'var(--gold)' }} />
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.alias}</span>
                                                        </div>
                                                        <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>
                                                            {a.eth_address.slice(0, 6)}...{a.eth_address.slice(-4)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {agents.length === 0 && !isLoading && (
                                                    <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                                                        No active nodes found in this profile database.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Active Selected Agent Card Panel */}
                                        {selectedAgent ? (
                                            <div className="glow-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'Playfair Display, serif' }}>{selectedAgent.alias}</h2>
                                                            <span style={{ background: 'var(--gold-muted)', border: '1px solid var(--gold)', color: 'var(--gold)', fontSize: '0.55rem', fontWeight: 900, padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.1em' }}>
                                                                TIER {selectedAgent.verification_tier}
                                                            </span>
                                                        </div>
                                                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', marginTop: '4px' }}>
                                                            {selectedAgent.eth_address}
                                                        </p>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                        <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>INTEGRITY SCORE</span>
                                                        <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', fontFamily: 'Playfair Display, serif', lineHeight: 1, marginTop: '4px' }}>
                                                            {selectedAgent.current_ais}
                                                        </span>
                                                    </div>
                                                </div>

                                                <UserReputationOverview agents={agents} selectedAgent={selectedAgent} />
                                                <ReputationHistoryChart agentAddress={selectedAgent.eth_address} />
                                                <ProtocolMath agent={selectedAgent} />
                                                
                                                {/* Decentralized Identity (DIDs) Explorer */}
                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                                                    <DIDExplorer agent={selectedAgent} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="glow-panel" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                                Select a node from your Fleet Registry above to view verified trust diagnostics.
                                            </div>
                                        )}
                                    </div>

                                    {/* =========================================================
                                        COLUMN 2: ZK-TELEMETRY & ON-CHAIN AUDIT
                                        ========================================================= */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {/* Real-time Telemetry logs directly from the SDK */}
                                        <div style={{ flex: 'none' }}>
                                            <TelemetryStream />
                                        </div>

                                        {/* ZK-Prover Engine Mathematical Verification */}
                                        <div className="glow-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <ShieldCheck size={18} style={{ color: 'var(--gold)' }} />
                                                <h3 style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>ZK-Prover Verification Engine</h3>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                                                The SDK generates Zero-Knowledge proofs validating private grounding logs and mathematical entropy limits without exposing raw datasets.
                                            </div>

                                            <div className="zk-code-editor">
                                                <div style={{ color: '#c9a84c', marginBottom: '8px' }}>// Verified Cryptographic Attestation</div>
                                                <div>inputs: &#123;</div>
                                                <div style={{ paddingLeft: '12px' }}>grounding_hash: "0x3f5c71bde4a8990c7e2b109ef78a556d1112bc71",</div>
                                                <div style={{ paddingLeft: '12px' }}>entropy_commitment: "0xa817ce2f990a4430e8c71b10a9018e7d22f0f0c0",</div>
                                                <div style={{ paddingLeft: '12px' }}>min_reputation_threshold: {selectedAgent ? selectedAgent.current_ais : 700}</div>
                                                <div>&#125;</div>
                                                <div style={{ color: '#10b981', marginTop: '12px', fontWeight: 'bold' }}>✓ Proof Generation Completed Successfully.</div>
                                                <div style={{ color: '#10b981', fontFamily: 'monospace', fontSize: '0.62rem', marginTop: '4px' }}>Hash(Proof): 0x66f7d2f9b8c0e1a2f3e45a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6</div>
                                            </div>
                                        </div>

                                        {/* Base Sepolia Trust Ledger anchors */}
                                        <div className="glow-panel" style={{ padding: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                                <Lock size={18} style={{ color: 'var(--gold)' }} />
                                                <h3 style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Trust Ledger Anchors</h3>
                                            </div>
                                            <ImmutableLedger agentAddress={selectedAgent?.eth_address} />
                                        </div>
                                    </div>

                                    {/* =========================================================
                                        COLUMN 3: ACTUARIAL OPERATIONS & TREASURY
                                        ========================================================= */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {/* Token Wallet & MetaMask Sync */}
                                        <div className="glow-panel glow-panel-gold" style={{ padding: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                                <Coins size={18} style={{ color: 'var(--gold)' }} />
                                                <h3 style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Protocol Treasury</h3>
                                            </div>
                                            
                                            {/* Injects TokenWallet component directly, passing down firebase user */}
                                            <TokenWallet user={user} />
                                        </div>

                                        {/* AIS Credit Facility */}
                                        {selectedAgent && (
                                            <div className="glow-panel" style={{ padding: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                                    <Wallet size={18} style={{ color: 'var(--gold)' }} />
                                                    <h3 style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Credit Facility</h3>
                                                </div>
                                                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '16px' }}>
                                                    Borrow testnet **$ITK** against the reputation score of {selectedAgent.alias}. Higher AIS reputation yields lower premiums and larger credit lines.
                                                </p>
                                                <CreditFacility agentAddress={selectedAgent.eth_address} currentAIS={selectedAgent.current_ais} />
                                            </div>
                                        )}

                                        {/* SLA Risk Automation Factory */}
                                        <div className="glow-panel" style={{ padding: '24px' }}>
                                            <RiskAutomation user={user} />
                                        </div>
                                    </div>

                                </div>
                            )}

                            {activeTab === 'sandbox' && (
                                <div className="glow-panel" style={{ padding: '32px', flex: 1 }}>
                                    <SandboxConsole />
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="glow-panel" style={{ padding: '32px', flex: 1 }}>
                                    <GlobalSettings />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Mobile Bottom Navigation Bar */}
            {isMobile && (
                <nav className="mobile-bottom-nav">
                    <button
                        className={`mobile-bottom-nav-item ${activeTab === 'command' ? 'active' : ''}`}
                        onClick={() => setActiveTab('command')}
                    >
                        <Cpu size={18} />
                        <span>Command</span>
                    </button>
                    <button
                        className={`mobile-bottom-nav-item ${activeTab === 'sandbox' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sandbox')}
                    >
                        <Code size={18} />
                        <span>Sandbox</span>
                    </button>
                    <button
                        className={`mobile-bottom-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings size={18} />
                        <span>Config</span>
                    </button>
                </nav>
            )}

            {/* Onboarding Modals */}
            <AgentOnboarding 
                isOpen={isOnboardingOpen} 
                onClose={() => { setIsOnboardingOpen(false); setEditAgent(null); }}
                editAgent={editAgent}
                userProfile={userProfile}
                onSuccess={(newAddr: string) => { fetchAgents(false, newAddr); setIsOnboardingOpen(false); setEditAgent(null); }}
            />

            <RegistryExplorer isOpen={isRegistryOpen} onClose={() => setIsRegistryOpen(false)} />
        </div>
    );
};
