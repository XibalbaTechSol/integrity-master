import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { API_BASE } from '../../constants';
import { useIsMobile } from '../../utils/useIsMobile';
import { Activity, Filter } from 'lucide-react';

export const TelemetryGraphs = () => {
  const isMobile = useIsMobile();
  const [data, setData] = useState<any[]>([]);
  const [agentFilter, setAgentFilter] = useState<string>('All');
  
  // Default to multiple selected metrics
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['latency', 'accuracy']);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await axios.get(`${API_BASE}/v1/telemetry/latest`);
        if (Array.isArray(res.data)) {
          const sorted = [...res.data].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          const formatted = sorted.map((d) => {
            const date = new Date(d.timestamp);
            return {
              time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
              latency: d.latency,
              accuracy: d.accuracy * 100,
              deal_value: d.deal_value || 0,
              discrepancy_ratio: d.metadata?.discrepancy_ratio || 0,
              semantic_drift: d.metadata?.semantic_drift || 0,
              transaction_velocity: d.metadata?.transaction_velocity || 0,
              cpu_percent: d.metadata?.environment?.cpu_percent || d.provider_metadata?.environment?.cpu_percent || 0,
              memory_percent: d.metadata?.environment?.memory_percent || d.provider_metadata?.environment?.memory_percent || 0,
              agent: d.agent || 'Unknown',
            };
          });
          setData(formatted);
        }
      } catch (e) {
        console.error("Telemetry fetch error:", e);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  const agents = useMemo(() => {
    const unique = new Set<string>();
    data.forEach(d => unique.add(d.agent));
    return ['All', ...Array.from(unique)];
  }, [data]);

  const filteredData = useMemo(() => {
    if (agentFilter === 'All') return data;
    return data.filter(d => d.agent === agentFilter);
  }, [data, agentFilter]);

  const METRICS = [
    { id: 'latency', label: 'Latency (ms)', color: '#f43f5e' },
    { id: 'accuracy', label: 'Accuracy (%)', color: '#10b981' },
    { id: 'deal_value', label: 'Deal Value (ITK)', color: '#d4af37' },
    { id: 'discrepancy_ratio', label: 'Discrepancy Ratio', color: '#8b5cf6' },
    { id: 'semantic_drift', label: 'Semantic Drift', color: '#ec4899' },
    { id: 'transaction_velocity', label: 'Tx Velocity (hz)', color: '#0ea5e9' },
    { id: 'cpu_percent', label: 'CPU Utilization (%)', color: '#f59e0b' },
    { id: 'memory_percent', label: 'Memory Usage (%)', color: '#3b82f6' }
  ];

  const toggleMetric = (id: string) => {
    setSelectedMetrics(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
  };

  const activeMetrics = METRICS.filter(m => selectedMetrics.includes(m.id));

  return (
    <div className="enterprise-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '40px', borderRadius: '16px', overflow: 'hidden' }}>
      <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: isMobile ? '16px' : '24px 32px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}>
            <Activity size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.25em', fontFamily: 'Inter, sans-serif', margin: 0 }}>Multi-Metric Telemetry</h2>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '4px' }}>Correlated Data Streams</span>
          </div>
        </div>

        {/* Global Agent Filter */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <Filter size={14} color="var(--text-muted)" />
             <select 
               className="select" 
               style={{ fontSize: '0.75rem', background: 'transparent', border: 'none', color: 'white', outline: 'none', cursor: 'pointer' }}
               value={agentFilter}
               onChange={e => setAgentFilter(e.target.value)}
             >
               {agents.map(a => <option key={a} value={a} style={{ background: '#050d18' }}>{a === 'All' ? 'All Agents' : a}</option>)}
             </select>
          </div>
        </div>
      </div>

      <div style={{ padding: isMobile ? '16px' : '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Metric Toggles */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {METRICS.map(m => {
            const isActive = selectedMetrics.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggleMetric(m.id)}
                style={{
                  background: isActive ? `${m.color}20` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? m.color : 'rgba(255,255,255,0.1)'}`,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 10px ${m.color}30` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActive ? m.color : 'transparent', border: `1px solid ${m.color}` }} />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Main Area Chart */}
        <div style={{ width: '100%', height: '400px', position: 'relative' }}>
          {filteredData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  {activeMetrics.map(m => (
                    <linearGradient key={`color-${m.id}`} id={`color-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={m.color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={m.color} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickMargin={10} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} />
                <Tooltip
                  contentStyle={{ background: 'rgba(5, 13, 24, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  itemStyle={{ fontSize: '0.8rem', fontWeight: 600 }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontSize: '0.7rem' }}
                />
                {activeMetrics.map(m => (
                  <Area 
                    key={m.id}
                    type="monotone" 
                    dataKey={m.id} 
                    stroke={m.color} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill={`url(#color-${m.id})`}
                    name={m.label} 
                    activeDot={{ r: 6, strokeWidth: 0, fill: m.color, style: { filter: `drop-shadow(0 0 8px ${m.color})` } }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              No telemetry data available for the selected filters.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

