import { useDashboard } from '../../context/DashboardContext';
import type { TabId } from '../../types';
import { 
  Activity, Users, Layers, ShieldCheck, Hammer, 
  Coins, Shield, ShoppingCart, BookOpen, Lock, BarChart2, Wallet 
} from 'lucide-react';

const tabs: { id: TabId, label: string, icon: React.ReactNode }[] = [
  { id: 'telemetry', label: 'Telemetry', icon: <Activity size={16} /> },
  { id: 'identity', label: 'Identity & DID', icon: <Users size={16} /> },
  { id: 'ledger', label: 'Smart Ledger', icon: <Layers size={16} /> },
  { id: 'zk', label: 'ZK Prover', icon: <ShieldCheck size={16} /> },
  { id: 'factory', label: 'Contract Factory', icon: <Hammer size={16} /> },
  { id: 'credit', label: 'Credit & Loans', icon: <Coins size={16} /> },
  { id: 'markets', label: 'A2A Markets', icon: <ShoppingCart size={16} /> },
  { id: 'staking', label: 'Staking', icon: <Lock size={16} /> },
  { id: 'stability', label: 'Stability Hub', icon: <BarChart2 size={16} /> },
  { id: 'governance', label: 'Governance', icon: <Shield size={16} /> },
  { id: 'compliance', label: 'Compliance', icon: <ShieldCheck size={16} /> },
  { id: 'wallet', label: 'Wallet', icon: <Wallet size={16} /> },
  { id: 'advanced', label: 'Advanced', icon: <BookOpen size={16} /> },
];

export function TabNav() {
  const { activeTab, setActiveTab } = useDashboard();

  return (
    <nav className="tab-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
