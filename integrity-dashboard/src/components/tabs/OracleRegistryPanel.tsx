import { useState, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import { Globe, Database, RefreshCw, CheckCircle, Layers, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';
import { motion } from 'framer-motion';

const RollupStep = ({ title, desc, icon, active }: { title: string, desc: string, icon: React.ReactNode, active?: boolean }) => (
  <div className="flex-col items-center gap-2" style={{ flex: 1, opacity: active ? 1 : 0.4 }}>
     <div style={{ 
       width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', 
       background: active ? 'var(--primary-dim)' : 'var(--bg-secondary)', 
       border: `1px solid ${active ? 'var(--primary)' : 'var(--glass-border)'}`,
       display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? 'var(--primary)' : 'var(--text-muted)'
     }}>
       {icon}
     </div>
     <div style={{ fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>{title}</div>
     <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0 4px' }}>{desc}</div>
  </div>
);

interface Source {
  id: number;
  name: string;
  uri: string;
  active: boolean;
  trustScore: number;
}

export function OracleRegistryPanel() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const data: Source[] = [
        { id: 1, name: 'National Medical Library', uri: 'https://nml.gov/api', active: true, trustScore: 980 },
        { id: 2, name: 'Global Financial Index', uri: 'https://gfi.com/realtime', active: true, trustScore: 950 },
        { id: 3, name: 'Weather Pattern Oracle', uri: 'https://weather.intg/v1', active: false, trustScore: 400 },
        { id: 4, name: 'PubMed Central Verified', uri: 'https://pmc.nih.gov/v3', active: true, trustScore: 995 },
      ];
      setSources(data);
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (mounted) {
        await fetchSources();
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex-col gap-6">
      <Panel 
        title="World Awareness: Oracle Registry" 
        icon={<Globe size={18} />}
        action={
          <button className="btn btn-icon" onClick={fetchSources} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        }
      >
        {/* ... Sources Table ... */}
        <div className="flex-col gap-4">
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>
            Authorized off-chain data providers verified by the Integrity Protocol. 
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Source Name</th>
                  <th>URI Endpoint</th>
                  <th>Trust Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sources.map(source => (
                  <tr key={source.id}>
                    <td style={{ fontWeight: 600 }}>{source.name}</td>
                    <td className="mono" style={{ fontSize: '0.75rem' }}>{source.uri}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ width: '60px', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${source.trustScore / 10}%`, height: '100%', background: source.trustScore > 800 ? 'var(--success)' : 'var(--warning)' }}></div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{source.trustScore}</span>
                      </div>
                    </td>
                    <td><StatusBadge status={source.active ? 'Active' : 'Inactive'} /></td>
                    <td><button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>Manage</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      <Panel title="Forensic Rollup Visualizer (Layer 0 to L2)" icon={<Layers size={18} />}>
         <div className="flex-col gap-8" style={{ padding: 'var(--space-4) 0' }}>
            <div className="flex items-start justify-between relative">
               {/* Background line */}
               <div style={{ position: 'absolute', top: '24px', left: '10%', right: '10%', height: '2px', background: 'var(--glass-border)', zIndex: 0 }}></div>
               
               <RollupStep 
                 active title="Ingestion" 
                 desc="Raw telemetry ingestion from agent edge" 
                 icon={<Database size={20} />} 
               />
               <ArrowRight size={16} style={{ marginTop: '16px', color: 'var(--text-muted)', zIndex: 1 }} />
               <RollupStep 
                 active title="Batching" 
                 desc="Asynchronous buffer (flushing every 100 tx)" 
                 icon={<Layers size={20} />} 
               />
               <ArrowRight size={16} style={{ marginTop: '16px', color: 'var(--text-muted)', zIndex: 1 }} />
               <RollupStep 
                 active title="Merkle Root" 
                 desc="Cryptographic commitment generation" 
                 icon={<CheckCircle size={20} />} 
               />
               <ArrowRight size={16} style={{ marginTop: '16px', color: 'var(--text-muted)', zIndex: 1 }} />
               <RollupStep 
                 active title="L2 Settlement" 
                 desc="On-chain anchor to Base via Rollup Daemon" 
                 icon={<Globe size={20} />} 
               />
            </div>

            <div style={{ background: 'var(--navy-deep)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
               <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <StatusBadge status="Active" />
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Batch ID: 88f2-a231-42cd</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Estimated Settlement: 142.2s</div>
               </div>
               
               <div className="flex-col gap-2">
                  <div className="flex justify-between text-muted" style={{ fontSize: '0.65rem' }}>
                    <span>Merkle Path Verification</span>
                    <span>100% Complete</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ height: '100%', background: 'var(--primary)' }}
                    />
                  </div>
               </div>
            </div>
         </div>
      </Panel>

      <div className="grid-cols-2">
        <Panel title="Oracle Consensus Network" icon={<Globe size={18} />}>
          <div className="flex-col gap-4 items-center justify-center" style={{ height: '160px' }}>
             <div className="flex gap-6">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex-col items-center gap-2">
                   <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-dim)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}
                   >
                     <Globe size={22} />
                   </motion.div>
                   <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Node {i}</span>
                   <div style={{ fontSize: '0.6rem', color: 'var(--success)' }}>ONLINE</div>
                 </div>
               ))}
             </div>
             <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)', marginTop: '8px' }}>
               Network Stability: 99.98%
             </div>
          </div>
        </Panel>

        <Panel title="Recent Settlement Proofs" icon={<Database size={18} />}>
          <div className="flex-col gap-3">
             {[1, 2, 3].map(i => (
               <div key={i} style={{ padding: 'var(--space-3)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                 <div className="flex justify-between items-center">
                   <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>L2 Anchor #{4200 + i}</span>
                   <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--primary)' }}>0xMerkle_{i*88}...</span>
                 </div>
                 <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                   Settled on Base @ Block #12,884,9{i}
                 </div>
               </div>
             ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
