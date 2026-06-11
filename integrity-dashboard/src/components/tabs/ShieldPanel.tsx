import { useState, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import { Shield, FileText, Activity, CheckCircle } from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { StatusBadge } from '../shared/StatusBadge';

interface BAA {
  id: string;
  coveredEntity: string;
  status: string;
  signedAt: string;
  stake: string;
}

export function ShieldPanel() {
  const { selectedAgent } = useDashboard();
  const [baas, setBaas] = useState<BAA[]>([]);

  const fetchBAAs = async () => {
    try {
      // Assuming this endpoint exists or we can mock it
      // const data = await api.getBAAs(selectedAgent.eth_address);
      setBaas([
        { id: 'baa_001', coveredEntity: '0xHospital_A', status: 'active', signedAt: '2026-05-12', stake: '5000 ITK' },
        { id: 'baa_002', coveredEntity: '0xClinic_B', status: 'pending', signedAt: '-', stake: '2500 ITK' }
      ]);
    } catch (err) {
      console.error('Failed to fetch BAAs:', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (selectedAgent) {
      const load = async () => {
        if (mounted) {
          await fetchBAAs();
        }
      };
      load();
    }
    return () => {
      mounted = false;
    };
  }, [selectedAgent]);

  return (
    <div className="flex-col gap-6">
      <div className="grid-cols-2">
        <Panel title="Xibalba Shield: Smart BAA Management" icon={<Shield size={18} />}>
          <div className="flex-col gap-4">
            <div className="text-muted" style={{ fontSize: '0.875rem' }}>
              Manage cryptographically-bound Business Associate Agreements (BAAs).
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Entity</th>
                    <th>Status</th>
                    <th>Staked</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {baas.map(baa => (
                    <tr key={baa.id}>
                      <td className="mono">{baa.coveredEntity}</td>
                      <td><StatusBadge status={baa.status} /></td>
                      <td>{baa.stake}</td>
                      <td>
                        <button className="btn" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                          View Legal
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="btn btn-primary">
              <FileText size={16} /> Propose New Smart BAA
            </button>
          </div>
        </Panel>

        <Panel title="HIPAA Technical Safeguards" icon={<Shield size={18} />}>
          <div className="flex-col gap-4">
            <div className="flex items-center justify-between" style={{ padding: 'var(--space-3)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
              <div className="flex-col">
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>PHI Edge-Blinding</span>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>HMAC-SHA256 Anonymous Pointers</span>
              </div>
              <CheckCircle size={20} color="var(--success)" />
            </div>

            <div className="flex items-center justify-between" style={{ padding: 'var(--space-3)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
              <div className="flex-col">
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Intent Locking (BCC)</span>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Pre-execution compliance gating</span>
              </div>
              <CheckCircle size={20} color="var(--success)" />
            </div>

            <div className="flex items-center justify-between" style={{ padding: 'var(--space-3)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
              <div className="flex-col">
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Hardware Isolation</span>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>FIPS 140-2 Level 3 Keys</span>
              </div>
              <CheckCircle size={20} color="var(--success)" />
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Shield Telemetry: PHI Prevention Logs" icon={<Activity size={18} />}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Resource</th>
                <th>BCC Result</th>
                <th>Security Level</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>14:22:01</td>
                <td>EHR Query</td>
                <td className="mono">ptr:0x88...f2</td>
                <td><span style={{ color: 'var(--success)' }}>PASSED</span></td>
                <td><StatusBadge status="high" /></td>
              </tr>
              <tr>
                <td>14:20:45</td>
                <td>Diagnosis Generation</td>
                <td className="mono">0xModel_GPT4_HIPAA</td>
                <td><span style={{ color: 'var(--success)' }}>PASSED</span></td>
                <td><StatusBadge status="high" /></td>
              </tr>
              <tr style={{ opacity: 0.6 }}>
                <td>12:05:12</td>
                <td>Unauthorized SSN Access</td>
                <td className="mono">0xPayload_Unencrypted</td>
                <td><span style={{ color: 'var(--error)' }}>BLOCKED</span></td>
                <td><StatusBadge status="critical" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
