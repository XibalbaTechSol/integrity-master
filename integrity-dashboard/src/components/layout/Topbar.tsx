import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Shield, Wallet, Server, RefreshCw, AlertTriangle } from 'lucide-react';

export function Topbar() {
  const { walletAddress, connectWallet, fetchData, isBackendOffline } = useDashboard();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Shield size={20} color="var(--gold)" />
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Integrity Command Center
          </h1>
          <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--gold)', letterSpacing: '0.1em' }}>
            ORACLE REPUTATION NETWORK v9.0
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        {isBackendOffline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--danger-dim)', color: 'var(--danger)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600 }}>
            <AlertTriangle size={14} /> ORACLE DATABASE OFFLINE
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: isBackendOffline ? 'var(--danger)' : 'var(--success)' }}>
          <Server size={14} /> {isBackendOffline ? 'DISCONNECTED' : 'DATABASE ONLINE'}
        </div>

        <button className="btn btn-ghost" onClick={handleRefresh} disabled={isRefreshing} style={{ padding: '4px 8px' }}>
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} /> Sync
        </button>

        <button 
          className={`btn ${walletAddress ? 'btn-success' : 'btn-primary'}`} 
          onClick={connectWallet}
          style={{ minWidth: '140px' }}
        >
          <Wallet size={16} />
          {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : 'Connect Wallet'}
        </button>
      </div>
    </div>
  );
}
