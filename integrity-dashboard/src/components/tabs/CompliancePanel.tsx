import { useState, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import { ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { api } from '../../services/api';

export function CompliancePanel() {
  const { selectedAgent } = useDashboard();
  const [score, setScore] = useState(98);
  const [events, setEvents] = useState([
    { id: 1, type: 'success', text: 'Automated KYC refresh completed', time: '2 hours ago' },
    { id: 2, type: 'info', text: 'SLA Contract audited by TEE Enclave', time: '5 hours ago' },
    { id: 3, type: 'success', text: 'Risk parameters aligned with ISO-27001', time: '1 day ago' },
    { id: 4, type: 'warning', text: 'Minor drift in jurisdictional bounds detected', time: '3 days ago' },
  ]);
  const [loading, setLoading] = useState(false);

  const fetchComplianceData = async () => {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      // In a real app, this would be a specific endpoint
      // const data = await api.getComplianceData(selectedAgent.eth_address);
      // For now, we'll just use the agent's compliance_score if it exists
      if (selectedAgent.compliance_score) {
        setScore(selectedAgent.compliance_score);
      }
    } catch (err) {
      console.error('Failed to fetch compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceData();
  }, [selectedAgent]);

  return (
    <div className="grid-cols-2">
      <Panel 
        title="Compliance Scorecard" 
        icon={<ShieldCheck size={18} />}
        action={
          <button className="btn btn-icon" onClick={fetchComplianceData} disabled={loading} aria-label="Refresh compliance data">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        }
      >
        {!selectedAgent ? (
          <div className="text-muted">Select an agent</div>
        ) : (
          <>
            <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
              <div style={{ fontSize: '4.5rem', fontWeight: 800, color: 'var(--success)', lineHeight: 1, textShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
                {score}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '8px' }}>Overall Rating</div>
            </div>
            
            <div className="flex-col gap-3">
              {/* List events */}
              {events.map(event => (
                 <div key={event.id} className="flex items-center justify-between" style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', fontSize: '0.75rem' }}>
                    <span className="text-muted">{event.text}</span>
                    <span style={{ color: event.type === 'warning' ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>{event.time}</span>
                 </div>
              ))}
            </div>
          </>
        )}
      </Panel>

      <Panel title="Audit Trail & Alerts" icon={<AlertTriangle size={18} />}>
        <div className="flex-col gap-3">
          {events.map(event => (
            <div key={event.id} style={{ 
              padding: 'var(--space-4)', 
              background: 'var(--bg-card)', 
              borderRadius: 'var(--radius-sm)', 
              borderLeft: `4px solid ${
                event.type === 'success' ? 'var(--success)' : 
                event.type === 'warning' ? 'var(--warning)' : 'var(--primary)'
              }` 
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>{event.text}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{event.time}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
