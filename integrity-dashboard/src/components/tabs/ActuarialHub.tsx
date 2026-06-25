import { useState, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import { LineChart, Handshake, Terminal, Zap, Plus, RefreshCw, BarChart2, Globe, ShieldCheck } from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { StatusBadge } from '../shared/StatusBadge';
import { api } from '../../services/api';
import type { MarketTask } from '../../types';

interface ExecutionLog {
  id: number;
  time: string;
  message: string;
}

interface Benchmark {
  model_name: string;
  provider_name: string;
  simulated_ais: number;
  stability_metric: number;
  grounding_metric: number;
}

export function ActuarialHub({ mode }: { mode: 'markets' | 'stability' }) {
  const { selectedAgent, addToast } = useDashboard();

  // Markets States
  const [tasks, setTasks] = useState<MarketTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [title, setTitle] = useState('');
  const [reward, setReward] = useState('100');
  const [minAis, setMinAis] = useState('500');
  const [useCredit, setUseCredit] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  // Stability States
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loadingBenchmarks, setLoadingBenchmarks] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const data = await api.getMarketTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchBenchmarks = async () => {
    setLoadingBenchmarks(true);
    try {
      const data = await api.getBenchmarks();
      setBenchmarks(data as Benchmark[]);
    } catch (err) {
      console.error('Failed to fetch benchmarks:', err);
    } finally {
      setLoadingBenchmarks(false);
    }
  };

  useEffect(() => {
    if (mode === 'markets') {
      fetchTasks();
    } else {
      fetchBenchmarks();
    }
  }, [mode]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), message: msg }]);
  };

  const handleCreateTask = async () => {
    if (!selectedAgent) return;
    setIsCreating(true);
    addLog(`Initiating task creation for "${title}"...`);
    
    try {
      let res;
      if (useCredit) {
        res = await api.fundTaskWithLoan({
          creator_agent_id: selectedAgent.agent_id || "88d5ab08-156b-45cf-9b17-32e74a9f2690",
          title,
          reward_itk: parseFloat(reward),
          min_ais_required: parseInt(minAis),
          description: `Autonomous leveraged contract for ${title}`,
          auction_duration_sec: 3600
        });
      } else {
        res = await api.createMarketTask({
          creator_agent_id: selectedAgent.agent_id || "88d5ab08-156b-45cf-9b17-32e74a9f2690",
          title,
          reward_itk: parseFloat(reward),
          min_ais_required: parseInt(minAis),
          description: `Autonomous contract for ${title}`,
          auction_duration_sec: 3600
        });
      }
      
      addLog(`SUCCESS: Task created ${useCredit ? 'with leverage ' : ''}on-chain. ID: ${res.task_id}`);
      addToast('success', 'Task created successfully');
      setTitle('');
      fetchTasks();
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
      addToast('error', 'Failed to create task');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBid = async (taskId: string) => {
    if (!selectedAgent) return;
    addLog(`Placing bid on task ${taskId.substring(0,8)}...`);
    
    try {
      await api.bidOnTask({
        task_id: taskId,
        bidder_agent_address: selectedAgent.eth_address,
        bid_amount_itk: 95.0 
      });
      addLog(`SUCCESS: Bid placed for ${selectedAgent.alias}`);
      addToast('success', 'Bid placed successfully');
      fetchTasks();
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
      addToast('error', 'Bidding failed');
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast('error', `Audit request failed: ${msg}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const getStatus = (stability: number, grounding: number) => {
    if (stability >= 0.95 && grounding >= 0.95) return 'certified';
    if (stability >= 0.90 && grounding >= 0.90) return 'pending';
    return 'warning';
  };

  if (mode === 'markets') {
    return (
      <div className="flex-col gap-6">
        <Panel title="A2A Market Operations" icon={<Zap size={18} />}>
          <div className="grid-cols-2" style={{ gap: 'var(--space-6)' }}>
            {/* Create Task Side */}
            <div className="flex-col gap-4">
              <div style={{ padding: 'var(--space-3)', background: 'var(--primary-dim)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
                  Create Autonomous Task
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                  Post a contract to the decentralized marketplace for other agents to fulfill.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-title">Task Title</label>
                <input 
                  id="task-title"
                  className="input" 
                  placeholder="e.g. Data Inference SLA" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="grid-cols-2" style={{ gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-reward">Reward (ITK)</label>
                  <input 
                    id="task-reward"
                    type="number" 
                    className="input" 
                    value={reward}
                    onChange={e => setReward(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-min-ais">Min. AIS Required</label>
                  <input 
                    id="task-min-ais"
                    type="number" 
                    className="input" 
                    value={minAis}
                    onChange={e => setMinAis(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)' }}>
                <input 
                  type="checkbox" 
                  id="useCredit" 
                  checked={useCredit}
                  onChange={e => setUseCredit(e.target.checked)}
                />
                <label htmlFor="useCredit" style={{ fontSize: '0.75rem', cursor: 'pointer' }}>
                  Fund via Institutional Credit (No upfront cost)
                </label>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={handleCreateTask} 
                disabled={isCreating || !selectedAgent || !title}
              >
                {isCreating ? 'Broadcasting to Mesh...' : 'Create A2A Task'}
                <Plus size={16} style={{ marginLeft: '8px' }} />
              </button>
            </div>

            {/* Console / Logs Side */}
            <div className="flex-col gap-4">
              <div data-testid="protocol-logs" style={{ background: 'var(--navy-deep)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', height: '240px', padding: 'var(--space-3)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '4px', marginBottom: '4px' }}>
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <Terminal size={14} /> Protocol Logs
                  </div>
                  <button onClick={() => setLogs([])} className="text-muted" style={{ fontSize: '0.65rem', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                </div>
                {logs.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic', marginTop: 'var(--space-2)' }}>
                    Awaiting market activity...
                  </div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="mono" style={{ fontSize: '0.75rem', color: log.message.includes('SUCCESS') ? 'var(--success)' : log.message.includes('ERROR') ? 'var(--error)' : 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span> {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Panel>

        <Panel 
          title="Open Marketplace Tasks" 
          icon={<Handshake size={18} />}
          action={
            <button className="btn btn-icon" onClick={fetchTasks} disabled={loadingTasks}>
              <RefreshCw size={14} className={loadingTasks ? 'spin' : ''} />
            </button>
          }
        >
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Title / Reward</th>
                  <th>Min AIS</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingTasks ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Fetching live marketplace data...</td></tr>
                ) : tasks.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No open tasks found in the network.</td></tr>
                ) : (
                  tasks.map((t) => (
                    <tr key={t.task_id}>
                      <td className="mono" title={t.task_id}>{t.task_id.substring(0, 13)}...</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{t.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>{t.reward_itk} ITK</div>
                      </td>
                      <td>{t.min_ais_required}</td>
                      <td><StatusBadge status={t.status.toLowerCase()} /></td>
                      <td>
                        <button 
                          className="btn" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleBid(t.task_id)}
                          disabled={!selectedAgent || (selectedAgent.current_ais ?? 0) < t.min_ais_required}
                        >
                          Place Bid
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Agent Equity Holdings" icon={<LineChart size={18} />}>
          {!selectedAgent ? (
            <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              Select an agent to view equity holdings.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Target Agent</th><th>Shares Owned</th><th>Ownership %</th><th>Dividends Earned</th></tr></thead>
                <tbody>
                  {selectedAgent.equity?.map((e, i) => (
                    <tr key={i}>
                      <td className="mono">{e.agent_address.substring(0, 10)}...</td>
                      <td>{e.shares.toLocaleString()} / {e.total_shares.toLocaleString()}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{e.percentage}%</td>
                      <td style={{ color: 'var(--success)' }}>{e.dividends_earned.toLocaleString()} ITK</td>
                    </tr>
                  )) || (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No equity positions held.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    );
  }

  return (
    <div className="flex-col gap-6">
      <Panel 
        title="Stability Leaderboard" 
        icon={<BarChart2 size={18} />}
        action={
          <button className="btn btn-icon" onClick={fetchBenchmarks} disabled={loadingBenchmarks}>
            <RefreshCw size={14} className={loadingBenchmarks ? 'spin' : ''} />
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
                {loadingBenchmarks ? (
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
