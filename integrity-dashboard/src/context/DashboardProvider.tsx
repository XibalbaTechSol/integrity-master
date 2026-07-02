import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import type { Agent, ProtocolStats, TabId } from '../types';
import { DashboardContext } from './useDashboard';
import type { ToastMessage } from './useDashboard';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentAddr, setSelectedAgentAddr] = useState<string | null>(null);
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendOffline, setIsBackendOffline] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [user, setUser] = useState<any>(null);
  
  const toastCounter = useRef(0);
  
  const [activeTab, setActiveTabState] = useState<TabId>(() => {
    const hash = window.location.hash.replace('#', '') as TabId;
    const validTabs: TabId[] = ['telemetry', 'identity', 'ledger', 'zk', 'factory', 'compliance', 'shield', 'oracle', 'credit', 'governance', 'markets', 'reasoning', 'diagnostics', 'staking', 'stability', 'wallet'];
    return validTabs.includes(hash) ? hash : 'telemetry';
  });

  const setActiveTab = (tab: TabId) => {
    setActiveTabState(tab);
    window.location.hash = tab;
  };

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    toastCounter.current += 1;
    const id = `toast_${toastCounter.current}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const connectWallet = useCallback(async () => {
    const ethereum = (window as Window & typeof globalThis & { ethereum?: any }).ethereum;
    if (ethereum) {
      try {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          // Switch to Base Sepolia if not already on it
          const chainId = await ethereum.request({ method: 'eth_chainId' });
          if (parseInt(chainId, 16) !== 84532) {
            try {
              await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x14a34' }], // 84532 in hex
              });
            } catch (switchError: any) {
              // This error code indicates that the chain has not been added to MetaMask.
              if (switchError.code === 4902) {
                await ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: '0x14a34',
                      chainName: 'Base Sepolia',
                      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                      rpcUrls: ['https://sepolia.base.org'],
                      blockExplorerUrls: ['https://sepolia.basescan.org'],
                    },
                  ],
                });
              }
            }
          }
          setWalletAddress(accounts[0]);
          localStorage.setItem('integrity_wallet_connected', accounts[0]);
          addToast('success', 'Wallet connected to Base Sepolia');
        }
      } catch (err: any) {
        addToast('error', `Wallet connection failed: ${err.message}`);
      }
    } else {
      addToast('error', 'Web3 wallet not detected');
    }
  }, [addToast]);

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      addToast('success', 'Authenticated with Google successfully');
    } catch (err: any) {
      addToast('error', `Authentication failed: ${err.message}`);
    }
  }, [addToast]);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      addToast('info', 'Signed out from Google');
    } catch (err: any) {
      addToast('error', `Sign out failed: ${err.message}`);
    }
  }, [addToast]);

  useEffect(() => {
    const savedWallet = localStorage.getItem('integrity_wallet_connected');
    if (savedWallet) {
      setWalletAddress(savedWallet);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const fetchedAgents = await api.getAgents();
      
      let allAgents = (fetchedAgents || []).map((a: any) => ({
        ...a,
        alias: a.alias || a.metadata?.alias || 'Unnamed',
        verification_tier: a.verification_tier || a.metadata?.verification_tier || 1,
        grounding_score: a.grounding_score || a.metadata?.grounding_score || 0,
        staked_itk: a.staked_itk || a.metadata?.staked_amount_itk || 0,
        last_active: a.last_active || a.last_active_at || new Date().toISOString()
      }));
      
      const currentAddr = selectedAgentAddr || (allAgents.length > 0 ? allAgents[0].eth_address : null);
      if (currentAddr) {
        try {
          const credit = await api.getCreditProfile(currentAddr);
          allAgents = allAgents.map(a => a.eth_address === currentAddr ? { ...a, credit_profile: credit } : a);
        } catch (e) {
          console.warn("Credit profile fetch failed", e);
        }
      }

      if (walletAddress) {
        try {
          const bal = await api.getWalletBalance(walletAddress);
          setWalletBalance(bal.balance_itk);
        } catch (e) {
          console.warn("Wallet balance fetch failed", e);
        }
      }

      setAgents(allAgents);
      setIsBackendOffline(false);
      
      if (!selectedAgentAddr && allAgents.length > 0) {
        setSelectedAgentAddr(allAgents[0].eth_address);
      }
    } catch {
      setIsBackendOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAgentAddr, walletAddress]);


  useEffect(() => {
    let mounted = true;
    const load = async () => {
       setIsLoading(true);
       await fetchData();
       if (!mounted) return;
    };
    load();
    const interval = setInterval(fetchData, 15000);
    
    // Set up SSE for real-time telemetry stats
    const unsubscribeStats = api.subscribeToMetrics((data) => {
      setStats(data);
    });
    
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as TabId;
      const validTabs: TabId[] = ['telemetry', 'identity', 'ledger', 'zk', 'factory', 'compliance', 'shield', 'oracle', 'credit', 'governance', 'markets', 'reasoning', 'diagnostics', 'staking', 'stability', 'wallet'];
      if (validTabs.includes(hash)) setActiveTabState(hash);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      mounted = false;
      clearInterval(interval);
      unsubscribeStats();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [fetchData]);

  const selectedAgent = agents.find(a => a.eth_address === selectedAgentAddr) || null;

  return (
    <DashboardContext.Provider value={{
      agents,
      selectedAgent,
      stats,
      walletAddress,
      walletBalance,
      activeTab,
      isLoading,
      isBackendOffline,
      toasts,
      user,
      selectAgent: setSelectedAgentAddr,
      setActiveTab,
      connectWallet,
      signInWithGoogle,
      signOut,
      fetchData,
      addToast,
      removeToast
    }}>
      {children}
    </DashboardContext.Provider>
  );
}
