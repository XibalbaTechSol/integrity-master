import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../context/useDashboard';
import { Panel } from '../components/shared/Panel';
import { FactoryPanel } from '../components/tabs/FactoryPanel';
import { ZKProverPanel } from '../components/tabs/ZKProverPanel';
import { OracleRegistryPanel } from '../components/tabs/OracleRegistryPanel';
import { BlockchainVisualizer } from '../components/legacy-ui/BlockchainVisualizer';
import { ImmutableLedger } from '../components/legacy-ui/ImmutableLedger';
import {
  Code2,
  Shield,
  Database,
  Layers,
  FileCode,
  Activity,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ProtocolTab = 'Factory' | 'Oracles' | 'Ledger';

interface TabConfig {
  id: ProtocolTab;
  icon: React.ReactNode;
  label: string;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      padding: 'var(--space-4) var(--space-5)',
      background: 'var(--bg-card)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-md)',
    }}
  >
    <div
      style={{
        width: '40px',
        height: '40px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--primary-dim)',
        border: '1px solid var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--primary)',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: '4px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase' as const,
        }}
      >
        {label}
      </div>
    </div>
  </div>
);

// ─── Tab definitions ─────────────────────────────────────────────────────────

const TABS: TabConfig[] = [
  { id: 'Factory', icon: <FileCode size={15} />, label: 'Factory' },
  { id: 'Oracles', icon: <Database size={15} />, label: 'Oracles' },
  { id: 'Ledger', icon: <Layers size={15} />, label: 'Ledger' },
];

// ─── Animation variants ───────────────────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.18, ease: 'easeIn' } },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ProtocolPage() {
  const { stats, activeTab: globalActiveTab, setActiveTab: setGlobalActiveTab } = useDashboard() as any;

  let activeTab: ProtocolTab = 'Factory';
  if (globalActiveTab === 'oracle') {
    activeTab = 'Oracles';
  } else if (globalActiveTab === 'ledger' || globalActiveTab === 'zk') {
    activeTab = 'Ledger';
  }

  const setActiveTab = (tab: ProtocolTab) => {
    if (tab === 'Factory') {
      setGlobalActiveTab('factory');
    } else if (tab === 'Oracles') {
      setGlobalActiveTab('oracle');
    } else if (tab === 'Ledger') {
      setGlobalActiveTab('ledger');
    }
  };

  const totalContracts = stats?.total_contracts ?? '—';
  const activeNodes = stats?.active_nodes ?? '—';
  const activeDisputes = stats?.active_disputes ?? '—';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        padding: 'var(--space-6)',
        minHeight: '100%',
      }}
    >
      {/* ── Hero bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          paddingBottom: 'var(--space-4)',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-dim)',
              border: '1px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <Code2 size={20} />
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Protocol
          </h1>
        </div>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            margin: 0,
            paddingLeft: '48px',
          }}
        >
          Smart contracts, ZK proofs, oracle feeds &amp; settlement ledger
        </p>
      </motion.div>

      {/* ── 3-stat strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.06, ease: 'easeOut' }}
        style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}
      >
        <StatCard
          label="Total Contracts"
          value={totalContracts}
          icon={<FileCode size={18} />}
        />
        <StatCard
          label="Active Nodes"
          value={activeNodes}
          icon={<Database size={18} />}
        />
        <StatCard
          label="Active Disputes"
          value={activeDisputes}
          icon={<Shield size={18} />}
        />
      </motion.div>

      {/* ── Sub-nav pill tabs ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.12 }}
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          padding: '4px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--glass-border)',
          width: 'fit-content',
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
                borderRadius: 'calc(var(--radius-md) - 4px)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                background: isActive ? 'var(--primary-dim)' : 'transparent',
                transition: 'all 0.18s ease',
                outline: 'none',
              }}
              aria-selected={isActive}
              role="tab"
            >
              <span
                style={{
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* ── Panel content (animated) ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'Factory' && (
          <motion.div
            key="factory"
            variants={sectionVariants as any}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Panel
              title="Contract Factory"
              icon={<FileCode size={18} />}
              style={{ background: 'transparent', border: 'none', padding: 0 } as any}
            >
              <FactoryPanel />
            </Panel>
          </motion.div>
        )}

        {activeTab === 'Oracles' && (
          <motion.div
            key="oracles"
            variants={sectionVariants as any}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Panel
              title="Oracle Registry"
              icon={<Database size={18} />}
              style={{ background: 'transparent', border: 'none', padding: 0 } as any}
            >
              <OracleRegistryPanel />
            </Panel>
          </motion.div>
        )}

        {activeTab === 'Ledger' && (
          <motion.div
            key="ledger"
            variants={sectionVariants as any}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
          >
            {/* Consolidated ZK Prover Utility */}
            <ZKProverPanel />

            {/* Global Network State Visualizer */}
            <Panel title="Global Network State" icon={<Activity size={18} />}>
              <BlockchainVisualizer />
            </Panel>

            {/* Immutable Settlement Ledger */}
            <Panel title="Immutable Settlement Ledger" icon={<Layers size={18} />}>
              <ImmutableLedger />
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
