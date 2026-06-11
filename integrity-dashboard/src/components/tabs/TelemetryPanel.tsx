import { useState } from 'react';
import { Panel } from '../shared/Panel';
import { Activity, Cpu, Binary, Zap, Info } from 'lucide-react';
import { TelemetryStream } from '../legacy-ui/TelemetryStream';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Reimagined Telemetry Panel: The "Oracle Cockpit"
 * Directly reflects the Rust Tri-Metric Engine logic (v8.4)
 */
// LaTeX-style formula explanation
const FormulaDisplay = () => (
  <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', margin: 'var(--space-4) 0' }}>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Binary size={14} /> Core Mathematical Engine (v8.4)
    </div>
    <div style={{ fontSize: '1.25rem', fontFamily: 'serif', textAlign: 'center', padding: '10px 0' }}>
      <span style={{ color: 'var(--success)' }}>AIS</span> = (
      <span style={{ color: 'var(--primary)' }}>w_E</span> · S_E + 
      <span style={{ color: 'var(--primary)' }}>w_G</span> · S_G + 
      <span style={{ color: 'var(--primary)' }}>w_S</span> · S_S
      ) · <span style={{ color: 'var(--warning)' }}>Drag(σ²)</span>
    </div>
    <div className="flex-col gap-1" style={{ fontSize: '0.7rem', marginTop: '8px' }}>
      <div className="flex justify-between">
        <span>Stability Drag (e^-1.5σ²)</span>
        <span style={{ color: 'var(--warning)' }}>Impact: High</span>
      </div>
      <div className="flex justify-between">
        <span>Grounding Boost (1 + HITL · 0.2)</span>
        <span style={{ color: 'var(--success)' }}>Impact: Moderate</span>
      </div>
    </div>
  </div>
);

export function TelemetryPanel() {
  const [activeMetric, setActiveMetric] = useState<'entropy' | 'grounding' | 'sacrifice' | 'compliance'>('entropy');

  return (
    <div className="flex-col gap-6">
      <div className="grid-cols-3" style={{ gap: 'var(--space-6)' }}>
         <div className="col-span-2 flex-col gap-6">
            <Panel title="Real-Time Network Ingestion" icon={<Activity size={18} />}>
              <div className="flex-col gap-4">
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Visualizing the high-frequency telemetry stream directly from Node 5.
                </div>
                <TelemetryStream />
              </div>
            </Panel>

            <Panel title="Metric Decomposition" icon={<Cpu size={18} />}>
               <div className="flex-col gap-6">
                  <div className="flex gap-2" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                    {(['entropy', 'grounding', 'sacrifice', 'compliance'] as const).map(m => (
                      <button 
                        key={m} 
                        onClick={() => setActiveMetric(m)}
                        className={`btn ${activeMetric === m ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '4px 12px', fontSize: '0.75rem', textTransform: 'capitalize' }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeMetric}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{ minHeight: '120px' }}
                    >
                      {activeMetric === 'entropy' && (
                        <div className="flex-col gap-3">
                          <div style={{ fontWeight: 600 }}>Entropy Score (Stability)</div>
                          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                            Measures the statistical variance in agent response latency and data quality. 
                            The Oracle applies an exponential decay function to punish unpredictable behavior.
                          </p>
                          <div className="flex items-center gap-2" style={{ color: 'var(--warning)', fontSize: '0.75rem' }}>
                            <Zap size={14} /> Stability Drag Active: -12% applied to current AIS.
                          </div>
                        </div>
                      )}
                      {activeMetric === 'grounding' && (
                        <div className="flex-col gap-3">
                          <div style={{ fontWeight: 600 }}>Grounding Score (HITL)</div>
                          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                            Quantifies human intervention depth. Higher grounding scores indicate that the agent's 
                            high-value actions are being verified by authorized controllers.
                          </p>
                        </div>
                      )}
                      {activeMetric === 'sacrifice' && (
                        <div className="flex-col gap-3">
                          <div style={{ fontWeight: 600 }}>Sacrifice Score (Verifiable Energy)</div>
                          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                            Proof-of-Stake for AI. Measures the amount of ITK tokens bonded and the verified GPU/TPU 
                            hours committed to the protocol.
                          </p>
                        </div>
                      )}
                      {activeMetric === 'compliance' && (
                        <div className="flex-col gap-3">
                          <div style={{ fontWeight: 600 }}>Compliance Score (Guardrails)</div>
                          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                            Adherence to domain-specific OPA safety rules (e.g. HIPAA, SOC2). 
                            Reflects the pass rate of the BCC Middleware gating.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
               </div>
            </Panel>
         </div>

         <div className="flex-col gap-6">
            <Panel title="AIS Formula Anchor" icon={<Binary size={18} />}>
               <div className="flex-col gap-2">
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                    The Agent Integrity Score is an actuarial trust metric derived from multi-dimensional telemetry.
                  </p>
                  <FormulaDisplay />
                  <div className="flex items-start gap-2" style={{ padding: '12px', background: 'var(--primary-dim)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)' }}>
                    <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>
                      <strong>Oracle Note:</strong> Current domain <em>Global</em> uses equal weights. 
                      <em>Shield</em> domain increases <strong>w_G</strong> to 0.40.
                    </div>
                  </div>
               </div>
            </Panel>

            <Panel title="Node Synchronization" icon={<Binary size={18} />}>
               <div className="flex-col gap-4">
                  {[1, 2, 3, 4, 5].map(node => (
                    <div key={node} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Node {node}</span>
                      </div>
                      <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>v9.0.2 - STABLE</span>
                    </div>
                  ))}
               </div>
            </Panel>
         </div>
      </div>
    </div>
  );
}
