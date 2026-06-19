import { useState, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import { Shield, FileText, Activity, CheckCircle, AlertTriangle, Search, Clock, ShieldAlert, Gavel, Trash2 } from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { StatusBadge } from '../shared/StatusBadge';
import { api } from '../../services/api';
import { ProposeBAAModal } from './ProposeBAAModal';

interface BAA {
  id: string;
  coveredEntity: string;
  businessAssociate: string;
  status: string;
  signedAt: string;
  stakedITK: string;
  documentHash: string;
}

interface Interaction {
  id: string;
  time: string;
  action: string;
  resource: string;
  agent: string;
  baaId: string;
  status: 'PASSED' | 'BLOCKED';
}

interface Violation {
  id: string;
  time: string;
  agent: string;
  baaId: string;
  type: string;
  detail: string;
  status: string;
}

export function ShieldPanel() {
  const { selectedAgent, addToast } = useDashboard();
  const [baas, setBaas] = useState<BAA[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [baaData, intData, violationData] = await Promise.all([
        api.getBAAs(),
        api.getShieldInteractions(),
        api.getComplianceReviewQueue()
      ]);
      setBaas(baaData || []);
      setInteractions(intData || []);
      setViolations(violationData || []);
    } catch (err: any) {
      addToast('error', `Shield sync failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedAgent]);

  const handleResolveViolation = async (id: string, action: 'finalize_slash' | 'dismiss') => {
    try {
      await api.resolveComplianceViolation(id, action);
      addToast('success', action === 'finalize_slash' ? 'ITK Stake Slashed Successfully' : 'Violation Dismissed');
      fetchData();
    } catch (err: any) {
      addToast('error', `Resolution failed: ${err.message}`);
    }
  };

  return (
    <div className="flex-col gap-6">
      <div className="grid-cols-2">
        <Panel 
          title="Smart BAA Registry" 
          icon={<Shield size={18} color="var(--gold)" />}
          action={
             <button className="btn btn-primary btn-sm" onClick={() => setIsProposeModalOpen(true)}>
               <FileText size={14} style={{ marginRight: '6px' }} /> Propose New
             </button>
          }
        >
          <div className="flex-col gap-4">
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>
              Cryptographically-bound Business Associate Agreements (BAAs) mapping AI Agents to Healthcare Providers.
            </div>

            <div className="table-container">
              <table className="table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Assoc (Agent)</th>
                    <th>Status</th>
                    <th>Stake</th>
                    <th>Doc Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {baas.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No BAAs found.</td></tr>
                  ) : (
                    baas.map(baa => (
                      <tr key={baa.id}>
                        <td className="mono">{baa.businessAssociate.substring(0, 10)}...</td>
                        <td><StatusBadge status={baa.status} /></td>
                        <td className="mono" style={{ color: 'var(--gold)' }}>{baa.stakedITK}</td>
                        <td className="mono" title={baa.documentHash}>{baa.documentHash.substring(0, 8)}...</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>

        <Panel title="HIPAA Gateway Controls" icon={<ShieldAlert size={18} color="var(--gold)" />}>
          <div className="flex-col gap-4">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
               Pre-execution filters enforced by the BCC (Boundary Control Concept) Middleware.
            </div>

            <div className="flex items-center justify-between" style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gold-muted)' }}>
              <div className="flex-col">
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>PHI Edge-Blinding</span>
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>HMAC-SHA256 Anonymous Pointers</span>
              </div>
              <CheckCircle size={18} color="var(--success)" />
            </div>

            <div className="flex items-center justify-between" style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gold-muted)' }}>
              <div className="flex-col">
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Intent Locking (BCC)</span>
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>Prompt-level compliance gating</span>
              </div>
              <CheckCircle size={18} color="var(--success)" />
            </div>

            <div className="flex items-center justify-between" style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gold-muted)' }}>
              <div className="flex-col">
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Parametric Liability</span>
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>Automated ITK Slashing logic active</span>
              </div>
              <CheckCircle size={18} color="var(--success)" />
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid-cols-3" style={{ gap: 'var(--space-6)' }}>
         <div className="col-span-2">
            <Panel 
              title="Medical Record Interaction Logs" 
              icon={<Activity size={18} color="var(--gold)" />}
              action={
                <button className="btn btn-outline btn-sm" onClick={() => {
                  const csv = "Time,Action,Agent,BAA_Ref,Result\n" + interactions.map(i => `${i.time},${i.action},${i.agent},${i.baaId},${i.status}`).join("\n");
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'medical_interactions.csv';
                  a.click();
                }}>
                  Export Logs
                </button>
              }
            >
              <div className="table-container">
                <table className="table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Action</th>
                      <th>Agent</th>
                      <th>BAA Ref</th>
                      <th>BCC Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interactions.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Scanning for gateway activity...</td></tr>
                    ) : (
                      interactions.map(int => (
                        <tr key={int.id}>
                          <td className="mono text-muted">{int.time}</td>
                          <td style={{ fontWeight: 600 }}>{int.action}</td>
                          <td className="mono">{int.agent}</td>
                          <td className="mono" style={{ color: 'var(--gold)' }}>{int.baaId}</td>
                          <td>
                             <span style={{ 
                               fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px',
                               background: int.status === 'PASSED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                               color: int.status === 'PASSED' ? 'var(--success)' : 'var(--danger)',
                               border: `1px solid ${int.status === 'PASSED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                               fontWeight: 700
                             }}>
                               {int.status}
                             </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
         </div>

         <div className="col-span-1">
            <Panel title="Compliance Review Queue" icon={<AlertTriangle size={18} color="var(--danger)" />}>
               <div className="flex-col gap-4">
                  {violations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                       <CheckCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                       No pending violations for manual review.
                    </div>
                  ) : (
                    violations.map(v => (
                      <div key={v.id} style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                         <div className="flex justify-between items-start mb-3">
                            <div className="flex-col">
                               <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--danger)' }}>{v.type.toUpperCase()}</span>
                               <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }} className="mono">{v.time} | {v.agent}</span>
                            </div>
                            <ShieldAlert size={16} color="var(--danger)" />
                         </div>
                         <p style={{ fontSize: '0.75rem', marginBottom: 'var(--space-4)', lineHeight: 1.4 }}>
                            {v.detail}
                         </p>
                         <div className="flex gap-2">
                            <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleResolveViolation(v.id, 'finalize_slash')}>
                               <Gavel size={14} style={{ marginRight: '6px' }} /> Slash Stake
                            </button>
                            <button className="btn btn-ghost btn-sm" style={{ flex: 1, border: '1px solid var(--border)' }} onClick={() => handleResolveViolation(v.id, 'dismiss')}>
                               <Trash2 size={14} style={{ marginRight: '6px' }} /> Dismiss
                            </button>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </Panel>
         </div>
      </div>

      <ProposeBAAModal 
        isOpen={isProposeModalOpen} 
        onClose={() => setIsProposeModalOpen(false)} 
        onSuccess={() => { setIsProposeModalOpen(false); fetchData(); }}
      />
    </div>
  );
}
