import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import type { Agent, ProtocolStats, TabId } from '../types';
import { DashboardContext } from './useDashboard';
import type { ToastMessage } from './useDashboard';

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentAddr, setSelectedAgentAddr] = useState<string | null>(null);
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendOffline, setIsBackendOffline] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const toastCounter = useRef(0);
  
  const [activeTab, setActiveTabState] = useState<TabId>(() => {
    const hash = window.location.hash.replace('#', '') as TabId;
    const validTabs: TabId[] = ['telemetry', 'identity', 'ledger', 'zk', 'factory', 'compliance', 'shield', 'oracle', 'credit', 'governance', 'markets', 'advanced', 'staking', 'stability', 'wallet'];
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
          setWalletAddress(accounts[0]);
          addToast('success', 'Wallet connected');
        }
      } catch {
        addToast('error', 'Wallet connection failed');
      }
    } else {
      addToast('error', 'MetaMask not detected');
    }
  }, [addToast]);

  const fetchData = useCallback(async () => {
    try {
      const [fetchedAgents, fetchedStats] = await Promise.all([
        api.getAgents(),
        api.getProtocolStats()
      ]);
      
      let allAgents = fetchedAgents || [];
      
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
      setStats(fetchedStats || null);
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
    
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as TabId;
      const validTabs: TabId[] = ['telemetry', 'identity', 'ledger', 'zk', 'factory', 'compliance', 'shield', 'oracle', 'credit', 'governance', 'markets', 'advanced', 'staking', 'stability', 'wallet'];
      if (validTabs.includes(hash)) setActiveTabState(hash);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      mounted = false;
      clearInterval(interval);
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
      selectAgent: setSelectedAgentAddr,
      setActiveTab,
      connectWallet,
      fetchData,
      addToast,
      removeToast
    }}>
      {children}
    </DashboardContext.Provider>
  );
}
