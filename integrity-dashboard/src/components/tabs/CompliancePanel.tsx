import { Panel } from '../shared/Panel';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export function CompliancePanel() {
  const { selectedAgent } = useDashboard();
  
  const mockScore = selectedAgent?.compliance_score || 98;
  const mockEvents = [
    { id: 1, type: 'success', text: 'Automated KYC refresh completed', time: '2 hours ago' },
    { id: 2, type: 'info', text: 'SLA Contract audited by TEE Enclave', time: '5 hours ago' },
    { id: 3, type: 'success', text: 'Risk parameters aligned with ISO-27001', time: '1 day ago' },
    { id: 4, type: 'warning', text: 'Minor drift in jurisdictional bounds detected', time: '3 days ago' },
  ];

  return (
    <div className="grid-cols-2">
      <Panel title="Compliance Scorecard" icon={<ShieldCheck size={18} />}>
        {!selectedAgent ? (
          <div className="text-muted">Select an agent</div>
        ) : (
          <div className="flex-col gap-6">
            <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
              <div style={{ fontSize: '4.5rem', fontWeight: 800, color: 'var(--success)', lineHeight: 1, textShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
                {mockScore}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '8px' }}>Overall Rating</div>
            </div>
            
            <div className="flex-col gap-3">
              <div className="flex items-center justify-between" style={{ padding: 'var(--space-3)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <span className="text-muted">KYC Status</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Verified Tier {selectedAgent.verification_tier}</span>
              </div>
              <div className="flex items-center justify-between" style={{ padding: 'var(--space-3)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <span className="text-muted">AML Risk</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Low</span>
              </div>
              <div className="flex items-center justify-between" style={{ padding: 'var(--space-3)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <span className="text-muted">Jurisdictions</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>US, EU, SG</span>
              </div>
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Audit Trail & Alerts" icon={<AlertTriangle size={18} />}>
        <div className="flex-col gap-3">
          {mockEvents.map(event => (
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
