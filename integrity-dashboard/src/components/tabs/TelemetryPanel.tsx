import { useState, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { MetricCard } from '../shared/MetricCard';
import { Panel } from '../shared/Panel';
import { StatusBadge } from '../shared/StatusBadge';
import { 
  Users, Award, Coins, AlertTriangle, Cpu, Activity, 
  ExternalLink, Layers, ShieldCheck, Lock, RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../services/api';
import { IntegrityRadar } from '../shared/IntegrityRadar';

export function TelemetryPanel() {
  const { stats, selectedAgent, isLoading, fetchData, addToast } = useDashboard();
  
  const MOCK_CONTRACTS = [
    { contract_address: '0x1234567890abcdef1234567890abcdef12345678', contract_type: 'SLA', chain: 'base-sepolia', deployed_at: new Date(Date.now() - 864000000).toISOString(), status: 'active', revenue_generated: 1250.00, is_collateralized: true },
    { contract_address: '0xabcdef1234567890abcdef1234567890abcdef12', contract_type: 'RevenueShare', chain: 'ethereum', deployed_at: new Date(Date.now() - 432000000).toISOString(), status: 'active', revenue_generated: 450.75, is_collateralized: false },
  ];
  
  const ownedContracts = selectedAgent?.owned_contracts?.length ? selectedAgent.owned_contracts : MOCK_CONTRACTS;

  const [repHistory, setRepHistory] = useState<any[]>([]);
  
  // Telemetry form state
  const [contractValue, setContractValue] = useState('200');
  const [latency, setLatency] = useState('120');
  const [accuracy, setAccuracy] = useState('0.95');
  const [modelClass, setModelClass] = useState(selectedAgent?.model_class || 'gpt-4o');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedAgent) {
      api.getReputationHistory(selectedAgent.eth_address)
        .then(setRepHistory)
        .catch(() => {
          // Mock data fallback if backend is offline
          const mockRep = Array.from({ length: 30 }).map((_, i) => ({
            date: new Date(Date.now() - (29 - i) * 86400000).toISOString(),
            ais: Math.floor(Math.random() * 150) + (selectedAgent.current_ais - 50)
          }));
          setRepHistory(mockRep);
        });
      setModelClass(selectedAgent.model_class || 'gpt-4o');
    }
  }, [selectedAgent?.eth_address, selectedAgent?.current_ais]);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    
    setIsSubmitting(true);
    try {
      await api.reportTelemetry({
        agent_address: selectedAgent.eth_address,
        deal_id: 'deal_' + Math.random().toString(36).slice(2, 8),
        contract_value_intg: parseFloat(contractValue),
        latency_ms: parseInt(latency),
        accuracy_score: parseFloat(accuracy),
        tokens_processed: 50000,
        model_class: modelClass
      });
      addToast('success', 'Telemetry ingested and validated successfully');
      fetchData();
    } catch (err) {
      addToast('error', 'Failed to ingest telemetry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-col gap-6">
      <div className="grid-cols-4">
        <MetricCard 
          label={<><Users size={14} /> Active Agents</>}
          value={stats?.active_nodes ?? 0}
          subValue="Nodes reporting telemetry"
          progress={100}
          isLoading={isLoading}
        />
        <MetricCard 
          label={<><Award size={14} /> Network Avg AIS</>}
          value={stats?.aggregate_ais ?? 0}
          subValue="/ 1000 MAX"
          accentColor="var(--gold)"
          progress={(stats?.aggregate_ais ?? 0) / 10}
          isLoading={isLoading}
        />
        <MetricCard 
          label={<><Coins size={14} /> Total Staked ITK</>}
          value={(stats?.protocol_staked_itk ?? 0).toLocaleString()}
          subValue="Protocol TVL"
          accentColor="var(--success)"
          progress={80}
          isLoading={isLoading}
        />
        <MetricCard 
          label={<><AlertTriangle size={14} /> Active Disputes</>}
          value={stats?.active_disputes ?? 0}
          subValue="Pending arbitrations"
          accentColor="var(--violet)"
          progress={10}
          isLoading={isLoading}
        />
      </div>

      <div className="grid-cols-2">
        <div className="flex-col gap-6">
          <Panel title="Selected Agent Telemetry" icon={<Cpu size={18} />}>
            {!selectedAgent ? (
              <div className="text-muted">Select an agent from the roster</div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4" style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-dim)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700 }}>
                    {(selectedAgent.alias || selectedAgent.eth_address).substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{selectedAgent.alias || 'Unnamed Agent'}</h2>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedAgent.eth_address}</div>
                  </div>
                  <StatusBadge ais={selectedAgent.current_ais} />
                </div>

                <IntegrityRadar agent={selectedAgent} />

                {selectedAgent.tee_verified && (
                  <div className="flex items-center gap-3" style={{ background: 'var(--primary-dim)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(34, 211, 238, 0.3)' }}>
                    <ShieldCheck size={20} color="var(--primary)" />
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>Hardware Enclave (TEE) Secure</div>
                      <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-primary)' }}>
                        {selectedAgent.tee_type} | {selectedAgent.tee_measurement?.substring(0, 16)}...
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </Panel>

          <Panel title="Owned Contracts Registry" icon={<Layers size={18} />}>
            {!selectedAgent || ownedContracts.length === 0 ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No contracts registered to this agent.</div>
            ) : (
              <div className="table-container" style={{ maxHeight: '250px' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Address</th>
                      <th>Revenue</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownedContracts.map(c => (
                      <tr key={c.contract_address}>
                        <td><StatusBadge status={c.contract_type} /></td>
                        <td className="mono flex items-center gap-2">
                          {c.contract_address.substring(0, 8)}...
                          <ExternalLink size={12} color="var(--primary)" />
                        </td>
                        <td style={{ color: 'var(--success)' }}>${c.revenue_generated}</td>
                        <td>
                          {c.is_collateralized ? (
                            <div className="flex items-center gap-1 tooltip-target" style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>
                              <Lock size={12} /> Locked
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Free</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <div className="flex-col gap-6">
          <Panel title="AIS Reputation History" icon={<Activity size={18} />}>
            <div style={{ width: '100%', height: '200px' }}>
              {repHistory.length > 0 ? (
                <ResponsiveContainer>
                  <LineChart data={repHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString()} stroke="var(--text-muted)" fontSize={10} />
                    <YAxis domain={['auto', 1000]} stroke="var(--text-muted)" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}
                      labelFormatter={(v) => new Date(v).toLocaleString()}
                    />
                    <Line type="monotone" dataKey="ais" stroke="var(--primary)" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: 'var(--primary)' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="skeleton" style={{ width: '100%', height: '100%' }} />
              )}
            </div>
          </Panel>

          <Panel title="Manual Ingestion" icon={<Activity size={18} />}>
            <form onSubmit={handleReport} className="flex-col gap-4">
              <div className="grid-cols-2">
                <div>
                  <label className="form-label">ITK Value</label>
                  <input type="number" className="input" value={contractValue} onChange={e => setContractValue(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Latency (ms)</label>
                  <input type="number" className="input" value={latency} onChange={e => setLatency(e.target.value)} required />
                </div>
              </div>
              <div className="grid-cols-2">
                <div>
                  <label className="form-label">Accuracy (0.0-1.0)</label>
                  <input type="number" step="0.01" className="input" value={accuracy} onChange={e => setAccuracy(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Model Class</label>
                  <input type="text" className="input" value={modelClass} onChange={e => setModelClass(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || !selectedAgent}>
                {isSubmitting ? <span className="animate-spin"><RefreshCw size={16}/></span> : <ShieldCheck size={16} />}
                Validate & Submit
              </button>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}
