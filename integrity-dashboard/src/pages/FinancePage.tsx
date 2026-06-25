import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Lock,
  ShoppingCart,
  BarChart2,
  Wallet,
} from 'lucide-react';
import { useDashboard } from '../context/useDashboard';
import { Panel } from '../components/shared/Panel';
import { StakingPanel } from '../components/tabs/StakingPanel';
import { CreditPanel } from '../components/tabs/CreditPanel';
import { ActuarialHub } from '../components/tabs/ActuarialHub';
import { TokenWallet } from '../components/legacy-ui/TokenWallet';

// ─── Sub-nav tabs ─────────────────────────────────────────────────────────────
type FinanceTab = 'wallet' | 'staking' | 'credit' | 'markets' | 'stability';

const TABS: { id: FinanceTab; label: string; icon: React.ReactNode }[] = [
  { id: 'wallet',    label: 'Wallet',    icon: <Wallet       size={14} /> },
  { id: 'staking',   label: 'Staking',   icon: <Lock         size={14} /> },
  { id: 'credit',    label: 'Credit',    icon: <DollarSign   size={14} /> },
  { id: 'markets',   label: 'Markets',   icon: <ShoppingCart size={14} /> },
  { id: 'stability', label: 'Stability', icon: <BarChart2    size={14} /> },
];

// ─── Stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-md)',
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
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--gold)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Wallet Section ───────────────────────────────────────────────────────────
function WalletSection() {
  const { walletAddress, walletBalance, connectWallet } = useDashboard();

  return (
    <div className="flex-col gap-6">
      <Panel title="Connected Wallet" icon={<Wallet size={18} />}>
        {!walletAddress ? (
          /* ── Not connected empty state ── */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-4)',
              padding: 'var(--space-4)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Wallet size={28} />
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>No wallet connected</div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  maxWidth: '320px',
                }}
              >
                Connect your Web3 wallet to view your ITK balance, sign transactions, and interact
                with the Integrity Protocol.
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => (connectWallet as any)()}
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          /* ── Connected state ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Address row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-4)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                  }}
                >
                  Wallet Address
                </div>
                <div className="mono" style={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>
                  {walletAddress}
                </div>
              </div>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'var(--success)',
                  flexShrink: 0,
                  marginLeft: 'var(--space-4)',
                  boxShadow: '0 0 6px var(--success)',
                }}
              />
            </div>

            {/* Balance row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-4)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                  }}
                >
                  ITK Balance
                </div>
                <div
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: 'var(--gold)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {(walletBalance as any).toLocaleString()}
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 400,
                      color: 'var(--text-muted)',
                      marginLeft: '6px',
                    }}
                  >
                    ITK
                  </span>
                </div>
              </div>
              <DollarSign size={32} style={{ color: 'var(--gold)', opacity: 0.4 }} />
            </div>

            {/* Reconnect */}
            <button
              className="btn btn-ghost"
              style={{ alignSelf: 'flex-start', fontSize: '0.8rem' }}
              onClick={() => (connectWallet as any)()}
            >
              Reconnect Wallet
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
}

// ─── Animation config ─────────────────────────────────────────────────────────
const sectionVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
} as any;

// ─── FinancePage ──────────────────────────────────────────────────────────────
export function FinancePage() {
  const { stats, activeTab: globalActiveTab, setActiveTab: setGlobalActiveTab } = useDashboard();

  const validTabs: string[] = ['wallet', 'staking', 'credit', 'markets', 'stability'];
  const activeTab = validTabs.includes(globalActiveTab) ? (globalActiveTab as FinanceTab) : 'wallet';

  const setActiveTab = (tab: FinanceTab) => {
    setGlobalActiveTab(tab);
  };

  // ── Stat strip values ──
  const tvl        = stats?.tvl                     ?? 0;
  const totalLoans = stats?.total_loans_volume       ?? 0;
  const stakedItk  = stats?.protocol_staked_itk      ?? 0;
  const marketVol  = stats?.total_marketplace_volume ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

      {/* ── Hero bar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-dim)',
            border: '1px solid var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            flexShrink: 0,
          }}
        >
          <DollarSign size={22} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700, lineHeight: 1.2 }}>
            Finance
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Staking, credit, markets &amp; protocol stability
          </p>
        </div>
      </div>

      {/* ── 4-stat strip ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <StatCard icon={<DollarSign   size={18} />} label="TVL"               value={tvl.toLocaleString()} />
        <StatCard icon={<TrendingUp   size={18} />} label="Total Loan Volume" value={totalLoans.toLocaleString()} />
        <StatCard icon={<Lock         size={18} />} label="Staked ITK"        value={stakedItk.toLocaleString()} />
        <StatCard icon={<ShoppingCart size={18} />} label="Market Volume"     value={marketVol.toLocaleString()} />
      </div>

      {/* ── Sub-nav pill tabs ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)',
          padding: '6px',
        }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 400,
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-muted)',
                transition: 'background 0.18s, color 0.18s',
                outline: 'none',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Section content ───────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {activeTab === 'wallet'    && <TokenWallet />}
          {activeTab === 'staking'   && <StakingPanel />}
          {activeTab === 'credit'    && <CreditPanel />}
          {activeTab === 'markets'   && <ActuarialHub mode="markets" />}
          {activeTab === 'stability' && <ActuarialHub mode="stability" />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
