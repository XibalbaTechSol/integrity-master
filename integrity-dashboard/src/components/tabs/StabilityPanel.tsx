import { useState, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import { BarChart2, Globe, ShieldCheck, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';
import { useDashboard } from '../../context/DashboardContext';
import { api } from '../../services/api';

export function StabilityPanel() {
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const { selectedAgent, addToast } = useDashboard();

  useEffect(() => {
    fetchBenchmarks();
  }, []);

  const fetchBenchmarks = async () => {
    setLoading(true);
    try {
      const data = await api.getBenchmarks();
      setBenchmarks(data);
    } catch (err) {
      console.error('Failed to fetch benchmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAudit = async () => {
    if (!selectedAgent) {
      addToast('info', 'Please select an agent first');
      return;
    }
    
    setIsAuditing(true);
    try {
      await api.requestAudit(selectedAgent.eth_address, 'AUTOMATED');
      addToast('success', 'Institutional certification audit initialized');
    } catch (err: any) {
      addToast('error', `Audit request failed: ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const getStatus = (stability: number, grounding: number) => {
    if (stability >= 0.95 && grounding >= 0.95) return 'certified';
    if (stability >= 0.90 && grounding >= 0.90) return 'pending';
    return 'warning';
  };

  return (
    <div className="flex-col gap-6">
      <Panel 
        title="Stability Leaderboard" 
        icon={<BarChart2 size={18} />}
        action={
          <button className="btn btn-icon" onClick={fetchBenchmarks} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        }
      >
        <div className="flex-col gap-4">
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>
            Public ranking of LLM providers by performance variance (Entropy) and grounding fidelity.
            Certified providers maintain <span style={{ color: 'var(--primary)', fontWeight: 600 }}>95%+ stability</span> over 30 days.
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Model / Provider</th>
                  <th>Simulated AIS</th>
                  <th>Stability (1-E)</th>
                  <th>Grounding</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Fetching live stability metrics...</td></tr>
                ) : benchmarks.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No benchmark data available. Oracle is accumulating telemetry.</td></tr>
                ) : (
                  benchmarks.map((p, i) => {
                    const stabilityPct = (p.stability_metric * 100).toFixed(1);
                    const groundingPct = (p.grounding_metric * 100).toFixed(1);
                    return (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.model_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.provider_name}</div>
                        </td>
                        <td className="mono" style={{ color: 'var(--primary)', fontWeight: 600 }}>{p.simulated_ais}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div style={{ width: '60px', height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${stabilityPct}%`, height: '100%', background: 'var(--success)' }}></div>
                            </div>
                            <span className="mono" style={{ fontSize: '0.75rem' }}>{stabilityPct}%</span>
                          </div>
                        </td>
                        <td className="mono" style={{ fontSize: '0.875rem' }}>{groundingPct}%</td>
                        <td><StatusBadge status={getStatus(p.stability_metric, p.grounding_metric)} /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      <div className="grid-cols-2">
        <Panel title="Regional Performance" icon={<Globe size={18} />}>
          <div className="flex-col gap-4">
            <div className="flex justify-between items-center" style={{ fontSize: '0.875rem' }}>
              <span>US-East (N. Virginia)</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>12ms avg.</span>
            </div>
            <div className="flex justify-between items-center" style={{ fontSize: '0.875rem' }}>
              <span>EU-Central (Frankfurt)</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>18ms avg.</span>
            </div>
            <div className="flex justify-between items-center" style={{ fontSize: '0.875rem' }}>
              <span>AP-Northeast (Tokyo)</span>
              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>45ms avg.</span>
            </div>
            
            <div style={{ height: '120px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--glass-border)' }}>
              <div className="text-muted" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
                <Globe size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <br />
                Latency Heatmap Visualization
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Certification Pipeline" icon={<ShieldCheck size={18} />}>
          <div className="flex-col gap-4">
            <div style={{ padding: 'var(--space-3)', background: 'var(--primary-dim)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>
                Apply for Institutional Certification
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                Requires 1M+ tokens processed via Xibalba Integrity Sockets and zero consensus violations.
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span style={{ fontSize: '0.875rem' }}>Active Audits</span>
              <span className="mono" style={{ fontWeight: 600 }}>12</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '0.875rem' }}>ZK-Verifiers Online</span>
              <span className="mono" style={{ fontWeight: 600 }}>8,421</span>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ marginTop: 'auto' }}
              onClick={handleStartAudit}
              disabled={isAuditing || !selectedAgent}
            >
              {isAuditing ? <RefreshCw className="animate-spin" size={16} /> : 'Start Certification Audit'}
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
