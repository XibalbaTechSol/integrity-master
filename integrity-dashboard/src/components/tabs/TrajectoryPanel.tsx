import { useState, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import { BrainCircuit, Wrench, FileEdit, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../../constants';
import { useDashboard } from '../../context/useDashboard';

const MOCK_TRAJECTORIES = [
  {
    id: 'traj_01',
    intent: 'Analyze and summarize patient blood test results.',
    status: 'Validating',
    score: 950,
    steps: [
      { id: 's1', type: 'thought', message: 'I need to retrieve the blood test document and parse the CBC values.', time: '10:02:45' },
      { id: 's2', type: 'tool', name: 'read_document', args: '{ doc_id: "lab_0991" }', time: '10:02:46' },
      { id: 's3', type: 'mutation', file: '/tmp/analysis_buffer.txt', diff: '+ High WBC count detected', time: '10:02:48' },
      { id: 's4', type: 'thought', message: 'Values extracted successfully. Now summarizing for the physician.', time: '10:02:49' }
    ]
  }
];

export function TrajectoryPanel() {
  const { selectedAgent } = useDashboard();
  const [trajectories, setTrajectories] = useState<any[]>(MOCK_TRAJECTORIES);
  const [activeTraj, setActiveTraj] = useState<any>(MOCK_TRAJECTORIES[0]);

  // Filter trajectories for the selected agent
  const filteredTrajectories = selectedAgent
    ? trajectories.filter(t => 
        t.agent_address?.toLowerCase() === selectedAgent.eth_address?.toLowerCase() || 
        t.agent_id === selectedAgent.agent_id ||
        t.agent_id === selectedAgent.alias
      )
    : trajectories;

  const displayTrajectories = filteredTrajectories.length > 0 ? filteredTrajectories : [
    {
      id: 'traj_idle',
      intent: 'Awaiting dynamic SDK telemetry and pre-execution intents.',
      status: 'Idle',
      score: selectedAgent?.current_ais || 900,
      steps: [
        { id: 'si1', type: 'thought', message: 'Node status nominal. Standing by for incoming actions...', time: '12:00:00' }
      ]
    }
  ];

  // Auto-select the first matching trajectory when activeTraj is not in the filtered list
  useEffect(() => {
    if (displayTrajectories.length > 0) {
      const activeStillValid = displayTrajectories.some(t => t.id === activeTraj?.id);
      if (!activeStillValid) {
        setActiveTraj(displayTrajectories[0]);
      }
    }
  }, [selectedAgent, trajectories]);

  useEffect(() => {
    const fetchTrajectories = async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/trajectories/recent`);
        if (res.ok) {
          const data = await res.json();
          if (data.trajectories && data.trajectories.length > 0) {
            setTrajectories(data.trajectories);
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

  return (
    <div className="flex-col gap-6">
      <div className="grid-cols-3" style={{ gap: 'var(--space-6)' }}>
        
        {/* Left Column: Trajectory List */}
        <div className="flex-col gap-6">
          <Panel title="Active Intent Trajectories" icon={<BrainCircuit size={18} />}>
            <div className="flex-col gap-3">
              {displayTrajectories.map((traj) => (
                <div 
                  key={traj.id}
                  onClick={() => setActiveTraj(traj)}
                  style={{
                    padding: 'var(--space-3)',
                    background: activeTraj?.id === traj.id ? 'var(--bg-secondary)' : 'transparent',
                    border: `1px solid ${activeTraj?.id === traj.id ? 'var(--gold)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div className="flex justify-between" style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{traj.id}</span>
                    <span style={{ fontSize: '0.75rem', color: traj.status === 'Drift Detected' ? 'var(--danger)' : 'var(--success)' }}>
                      {traj.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4 }}>
                    {traj.intent}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          
          <Panel title="BCC Evaluation Score" icon={<ShieldCheck size={18} />}>
            <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
              <div style={{ 
                fontSize: '3rem', 
                fontFamily: 'serif', 
                color: (activeTraj?.score || 0) > 800 ? 'var(--success)' : 'var(--danger)',
                textShadow: '0 0 20px rgba(var(--gold-rgb), 0.2)'
              }}>
                {activeTraj?.score || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Alignment Integrity Score (AIS)
              </div>
            </div>
          </Panel>
        </div>

        {/* Right Column: Thought Trace */}
        <div className="col-span-2 flex-col gap-6">
          <Panel title="Live Agent Cognition & Telemetry Trace" icon={<Activity size={18} />}>
            <div style={{ 
              background: 'rgba(0,0,0,0.4)', 
              borderRadius: 'var(--radius-md)', 
              padding: 'var(--space-4)',
              minHeight: '400px',
              fontFamily: 'monospace',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <AnimatePresence mode="wait">
                {activeTraj && (
                <motion.div
                  key={activeTraj.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  {(activeTraj.steps || []).map((step: any, idx: number) => (
                    <motion.div 
                      key={step.id || idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.15 }}
                      style={{
                        padding: '12px',
                        background: 'var(--bg-primary)',
                        borderLeft: `3px solid ${
                          step.type === 'thought' || step.event_type === 'thought' ? 'var(--accent)' :
                          step.type === 'tool' || step.event_type === 'tool_call' ? 'var(--gold)' :
                          step.type === 'mutation' || step.event_type === 'file_mutation' ? 'var(--info)' : 'var(--danger)'
                        }`,
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                        fontSize: '0.875rem'
                      }}
                    >
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
                      
                      {(step.type === 'thought' || step.event_type === 'thought') && <div style={{ color: 'var(--text-primary)' }}>{step.message}</div>}
                      {(step.type === 'tool' || step.event_type === 'tool_call') && <div><span style={{ color: 'var(--gold)' }}>{step.name || step.tool_name}</span> <span style={{ color: 'var(--text-muted)' }}>{step.args ? step.args : JSON.stringify(step.arguments)}</span></div>}
                      {(step.type === 'mutation' || step.event_type === 'file_mutation') && <div><span style={{ color: 'var(--info)' }}>{step.file || step.file_path}</span><br/><span style={{ color: 'var(--success)', marginTop: '4px', display: 'inline-block' }}>{step.diff}</span></div>}
                      {(step.type === 'alert' || step.event_type === 'error') && <div style={{ color: 'var(--danger)', fontWeight: 600 }}>{step.message || step.error}</div>}
                    </motion.div>
                  ))}
                </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
