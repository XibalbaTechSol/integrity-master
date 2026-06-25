import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Vote,
  CheckCircle,
  Shield,
  AlertTriangle,
  Gavel,
  ThumbsUp,
  ThumbsDown,
  Clock,
  ShieldCheck,
  RefreshCw,
  FileText,
  Activity,
  ShieldAlert,
  Trash2,
  Search,
  Loader2,
  Lock,
  Info,
  X,
} from 'lucide-react';
import { Panel } from '../components/shared/Panel';
import { StatusBadge } from '../components/shared/StatusBadge';
import { useDashboard } from '../context/useDashboard';
import { api } from '../services/api';
import { ProposeBAAModal } from '../components/tabs/ShieldPanel';


// ─── Local Types ──────────────────────────────────────────────────────────────

interface Proposal {
  id: string;
  title: string;
  category: string;
  description: string;
  status: 'active' | 'passed' | 'rejected';
  votes_for: number;
  votes_against: number;
  created_at: string;
}

interface BAA {
  id: string;
  coveredEntity: string;
  businessAssociate: string;
  status: string;
  signedAt: string;
  stakedITK: string;
  documentHash: string;
}

interface Interaction {
  id: string;
  time: string;
  action: string;
  resource: string;
  agent: string;
  baaId: string;
  status: 'PASSED' | 'BLOCKED';
}

interface Violation {
  id: string;
  time: string;
  agent: string;
  baaId: string;
  type: string;
  detail: string;
  status: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'prop-101',
    title: 'Increase Minimum ITK Stake for Validator Nodes',
    category: 'economic',
    description:
      'Raise the minimum required stake from 10,000 ITK to 15,000 ITK to increase sybil resistance.',
    status: 'active',
    votes_for: 250000,
    votes_against: 120000,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'prop-102',
    title: 'Upgrade Oracle Registry to v2',
    category: 'protocol',
    description:
      'Migrate to the newly audited v2 smart contracts that support zero-knowledge proofs on L2.',
    status: 'active',
    votes_for: 850000,
    votes_against: 15000,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'prop-100',
    title: 'Adjust Default Liquidation Ratio to 120%',
    category: 'economic',
    description:
      'Lower the liquidation ratio to increase capital efficiency for high-AIS agents.',
    status: 'passed',
    votes_for: 1200000,
    votes_against: 400000,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

const MOCK_COMPLIANCE_EVENTS = [
  { id: 1, type: 'success', text: 'Automated KYC refresh completed', time: '2 hours ago' },
  { id: 2, type: 'info', text: 'SLA Contract audited by TEE Enclave', time: '5 hours ago' },
  { id: 3, type: 'success', text: 'Risk parameters aligned with ISO-27001', time: '1 day ago' },
  { id: 4, type: 'warning', text: 'Minor drift in jurisdictional bounds detected', time: '3 days ago' },
];

// ─── Animation Variants ───────────────────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
} as any;

// ─── Sub-Tabs ─────────────────────────────────────────────────────────────────

type SubTab = 'Proposals' | 'Compliance' | 'Shield';

const SUB_TABS: { id: SubTab; icon: React.ReactNode }[] = [
  { id: 'Proposals', icon: <Vote size={14} /> },
  { id: 'Compliance', icon: <CheckCircle size={14} /> },
  { id: 'Shield', icon: <Shield size={14} /> },
];

// ─── GovernancePage ───────────────────────────────────────────────────────────

