import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import type { Agent, ProtocolStats, TabId } from '../types';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface DashboardContextType {
  agents: Agent[];
  selectedAgent: Agent | null;
  stats: ProtocolStats | null;
  walletAddress: string | null;
  walletBalance: number;
  activeTab: TabId;
  isLoading: boolean;
  isBackendOffline: boolean;
  toasts: ToastMessage[];
  
  selectAgent: (address: string) => void;
  setActiveTab: (tab: TabId) => void;
  connectWallet: () => Promise<void>;
  fetchData: () => Promise<void>;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentAddr, setSelectedAgentAddr] = useState<string | null>(null);
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendOffline, setIsBackendOffline] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const [activeTab, setActiveTabState] = useState<TabId>(() => {
    const hash = window.location.hash.replace('#', '') as TabId;
    const validTabs: TabId[] = ['telemetry', 'identity', 'ledger', 'zk', 'factory', 'compliance', 'credit', 'governance', 'markets', 'advanced', 'staking', 'stability', 'wallet'];
    return validTabs.includes(hash) ? hash : 'telemetry';
  });

  const setActiveTab = (tab: TabId) => {
    setActiveTabState(tab);
    window.location.hash = tab;
  };

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          addToast('success', 'Wallet connected');
        }
      } catch (err) {
        addToast('error', 'Wallet connection failed');
      }
    } else {
      addToast('error', 'MetaMask not detected');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedAgents, fetchedStats] = await Promise.all([
        api.getAgents(),
        api.getProtocolStats()
      ]);
      
      let allAgents = fetchedAgents || [];
      
      // If an agent is selected, enrich it with credit profile
      const currentAddr = selectedAgentAddr || (allAgents.length > 0 ? allAgents[0].eth_address : null);
      if (currentAddr) {
        try {
          const credit = await api.getCreditProfile(currentAddr);
          allAgents = allAgents.map(a => a.eth_address === currentAddr ? { ...a, credit_profile: credit } : a);
        } catch (e) {
          console.warn("Credit profile fetch failed", e);
        }
      }

      // Fetch wallet balance if connected
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
    } catch (error) {
      setIsBackendOffline(true);
      // Fail silently without breaking the UI loop
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as TabId;
      const validTabs: TabId[] = ['telemetry', 'identity', 'ledger', 'zk', 'factory', 'compliance', 'credit', 'governance', 'markets', 'advanced', 'staking', 'stability', 'wallet'];
      if (validTabs.includes(hash)) setActiveTabState(hash);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

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

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
