import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Brain, GitBranch, Zap, TrendingUp } from 'lucide-react';
import { Panel } from '../components/shared/Panel';
import { TelemetryPanel } from '../components/tabs/TelemetryPanel';
import { TrajectoryPanel } from '../components/tabs/TrajectoryPanel';
import { DiagnosticsPanel } from '../components/tabs/DiagnosticsPanel';
import { useDashboard } from '../context/useDashboard';

// ─── Types ───────────────────────────────────────────────────────────────────

type IntelTab = 'telemetry' | 'reasoning' | 'trajectory';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: string;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const LiveBadge = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '3px 10px',
      background: 'rgba(34, 197, 94, 0.12)',
      border: '1px solid var(--success)',
      borderRadius: '999px',
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      color: 'var(--success)',
      textTransform: 'uppercase' as const,
    }}
  >
    <span
      style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'var(--success)',
        display: 'inline-block',
        animation: 'intel-pulse 1.4s ease-in-out infinite',
      }}
    />
    LIVE
  </span>
);

const StatCard = ({ label, value, icon, accent = 'var(--primary)' }: StatCardProps) => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      padding: 'var(--space-4)',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-md)',
      minWidth: 0,
    }}
  >
    <div
      style={{
        width: '40px',
        height: '40px',
        borderRadius: 'var(--radius-md)',
        background: `color-mix(in srgb, ${accent} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: accent,
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          lineHeight: 1,
          fontFamily: 'monospace',
          color: accent,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginTop: '4px',
        }}
      >
        {label}
      </div>
    </div>
  </div>
);

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { id: IntelTab; label: string; icon: React.ReactNode }[] = [
  { id: 'telemetry',  label: 'Telemetry',        icon: <Activity size={14} /> },
  { id: 'reasoning',  label: 'Reasoning Traces',  icon: <Brain size={14} /> },
  { id: 'trajectory', label: 'Diagnostics',        icon: <GitBranch size={14} /> },
];

// ─── Section animation variants ──────────────────────────────────────────────

const sectionVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.2, ease: 'easeIn' } },
} as any;

// ─── IntelligencePage ────────────────────────────────────────────────────────

export function IntelligencePage() {
  const { stats, activeTab: globalActiveTab, setActiveTab: setGlobalActiveTab } = useDashboard();

  let activeTab: IntelTab = 'telemetry';
  if (globalActiveTab === 'trajectory') {
    activeTab = 'reasoning';
  } else if (globalActiveTab === 'advanced') {
    activeTab = 'trajectory';
  }

  const setActiveTab = (tab: IntelTab) => {
    if (tab === 'telemetry') {
      setGlobalActiveTab('telemetry');
    } else if (tab === 'reasoning') {
      setGlobalActiveTab('trajectory');
    } else if (tab === 'trajectory') {
      setGlobalActiveTab('advanced');
    }
  };

  const activeNodes    = stats?.active_nodes    ?? 0;
  const aggregateAis   = stats?.aggregate_ais   ?? 0;
  const activeDisputes = stats?.active_disputes ?? 0;

  return (
    <>
      {/* Keyframe for the LIVE pulse dot */}
      <style>{`
        @keyframes intel-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
          padding: 'var(--space-6)',
          minHeight: '100%',
        }}
      >
        {/* ── Hero Bar ────────────────────────────────────────────── */}
        <Panel>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
            }}
          >
            {/* Left: title + subtitle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--primary) 40%, transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <Zap size={18} />
                </div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                  }}
                >
                  Intelligence
                </h1>
                <LiveBadge />
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  paddingLeft: '48px',
                }}
              >
                Real-time telemetry, reasoning traces &amp; trajectory analysis
              </p>
            </div>

            {/* Right: system status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                color: 'var(--success)',
              }}
            >
              <TrendingUp size={14} />
              Oracle Engine v9.0.2 — Nominal
            </div>
          </div>
        </Panel>

        {/* ── Stat Strip ──────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
          }}
        >
          <StatCard
            label="Active Nodes"
            value={activeNodes}
            icon={<Activity size={18} />}
            accent="var(--primary)"
          />
          <StatCard
            label="Aggregate AIS"
            value={aggregateAis.toLocaleString()}
            icon={<Brain size={18} />}
            accent="var(--gold)"
          />
          <StatCard
            label="Active Disputes"
            value={activeDisputes}
            icon={<GitBranch size={18} />}
            accent={activeDisputes > 0 ? 'var(--warning, #f59e0b)' : 'var(--success)'}
          />
        </div>

        {/* ── Sub-nav pill tabs ────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '6px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--glass-border)',
            alignSelf: 'flex-start',
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.18s ease',
                  background: isActive
                    ? 'color-mix(in srgb, var(--primary) 20%, var(--bg-primary))'
                    : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: isActive ? '0 0 0 1px var(--primary)' : 'none',
                  outline: 'none',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Animated section body ─────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === 'telemetry' && (
            <motion.div
              key="telemetry"
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <TelemetryPanel />
            </motion.div>
          )}

          {activeTab === 'reasoning' && (
            <motion.div
              key="reasoning"
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* Contextual descriptor panel before embedding the trace viewer */}
              <Panel
                title="Reasoning Traces"
                icon={<Brain size={18} />}
                style={{ marginBottom: 'var(--space-4)' }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  Step-by-step cognition logs for active agent trajectories. Each trace is
                  immutably anchored to the provenance ledger via the BCC Middleware.
                </p>
              </Panel>
              <TrajectoryPanel />
            </motion.div>
          )}

          {activeTab === 'trajectory' && (
            <motion.div
              key="trajectory"
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <DiagnosticsPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