export function GovernancePage() {
  const { selectedAgent, stats, addToast, walletAddress, activeTab: globalActiveTab, setActiveTab: setGlobalActiveTab } = useDashboard();

  let activeTab: SubTab = 'Proposals';
  if (globalActiveTab === 'compliance') {
    activeTab = 'Compliance';
  } else if (globalActiveTab === 'shield') {
    activeTab = 'Shield';
  }

  const setActiveTab = (tab: SubTab) => {
    if (tab === 'Proposals') {
      setGlobalActiveTab('governance');
    } else if (tab === 'Compliance') {
      setGlobalActiveTab('compliance');
    } else if (tab === 'Shield') {
      setGlobalActiveTab('shield');
    }
  };

  // ── Proposals state ────────────────────────────────────────────────
  const [proposals, setProposals] = useState<Proposal[]>(() => {
    const saved = localStorage.getItem('integrity_proposals');
    return saved ? JSON.parse(saved) : [];
  });
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('protocol');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Compliance state ───────────────────────────────────────────────
  const [complianceScore, setComplianceScore] = useState(98);
  const [complianceEvents] = useState(MOCK_COMPLIANCE_EVENTS);
  const [complianceLoading, setComplianceLoading] = useState(false);

  // ── Shield state ───────────────────────────────────────────────────
  const [baas, setBaas] = useState<BAA[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [shieldLoading, setShieldLoading] = useState(true);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);

  // ── Persist proposals ──────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('integrity_proposals', JSON.stringify(proposals));
  }, [proposals]);

  // ── Fetch proposals ────────────────────────────────────────────────
  useEffect(() => {
    (api as any).getProposals()
      .then((data: any[]) => {
        const mapped: Proposal[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          description: item.description,
          status:
            item.status?.toLowerCase() === 'passed'
              ? 'passed'
              : item.status?.toLowerCase() === 'failed'
              ? 'rejected'
              : 'active',
          votes_for: item.votes_for || Math.floor(Math.random() * 500000),
          votes_against: item.votes_against || Math.floor(Math.random() * 100000),
          created_at: item.created_at,
        }));
        const combined = [...mapped];
        proposals.forEach((p) => {
          if (!combined.find((c) => c.id === p.id)) combined.push(p);
        });
        setProposals(combined);
      })
      .catch(() => {
        if (proposals.length === 0) setProposals(MOCK_PROPOSALS);
      })
      .finally(() => setProposalsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch compliance score ─────────────────────────────────────────
  const fetchComplianceData = async () => {
    if (!selectedAgent) return;
    setComplianceLoading(true);
    try {
      if (selectedAgent.compliance_score) {
        setComplianceScore(selectedAgent.compliance_score);
      }
    } catch (err) {
      console.error('Failed to fetch compliance data:', err);
    } finally {
      setComplianceLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent]);

  // ── Fetch Shield data ──────────────────────────────────────────────
  const fetchShieldData = async () => {
    setShieldLoading(true);
    try {
      const [baaData, intData, violationData] = await Promise.all([
        (api as any).getBAAs(),
        (api as any).getShieldInteractions(),
        (api as any).getComplianceReviewQueue(),
      ]);
      setBaas(baaData || []);
      setInteractions(intData || []);
      setViolations(violationData || []);
    } catch (err: any) {
      addToast('error', `Shield sync failed: ${err.message}`);
    } finally {
      setShieldLoading(false);
    }
  };

  useEffect(() => {
    fetchShieldData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent]);

  // ── Proposal handlers ──────────────────────────────────────────────
  const handleVote = async (id: string, type: 'for' | 'against') => {
    try {
      await (api as any).voteProposal(id, type);
      addToast('success', 'Vote cast successfully');
    } catch {
      addToast('success', 'Vote cast locally (Offline Mode)');
    }
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              votes_for: type === 'for' ? p.votes_for + 10000 : p.votes_for,
              votes_against: type === 'against' ? p.votes_against + 10000 : p.votes_against,
            }
          : p
      )
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const newProp: Proposal = {
      id: `prop-${Math.floor(Math.random() * 1000) + 200}`,
      title: newTitle,
      category: newCategory,
      description: newDesc,
      status: 'active',
      votes_for: 0,
      votes_against: 0,
      created_at: new Date().toISOString(),
    };
    try {
      await (api as any).createProposal({ title: newTitle, description: newDesc, category: newCategory });
      addToast('success', 'Proposal submitted to the network');
    } catch {
      addToast('success', 'Proposal submitted locally (Offline Mode)');
    }
    setProposals((prev) => [newProp, ...prev]);
    setNewTitle('');
    setNewDesc('');
    setIsSubmitting(false);
  };

  // ── Shield handlers ────────────────────────────────────────────────
  const handleResolveViolation = async (id: string, action: 'finalize_slash' | 'dismiss') => {
    try {
      await (api as any).resolveComplianceViolation(id, action);
      addToast('success', action === 'finalize_slash' ? 'ITK Stake Slashed Successfully' : 'Violation Dismissed');
      fetchShieldData();
    } catch (err: any) {
      addToast('error', `Resolution failed: ${err.message}`);
    }
  };

  // ── Derived values ────────────────────────────────────────────────
  const activeProposals = proposals.filter((p) => p.status === 'active');
  const pastProposals = proposals.filter((p) => p.status !== 'active');
  const activeDisputes = (stats as any)?.active_disputes ?? 0;
  const complianceScoreDisplay = selectedAgent?.compliance_score ?? 0;
  const verificationTier = selectedAgent?.verification_tier;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

      {/* ── Hero Bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6) var(--space-8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-6)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-1)',
            }}
          >
            <Gavel size={22} color="var(--primary)" />
            <h1
              style={{
                margin: 0,
                fontSize: '1.6rem',
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              Governance
            </h1>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
            }}
          >
            Proposals, compliance scoring &amp; Shield BAA management
          </p>
        </div>

        {/* ── 3-Stat Strip ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {/* Active Disputes */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: `1px solid ${activeDisputes > 0 ? 'var(--danger)' : 'var(--glass-border)'}`,
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-5)',
              textAlign: 'center',
              minWidth: '110px',
            }}
          >
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: activeDisputes > 0 ? 'var(--danger)' : 'var(--text)',
                lineHeight: 1,
              }}
            >
              {activeDisputes}
            </div>
            <div
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginTop: '4px',
              }}
            >
              Active Disputes
            </div>
          </div>

          {/* Compliance Score */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-5)',
              textAlign: 'center',
              minWidth: '110px',
            }}
          >
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--success)',
                lineHeight: 1,
              }}
            >
              {complianceScoreDisplay}
              <span style={{ fontSize: '1rem', fontWeight: 600 }}>%</span>
            </div>
            <div
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginTop: '4px',
              }}
            >
              Compliance Score
            </div>
          </div>

          {/* Verification Tier */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-5)',
              textAlign: 'center',
              minWidth: '110px',
            }}
          >
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--primary)',
                lineHeight: 1,
              }}
            >
              {verificationTier ?? '—'}
            </div>
            <div
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginTop: '4px',
              }}
            >
              Verification Tier
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-Nav Pills ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {SUB_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: '999px',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                background: isActive ? 'var(--primary)' : 'var(--bg-card)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon}
              {tab.id}
            </button>
          );
        })}
      </div>

      {/* ── Section Content ───────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'Proposals' && (
          <motion.div
            key="proposals"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
          >
            <div className="grid-cols-2">
              {/* Active Proposals */}
              <div className="flex-col gap-6">
                <Panel title="Active Proposals" icon={<Vote size={18} />}>
                  {proposalsLoading ? (
                    <div className="skeleton" style={{ height: '200px' }} />
                  ) : activeProposals.length === 0 ? (
                    <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                      No active governance proposals.
                    </div>
                  ) : (
                    <div className="flex-col gap-4">
                      {activeProposals.map((p) => {
                        const totalVotes = p.votes_for + p.votes_against;
                        const forPercent = totalVotes > 0 ? (p.votes_for / totalVotes) * 100 : 0;
                        return (
                          <div
                            key={p.id}
                            style={{
                              background: 'var(--bg-secondary)',
                              padding: 'var(--space-4)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--glass-border)',
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1.1rem' }}>
                                {p.title}
                              </div>
                              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {p.id}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
                              {p.description}
                            </div>
                            <div style={{ marginBottom: 'var(--space-3)' }}>
                              <div className="flex justify-between" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--success)' }}>For: {p.votes_for.toLocaleString()} ITK</span>
                                <span style={{ color: 'var(--danger)' }}>Against: {p.votes_against.toLocaleString()} ITK</span>
                              </div>
                              <div
                                style={{
                                  width: '100%',
                                  height: '6px',
                                  background: 'var(--bg-primary)',
                                  borderRadius: '3px',
                                  overflow: 'hidden',
                                  display: 'flex',
                                }}
                              >
                                <div style={{ width: `${forPercent}%`, background: 'var(--success)', height: '100%' }} />
                                <div style={{ width: `${100 - forPercent}%`, background: 'var(--danger)', height: '100%' }} />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                className="btn"
                                style={{ flex: 1, borderColor: 'var(--success)', color: 'var(--success)' }}
                                onClick={() => handleVote(p.id, 'for')}
                              >
                                <ThumbsUp size={16} /> Vote For
                              </button>
                              <button
                                className="btn"
                                style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }}
                                onClick={() => handleVote(p.id, 'against')}
                              >
                                <ThumbsDown size={16} /> Vote Against
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Panel>
              </div>

              {/* Create + History column */}
              <div className="flex-col gap-6">
                <Panel title="Create Proposal" icon={<Gavel size={18} />}>
                  <form className="flex-col gap-4" onSubmit={handleCreate}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="gov-proposal-title">Title</label>
                      <input
                        id="gov-proposal-title"
                        type="text"
                        className="input"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="gov-proposal-category">Category</label>
                      <select
                        id="gov-proposal-category"
                        className="select"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                      >
                        <option value="protocol">Protocol Upgrade</option>
                        <option value="economic">Economic Parameter</option>
                        <option value="security">Security Adjustment</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="gov-proposal-desc">Description &amp; Rationale</label>
                      <textarea
                        id="gov-proposal-desc"
                        className="input"
                        rows={4}
                        required
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      Submit Proposal (Requires 100 ITK Stake)
                    </button>
                  </form>
                </Panel>

                <Panel title="Proposal History" icon={<Clock size={18} />}>
                  {proposalsLoading ? (
                    <div className="skeleton" style={{ height: '100px' }} />
                  ) : pastProposals.length === 0 ? (
                    <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                      No historical proposals found.
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Proposal</th>
                            <th>Category</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pastProposals.map((p) => (
                            <tr key={p.id}>
                              <td style={{ fontWeight: 500 }}>{p.title}</td>
                              <td style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>{p.category}</td>
                              <td>
                                {p.status === 'passed' ? (
                                  <div className="flex items-center gap-1" style={{ color: 'var(--success)', fontSize: '0.875rem' }}>
                                    <CheckCircle size={14} /> Passed
                                  </div>
                                ) : (
                                  <div style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>Rejected</div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'Compliance' && (
          <motion.div
            key="compliance"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="grid-cols-2">
              {/* Compliance Scorecard */}
              <Panel
                title="Compliance Scorecard"
                icon={<ShieldCheck size={18} />}
                action={
                  <button className="btn btn-icon" onClick={fetchComplianceData} disabled={complianceLoading}>
                    <RefreshCw size={14} className={complianceLoading ? 'spin' : ''} />
                  </button>
                }
              >
                {!selectedAgent ? (
                  <div className="text-muted">Select an agent</div>
                ) : (
                  <>
                    <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                      <div
                        style={{
                          fontSize: '4.5rem',
                          fontWeight: 800,
                          color: 'var(--success)',
                          lineHeight: 1,
                          textShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        {complianceScore}
                      </div>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '2px',
                          marginTop: '8px',
                        }}
                      >
                        Overall Rating
                      </div>
                    </div>
                    <div className="flex-col gap-3">
                      {complianceEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between"
                          style={{
                            padding: 'var(--space-2) var(--space-3)',
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--glass-border)',
                            fontSize: '0.75rem',
                          }}
                        >
                          <span className="text-muted">{event.text}</span>
                          <span
                            style={{
                              color: event.type === 'warning' ? 'var(--warning)' : 'var(--success)',
                              fontWeight: 600,
                            }}
                          >
                            {event.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Panel>

              {/* Audit Trail */}
              <Panel title="Audit Trail & Alerts" icon={<AlertTriangle size={18} />}>
                <div className="flex-col gap-3">
                  {complianceEvents.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        padding: 'var(--space-4)',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: `4px solid ${
                          event.type === 'success'
                            ? 'var(--success)'
                            : event.type === 'warning'
                            ? 'var(--warning)'
                            : 'var(--primary)'
                        }`,
                      }}
                    >
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>{event.text}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{event.time}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </motion.div>
        )}

        {activeTab === 'Shield' && (
          <motion.div
            key="shield"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
          >
            {/* BAA Registry + HIPAA Controls row */}
            <div className="grid-cols-2">
              {/* Smart BAA Registry */}
              <Panel
                title="Smart BAA Registry"
                icon={<Shield size={18} color="var(--gold)" />}
                action={
                  <button className="btn btn-primary btn-sm" onClick={() => setIsProposeModalOpen(true)}>
                    <FileText size={14} style={{ marginRight: '6px' }} /> Propose New
                  </button>
                }
              >
                <div className="flex-col gap-4">
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                    Cryptographically-bound Business Associate Agreements (BAAs) mapping AI Agents to Healthcare Providers.
                  </div>
                  <div className="table-container">
                    <table className="table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Assoc (Agent)</th>
                          <th>Status</th>
                          <th>Stake</th>
                          <th>Doc Hash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {baas.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                              No BAAs found.
                            </td>
                          </tr>
                        ) : (
                          baas.map((baa) => (
                            <tr key={baa.id}>
                              <td className="mono">{baa.businessAssociate.substring(0, 10)}...</td>
                              <td>
                                <StatusBadge status={baa.status} />
                              </td>
                              <td className="mono" style={{ color: 'var(--gold)' }}>
                                {baa.stakedITK}
                              </td>
                              <td className="mono" title={baa.documentHash}>
                                {baa.documentHash.substring(0, 8)}...
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Panel>

              {/* HIPAA Gateway Controls */}
              <Panel title="HIPAA Gateway Controls" icon={<ShieldAlert size={18} color="var(--gold)" />}>
                <div className="flex-col gap-4">
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Pre-execution filters enforced by the BCC (Boundary Control Concept) Middleware.
                  </div>
                  {[
                    { label: 'PHI Edge-Blinding', sub: 'HMAC-SHA256 Anonymous Pointers' },
                    { label: 'Intent Locking (BCC)', sub: 'Prompt-level compliance gating' },
                    { label: 'Parametric Liability', sub: 'Automated ITK Slashing logic active' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between"
                      style={{
                        padding: 'var(--space-3)',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--gold-muted)',
                      }}
                    >
                      <div className="flex-col">
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.label}</span>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>{item.sub}</span>
                      </div>
                      <CheckCircle size={18} color="var(--success)" />
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            {/* Interaction Logs + Violations row */}
            <div className="grid-cols-3" style={{ gap: 'var(--space-6)' }}>
              <div className="col-span-2">
                <Panel
                  title="Medical Record Interaction Logs"
                  icon={<Activity size={18} color="var(--gold)" />}
                  action={
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        const csv =
                          'Time,Action,Agent,BAA_Ref,Result\n' +
                          interactions
                            .map((i) => `${i.time},${i.action},${i.agent},${i.baaId},${i.status}`)
                            .join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'medical_interactions.csv';
                        a.click();
                      }}
                    >
                      Export Logs
                    </button>
                  }
                >
                  <div className="table-container">
                    <table className="table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Action</th>
                          <th>Agent</th>
                          <th>BAA Ref</th>
                          <th>BCC Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {interactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                              Scanning for gateway activity...
                            </td>
                          </tr>
                        ) : (
                          interactions.map((int) => (
                            <tr key={int.id}>
                              <td className="mono text-muted">{int.time}</td>
                              <td style={{ fontWeight: 600 }}>{int.action}</td>
                              <td className="mono">{int.agent}</td>
                              <td className="mono" style={{ color: 'var(--gold)' }}>
                                {int.baaId}
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background:
                                      int.status === 'PASSED'
                                        ? 'rgba(16, 185, 129, 0.1)'
                                        : 'rgba(244, 63, 94, 0.1)',
                                    color: int.status === 'PASSED' ? 'var(--success)' : 'var(--danger)',
                                    border: `1px solid ${
                                      int.status === 'PASSED'
                                        ? 'rgba(16, 185, 129, 0.2)'
                                        : 'rgba(244, 63, 94, 0.2)'
                                    }`,
                                    fontWeight: 700,
                                  }}
                                >
                                  {int.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </div>

              <div className="col-span-1">
                <Panel title="Compliance Review Queue" icon={<AlertTriangle size={18} color="var(--danger)" />}>
                  <div className="flex-col gap-4">
                    {violations.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: 'var(--space-8)',
                          color: 'var(--text-muted)',
                          fontSize: '0.85rem',
                        }}
                      >
                        <CheckCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                        No pending violations for manual review.
                      </div>
                    ) : (
                      violations.map((v) => (
                        <div
                          key={v.id}
                          style={{
                            background: 'rgba(244, 63, 94, 0.05)',
                            border: '1px solid rgba(244, 63, 94, 0.2)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-4)',
                          }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-col">
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--danger)' }}>
                                {v.type.toUpperCase()}
                              </span>
                              <span
                                style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}
                                className="mono"
                              >
                                {v.time} | {v.agent}
                              </span>
                            </div>
                            <ShieldAlert size={16} color="var(--danger)" />
                          </div>
                          <p style={{ fontSize: '0.75rem', marginBottom: 'var(--space-4)', lineHeight: 1.4 }}>
                            {v.detail}
                          </p>
                          <div className="flex gap-2">
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ flex: 1 }}
                              onClick={() => handleResolveViolation(v.id, 'finalize_slash')}
                            >
                              <Gavel size={14} style={{ marginRight: '6px' }} /> Slash Stake
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ flex: 1, border: '1px solid var(--border)' }}
                              onClick={() => handleResolveViolation(v.id, 'dismiss')}
                            >
                              <Trash2 size={14} style={{ marginRight: '6px' }} /> Dismiss
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Panel>
              </div>
            </div>

            {/* ProposeBAAModal */}
            <ProposeBAAModal
              isOpen={isProposeModalOpen}
              onClose={() => setIsProposeModalOpen(false)}
              onSuccess={() => {
                setIsProposeModalOpen(false);
                fetchShieldData();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
