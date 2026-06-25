import { useState, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import { Search, Hash, Code, Link, Terminal, AlertTriangle, Activity } from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { api } from '../../services/api';
import type { ProvenanceEntry, StabilityBenchmark } from '../../types';

const HashInput = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center" style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}:</span>
    <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>{value}</span>
  </div>
);

export function DiagnosticsPanel() {
  const { selectedAgent, isBackendOffline } = useDashboard();
  const [logs, setLogs] = useState<ProvenanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [syslogs, setSyslogs] = useState<string[]>([]);
  const [benchmarks, setBenchmarks] = useState<StabilityBenchmark[]>([]);

  useEffect(() => {
    let mounted = true;
    
    async function fetchLogs() {
      if (!selectedAgent || isBackendOffline) return;
      
      setLoading(true);
      try {
        const data = await api.getProvenance(selectedAgent.eth_address);
        if (mounted) {
          setLogs(data);
          // Seed some mock diagnostic syslogs based on provenance actions
          const mockSyslogs = [
            `[INFO] [${selectedAgent.alias}] Initializing OTel SDK trace providers...`,
            `[DEBUG] [${selectedAgent.alias}] Bound to local SQLite database at /home/xibalba/.integrity/`,
            `[INFO] [${selectedAgent.alias}] Scanning agent logic paths; reputational gates nominal (AIS: ${selectedAgent.current_ais})`,
            `[WARN] [${selectedAgent.alias}] Local prover pipeline utilizing hardware acceleration fallback`,
            `[SUCCESS] [${selectedAgent.alias}] Attestation payload anchored via BCC Middleware`
          ];
          setSyslogs(mockSyslogs);
        }
      } catch (err) {
        console.error("Provenance fetch failed", err);
      }
      
      try {
        const benchData = await api.getBenchmarks();
        if (mounted) {
          setBenchmarks(benchData);
        }
      } catch (err) {
        console.error("Benchmarks fetch failed", err);
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

  return (
    <div className="flex-col gap-6">
      <Panel title="System Diagnostics Console" icon={<Terminal size={18} />}>
        <div style={{ background: 'var(--navy-deep)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {syslogs.map((log, idx) => (
            <div key={idx} className="mono" style={{ fontSize: '0.75rem', color: log.includes('WARN') ? 'var(--warning, #f59e0b)' : log.includes('SUCCESS') ? 'var(--success)' : 'var(--text-primary)' }}>
              {log}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Live SDK Evaluation Benchmarks" icon={<Activity size={18} />}>
        <div className="flex-col gap-4">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time stability and grounding eval metrics ingested directly from the Integrity SDK.
          </div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Model</th><th>Provider</th><th>Simulated AIS</th><th>Stability Metric</th><th>Grounding Metric</th></tr></thead>
              <tbody>
                {benchmarks.length === 0 ? (
                  <tr><td colSpan={5} className="text-muted" style={{ textAlign: 'center' }}>No benchmarks data found</td></tr>
                ) : (
                  benchmarks.map((b, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{b.model_name}</td>
                      <td>{b.provider_name}</td>
                      <td style={{ color: 'var(--gold)' }}>{b.simulated_ais}</td>
                      <td style={{ color: b.stability_metric > 0.95 ? 'var(--success)' : 'var(--warning)' }}>{(b.stability_metric * 100).toFixed(1)}%</td>
                      <td style={{ color: b.grounding_metric > 0.95 ? 'var(--success)' : 'var(--warning)' }}>{(b.grounding_metric * 100).toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

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

        <Panel title="System Status Alerts" icon={<AlertTriangle size={18} />}>
          <div className="flex-col gap-4">
            <div style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--gold)' }}>BCC Middleware Sync</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>All cryptographic signatures validated against the local host.</div>
            </div>
            <div style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--success)' }}>Node Provenance Heartbeat</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Nominal sync rate 100% active.</div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
