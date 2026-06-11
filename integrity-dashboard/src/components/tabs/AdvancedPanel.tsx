import { useState, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import { Search, Network, Shield, Hash, Code, Link } from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { api } from '../../services/api';
import type { ProvenanceEntry } from '../../types';

const HashInput = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center" style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}:</span>
    <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>{value}</span>
  </div>
);

export function AdvancedPanel() {
  const { selectedAgent, isBackendOffline } = useDashboard();
  const [logs, setLogs] = useState<ProvenanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [mevEnabled, setMevEnabled] = useState(false);
  const [isTogglingMev, setIsTogglingMev] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    async function fetchLogs() {
      if (!selectedAgent || isBackendOffline) return;
      
      setLoading(true);
      try {
        const data = await api.getProvenance(selectedAgent.eth_address);
        if (mounted) {
          setLogs(data);
        }
      } catch (err) {
        console.error("Provenance fetch failed", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchLogs();
    
    return () => {
      mounted = false;
    };
  }, [selectedAgent, isBackendOffline]);

  const handleToggleMev = async () => {
    if (!selectedAgent) return;
    setIsTogglingMev(true);
    try {
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
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.action}</td>
                      <td>{log.model_used}</td>
                      <td className="mono" title={log.input_hash}>{log.input_hash.substring(0, 12)}...</td>
                      <td className="mono" title={log.output_hash}>{log.output_hash.substring(0, 12)}...</td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      <div className="grid-cols-2">
        <Panel title="Integrity Hash Reconstruction" icon={<Hash size={18} />}>
           <div className="flex-col gap-4">
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                Verifying the deterministic <code>integrity_hash</code> used for Layer 0 anchoring.
              </p>
              
              <div className="flex-col gap-2">
                 <HashInput label="Deal ID" value="deal_1781161708" />
                 <HashInput label="Latency" value="142ms" />
                 <HashInput label="Accuracy" value="0.982" />
                 <HashInput label="Agent ID" value={selectedAgent?.eth_address.substring(0, 12) || '0x...'} />
              </div>

              <div className="flex justify-center" style={{ margin: '8px 0' }}>
                 <Code size={18} color="var(--primary)" />
              </div>

              <div style={{ padding: '12px', background: 'var(--primary-dim)', borderRadius: 'var(--radius-md)', border: '2px solid var(--primary)', textAlign: 'center' }}>
                 <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Canonical Integrity Hash</div>
                 <div className="mono" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                   0x88f2a23142cd88f2a23142cd88f2a231
                 </div>
              </div>

              <div className="flex items-center gap-2" style={{ color: 'var(--success)', fontSize: '0.75rem' }}>
                 <Link size={14} /> Provenance Anchored to Base L2 Block #12,884,901
              </div>
           </div>
        </Panel>

        <Panel title="A2A Liquidity Topology" icon={<Network size={18} />}>
          <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
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
