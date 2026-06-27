import { useState, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import { BrainCircuit, Wrench, FileEdit, AlertTriangle, ShieldCheck, Activity, ChevronDown, ChevronRight, Zap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../../constants';
import { useDashboard } from '../../context/useDashboard';

function HierarchicalStepNode({ step, idx }: { step: any; idx: number }) {
  const [isOpen, setIsOpen] = useState(false);

  // Determine children nodes based on step type
  const children = [];
  if (step.type === 'tool' || step.event_type === 'tool_call') {
    children.push({
      id: `${step.id || idx}-name`,
      label: 'Tool Method',
      value: step.name || step.tool_name,
      accent: 'var(--gold)',
    });
    if (step.args || step.arguments) {
      children.push({
        id: `${step.id || idx}-args`,
        label: 'Arguments',
        value: typeof step.args === 'string' ? step.args : JSON.stringify(step.args || step.arguments, null, 2),
        isMono: true,
      });
    }
  } else if (step.type === 'mutation' || step.event_type === 'file_mutation') {
    children.push({
      id: `${step.id || idx}-file`,
      label: 'Target Resource',
      value: step.file || step.file_path,
      accent: 'var(--info)',
    });
    if (step.diff) {
      children.push({
        id: `${step.id || idx}-diff`,
        label: 'Diff Output',
        value: step.diff,
        isMono: true,
        accent: 'var(--success)',
      });
    }
  } else if (step.type === 'thought' || step.event_type === 'thought') {
    if (step.message && step.message.length > 80) {
      children.push({
        id: `${step.id || idx}-detail`,
        label: 'Detailed Cognition Trace',
        value: step.message,
      });
    }
  } else if (step.type === 'alert' || step.event_type === 'error') {
    children.push({
      id: `${step.id || idx}-err`,
      label: 'Error Signature',
      value: step.message || step.error,
      accent: 'var(--danger)',
    });
  }

  const hasChildren = children.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div 
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        style={{
          padding: '12px',
          background: 'var(--bg-primary)',
          borderLeft: `3px solid ${
            step.type === 'thought' || step.event_type === 'thought' ? 'var(--accent)' :
            step.type === 'tool' || step.event_type === 'tool_call' ? 'var(--gold)' :
            step.type === 'mutation' || step.event_type === 'file_mutation' ? 'var(--info)' : 'var(--danger)'
          }`,
          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
          fontSize: '0.875rem',
          cursor: hasChildren ? 'pointer' : 'default',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => { if (hasChildren) e.currentTarget.style.background = 'var(--surface-hover)'; }}
        onMouseLeave={e => { if (hasChildren) e.currentTarget.style.background = 'var(--bg-primary)'; }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex justify-between" style={{ marginBottom: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <span className="flex items-center" style={{ gap: '6px', textTransform: 'uppercase' }}>
              {(step.type === 'thought' || step.event_type === 'thought') && <BrainCircuit size={12} />}
              {(step.type === 'tool' || step.event_type === 'tool_call') && <Wrench size={12} />}
              {(step.type === 'mutation' || step.event_type === 'file_mutation') && <FileEdit size={12} />}
              {(step.type === 'alert' || step.event_type === 'error') && <AlertTriangle size={12} />}
              {step.type || step.event_type}
            </span>
            <span>{step.time || new Date(step.timestamp * 1000).toLocaleTimeString()}</span>
          </div>
          
          <div style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {step.type === 'thought' || step.event_type === 'thought'
              ? step.message
              : step.type === 'tool' || step.event_type === 'tool_call'
              ? `Executed ${step.name || step.tool_name}`
              : step.type === 'mutation' || step.event_type === 'file_mutation'
              ? `Mutated file: ${step.file || step.file_path}`
              : step.message || step.error
            }
          </div>
        </div>
        {hasChildren && (
          <div style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              overflow: 'hidden',
              paddingLeft: '16px',
              borderLeft: '1px dashed var(--glass-border)',
              marginLeft: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginTop: '4px',
            }}
          >
            {children.map(child => (
              <div 
                key={child.id}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.01)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255,255,255,0.02)',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '2px' }}>
                  {child.label}
                </div>
                <div style={{ 
                  color: child.accent || 'var(--text-primary)', 
                  fontFamily: child.isMono ? 'monospace' : 'inherit',
                  whiteSpace: child.isMono ? 'pre-wrap' : 'normal',
                  wordBreak: 'break-all'
                }}>
                  {child.value}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function COTPlatform() {
  const { selectedAgent } = useDashboard();
  const [trajectories, setTrajectories] = useState<any[]>([]);
  const [activeTraj, setActiveTraj] = useState<any>(null);

  // Filter trajectories for the selected agent
  const filteredTrajectories = selectedAgent
    ? trajectories.filter(t => 
        t.agent_address?.toLowerCase() === selectedAgent.eth_address?.toLowerCase() || 
        t.agent_id === selectedAgent.agent_id ||
        t.agent_id === selectedAgent.alias
      )
    : trajectories;

  useEffect(() => {
    if (filteredTrajectories.length > 0 && !activeTraj) {
      setActiveTraj(filteredTrajectories[0]);
    } else if (filteredTrajectories.length > 0 && activeTraj) {
      const activeStillValid = filteredTrajectories.some(t => t.id === activeTraj.id);
      if (!activeStillValid) {
        setActiveTraj(filteredTrajectories[0]);
      }
    }
  }, [selectedAgent, trajectories]);

  useEffect(() => {
    const fetchTrajectories = async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/telemetry/latest`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped = data.map((item: any) => {
               const pm = item.provider_metadata || {};
               const cm = item.customer_metadata || {};
               
               // Attempt to extract granular steps from the SDK payload
               const steps = [];
               
               // First check if the SDK sent an explicit agent_traces array
               if (pm.agent_traces && Array.isArray(pm.agent_traces)) {
                   steps.push(...pm.agent_traces);
               } else if (item.metadata?.agent_traces && Array.isArray(item.metadata.agent_traces)) {
                   steps.push(...item.metadata.agent_traces);
               } else {
                   // Fallback logic for basic inference records
                   if (pm.reasoning_content) {
                      steps.push({ id: 's1', type: 'thought', message: pm.reasoning_content, time: new Date(item.timestamp).toLocaleTimeString() });
                   }
                   if (pm.clean_text_output) {
                      steps.push({ id: 's2', type: 'mutation', file: 'output.txt', diff: pm.clean_text_output, time: new Date(item.timestamp).toLocaleTimeString() });
                   } else if (pm.completion || pm.text_output) {
                      steps.push({ id: 's2', type: 'mutation', file: 'output.txt', diff: pm.completion || pm.text_output, time: new Date(item.timestamp).toLocaleTimeString() });
                   }
                   if (steps.length === 0) {
                      steps.push({ id: 's1', type: 'alert', message: `Telemetry processed for ${pm.task || 'unknown task'}`, time: new Date(item.timestamp).toLocaleTimeString() });
                   }
               }
               
               return {
                  id: item.id ? (item.id.includes('-') && item.id.split('-').length > 4 ? item.id.split('-')[0] + '-' + item.id.split('-')[4] : item.id) : `tel-${Math.random().toString(36).substr(2, 6)}`,
                  intent: pm.task || cm.task || item.metadata?.task || `Transaction ${item.metadata?.tx_hash?.substring(0, 10)}`,
                  status: item.metadata?.dispute_status === 'RESOLVED' ? 'Passed' : (item.metadata?.dispute_status || 'Validating'),
                  score: Math.round((item.accuracy || 0.95) * 1000),
                  agent_id: item.agent,
                  agent_address: item.eth_address,
                  steps: steps,
                  issue: cm.issue || item.metadata?.issue || null,
                  raw: item
               };
            });
            if (mapped.length > 0) {
              setTrajectories(mapped);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch live trajectories", err);
      }
    };
    fetchTrajectories();
    const interval = setInterval(fetchTrajectories, 3000);
    return () => clearInterval(interval);
  }, []);

  if (filteredTrajectories.length === 0) {
    return (
      <Panel title="Agent COT Platform" icon={<BrainCircuit size={18} />}>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No granular reasoning traces discovered in the telemetry stream for this agent yet.
        </div>
      </Panel>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 'var(--space-6)' }}>
        
      {/* LEFT PANE: Hierarchy of COT Traces */}
      <div className="flex-col gap-6">
        <Panel title="Agent Chain-of-Thought (COT) Explorer" icon={<BrainCircuit size={18} />}>
          <div style={{ 
            background: 'rgba(0,0,0,0.4)', 
            borderRadius: 'var(--radius-md)', 
            padding: 'var(--space-4)',
            minHeight: '400px',
            maxHeight: '600px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '8px' }}>
              Granular Execution Hierarchy
            </div>
            <AnimatePresence mode="wait">
              {activeTraj && (
              <motion.div
                key={activeTraj.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {(activeTraj.steps || []).map((step: any, idx: number) => (
                  <HierarchicalStepNode key={step.id || idx} step={step} idx={idx} />
                ))}
              </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Panel>

        {/* Trajectory Navigation */}
        <Panel title="Recent Traces" icon={<Activity size={18} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {filteredTrajectories.map((traj) => (
              <div 
                key={traj.id}
                onClick={() => setActiveTraj(traj)}
                style={{
                  padding: 'var(--space-3)',
                  background: activeTraj?.id === traj.id ? 'var(--bg-secondary)' : 'transparent',
                  border: `1px solid ${activeTraj?.id === traj.id ? 'var(--gold)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{traj.intent}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{traj.id}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* RIGHT PANE: Intents vs Actual Results */}
      <div className="flex-col gap-6">
        <Panel title="Intents & Actual Results Analysis" icon={<Target size={18} />}>
          {activeTraj && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Intent Block */}
              <div style={{ 
                padding: '24px', 
                background: 'rgba(212,175,55,0.05)', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid rgba(212,175,55,0.2)',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '-10px', left: '20px', background: 'var(--bg-primary)', padding: '0 10px', color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Target Intent
                </div>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.5 }}>
                  {activeTraj.intent}
                </div>
              </div>

              {/* Actual Result Block */}
              <div style={{ 
                padding: '24px', 
                background: activeTraj.status === 'Passed' ? 'rgba(34, 197, 94, 0.05)' : activeTraj.status === 'Validating' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(239, 68, 68, 0.05)', 
                borderRadius: 'var(--radius-md)', 
                border: `1px solid ${activeTraj.status === 'Passed' ? 'rgba(34, 197, 94, 0.2)' : activeTraj.status === 'Validating' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '-10px', left: '20px', background: 'var(--bg-primary)', padding: '0 10px', color: activeTraj.status === 'Passed' ? 'var(--success)' : activeTraj.status === 'Validating' ? 'var(--info)' : 'var(--danger)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Actual Result
                </div>
                <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Status: <strong style={{ color: activeTraj.status === 'Passed' ? 'var(--success)' : 'var(--text-primary)' }}>{activeTraj.status === 'Passed' ? 'Successfully Executed & Verified' : activeTraj.status}</strong>
                </div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>BCC Alignment Score</span>
                    <span style={{ fontSize: '1.5rem', fontFamily: 'serif', color: activeTraj.score > 800 ? 'var(--success)' : 'var(--danger)' }}>{activeTraj.score}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Agent Contract</span>
                    <span style={{ fontSize: '1.1rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{activeTraj.agent_address?.substring(0,8)}...</span>
                  </div>
                </div>

                {activeTraj.status !== 'Passed' && activeTraj.status !== 'Validating' && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600, marginBottom: '8px' }}>
                      <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                      Failure Diagnostics
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {activeTraj.issue || 'Diagnostic telemetry indicates deviation from established SLA bounds. Manual audit recommended.'}
                    </div>
                  </div>
                )}
              </div>
              
              {/* SDK Telemetry Raw Output */}
              <div style={{ marginTop: 'auto' }}>
                 <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Granular Telemetry Source Data</div>
                 <pre style={{ 
                   background: 'var(--bg-secondary)', 
                   padding: '16px', 
                   borderRadius: 'var(--radius-sm)', 
                   fontSize: '0.7rem', 
                   color: 'var(--text-muted)',
                   maxHeight: '150px',
                   overflowY: 'auto'
                 }}>
                   {JSON.stringify(activeTraj.raw || {}, null, 2)}
                 </pre>
              </div>

            </div>
          )}
        </Panel>
      </div>

    </div>
  );
}
