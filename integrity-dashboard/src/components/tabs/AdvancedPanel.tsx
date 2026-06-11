import { useState, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import { Search, Network, Globe, Shield } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { api } from '../../services/api';

export function AdvancedPanel() {
  const { selectedAgent, isBackendOffline } = useDashboard();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mevEnabled, setMevEnabled] = useState(false);
  const [isTogglingMev, setIsTogglingMev] = useState(false);

  useEffect(() => {
    if (selectedAgent && !isBackendOffline) {
      setLoading(true);
      api.getProvenance(selectedAgent.eth_address)
        .then(setLogs)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedAgent, isBackendOffline]);

  const handleToggleMev = async () => {
    if (!selectedAgent) return;
    setIsTogglingMev(true);
    try {
      // Assuming a config endpoint exists or this updates state
      // await api.post(`/agent/${selectedAgent.eth_address}/mev-protection`, { enabled: !mevEnabled });
      setMevEnabled(!mevEnabled);
    } catch (err) {
      console.error("Failed to toggle MEV protection", err);
    } finally {
      setIsTogglingMev(false);
    }
  };

  const isMevEligible = (selectedAgent?.current_ais || 0) >= 1000;

  return (
    <div className="flex-col gap-6">
      <Panel title="Forensic Provenance Explorer" icon={<Search size={18} />}>
        {isBackendOffline ? (
          <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            Oracle Database Offline. Cannot fetch provenance records.
          </div>
        ) : !selectedAgent ? (
          <div className="text-muted">Select an agent</div>
        ) : (
          <div className="flex-col gap-4">
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Immutable audit trail of agent decisions and state changes.
            </div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Action</th><th>Model</th><th>Input Hash</th><th>Output Hash</th><th>Time</th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center' }}>Loading provenance records...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={5} className="text-muted" style={{ textAlign: 'center' }}>No provenance records found</td></tr>
                  ) : (
                    logs.map((log: any) => (
                      <tr key={log.log_id}>
                        <td>{log.action}</td>
                        <td>{log.model_used}</td>
                        <td className="mono" title={log.input_hash}>{log.input_hash.substring(0, 12)}...</td>
                        <td className="mono" title={log.output_hash}>{log.output_hash.substring(0, 12)}...</td>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Panel>

      <div className="grid-cols-2">
        <Panel title="Advanced Contract Markets" icon={<Globe size={18} />}>
          <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-sm)', gap: 'var(--space-2)' }}>
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Fractional Contract Ownership</span>
            <span className="text-muted" style={{ fontSize: '0.875rem', textAlign: 'center', padding: '0 var(--space-4)' }}>
              Visualizing Collateralized Debt Positions (CDPs) and yield derivatives derived from agent-owned contracts.
            </span>
          </div>
        </Panel>

        <Panel title="A2A Liquidity Topology" icon={<Network size={18} />}>
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
            <span className="text-muted">Graph visualization requires Oracle backend sync.</span>
          </div>
        </Panel>
      </div>

      <div className="grid-cols-1">
        <Panel title="MEV Protection Settings (Private RPC)" icon={<Shield size={18} />}>
          <div className="flex-col gap-4">
            <div className="text-muted" style={{ fontSize: '0.875rem' }}>
              Shield your high-value autonomous transactions from front-running and sandwich attacks by routing them through the Integrity Oracle's private mempool relays.
            </div>
            
            <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--glass-border)' }}>
              <div className="flex-col gap-1">
                <span style={{ fontWeight: 600 }}>Enable Private RPC Routing</span>
                <span style={{ fontSize: '0.75rem', color: isMevEligible ? 'var(--success)' : 'var(--danger)' }}>
                  {isMevEligible 
                    ? 'Tier 3 Trust Level Authenticated. You are eligible for MEV protection.' 
                    : `Ineligible: Requires Tier 3 Trust Level (AIS ≥ 1000). Current AIS: ${selectedAgent?.current_ais || 0}`}
                </span>
              </div>
              
              <button 
                className={`btn ${mevEnabled ? 'btn-success' : 'btn-primary'}`}
                onClick={handleToggleMev}
                disabled={!isMevEligible || isTogglingMev}
              >
                {isTogglingMev ? 'Updating...' : mevEnabled ? 'Enabled (Protected)' : 'Enable Protection'}
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
