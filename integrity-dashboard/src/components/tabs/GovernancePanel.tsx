import { useState, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import { Shield, ThumbsUp, ThumbsDown, CheckCircle, Clock } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { api } from '../../services/api';

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

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'prop-101',
    title: 'Increase Minimum ITK Stake for Validator Nodes',
    category: 'economic',
    description: 'Raise the minimum required stake from 10,000 ITK to 15,000 ITK to increase sybil resistance.',
    status: 'active',
    votes_for: 250000,
    votes_against: 120000,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'prop-102',
    title: 'Upgrade Oracle Registry to v2',
    category: 'protocol',
    description: 'Migrate to the newly audited v2 smart contracts that support zero-knowledge proofs on L2.',
    status: 'active',
    votes_for: 850000,
    votes_against: 15000,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'prop-100',
    title: 'Adjust Default Liquidation Ratio to 120%',
    category: 'economic',
    description: 'Lower the liquidation ratio to increase capital efficiency for high-AIS agents.',
    status: 'passed',
    votes_for: 1200000,
    votes_against: 400000,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString()
  }
];

export function GovernancePanel() {
  const { addToast } = useDashboard();
  const [proposals, setProposals] = useState<Proposal[]>(() => {
    const saved = localStorage.getItem('integrity_proposals');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('protocol');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem('integrity_proposals', JSON.stringify(proposals));
  }, [proposals]);

  useEffect(() => {
    api.getProposals()
      .then((data: any[]) => {
        // Map backend schema to frontend schema
        const mappedProposals: Proposal[] = data.map(item => ({
          id: item.proposal_id || item.id,
          title: item.title,
          category: item.category,
          description: item.description,
          status: item.status?.toLowerCase() === 'active' ? 'active' : item.status?.toLowerCase() === 'passed' ? 'passed' : 'rejected',
          votes_for: item.votes_for || Math.floor(Math.random() * 500000), // mock votes if missing
          votes_against: item.votes_against || Math.floor(Math.random() * 100000),
          created_at: item.created_at
        }));
        
        // Merge with local storage proposals to persist newly created ones
        const combined = [...mappedProposals];
        proposals.forEach(p => {
          if (!combined.find(c => c.id === p.id)) {
            combined.push(p);
          }
        });
        
        setProposals(combined);
        setIsLoading(false);
      })
      .catch(() => {
        // Fallback for demonstration when backend is offline
        if (proposals.length === 0) {
          setProposals(MOCK_PROPOSALS);
        }
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVote = async (id: string, type: 'for' | 'against') => {
    try {
      await api.voteProposal(id, type);
      addToast('success', `Vote cast successfully`);
    } catch (err) {
      // Simulate optimistic update if backend is offline
      addToast('success', `Vote cast locally (Offline Mode)`);
    }
    
    setProposals(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          votes_for: type === 'for' ? p.votes_for + 10000 : p.votes_for,
          votes_against: type === 'against' ? p.votes_against + 10000 : p.votes_against
        };
      }
      return p;
    }));
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
      created_at: new Date().toISOString()
    };

    try {
      await api.createProposal(newProp);
      addToast('success', 'Proposal submitted to the network');
    } catch (err) {
      addToast('success', 'Proposal submitted locally (Offline Mode)');
    }

    setProposals(prev => [newProp, ...prev]);
    setNewTitle('');
    setNewDesc('');
    setIsSubmitting(false);
  };

  const activeProposals = proposals.filter(p => p.status === 'active');
  const pastProposals = proposals.filter(p => p.status !== 'active');

  return (
    <div className="grid-cols-2">
      <div className="flex-col gap-6">
        <Panel title="Active Proposals" icon={<Shield size={18} />}>
          {isLoading ? (
            <div className="skeleton" style={{ height: '200px' }} />
          ) : activeProposals.length === 0 ? (
            <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              No active governance proposals.
            </div>
          ) : (
            <div className="flex-col gap-4">
              {activeProposals.map(p => {
                const totalVotes = p.votes_for + p.votes_against;
                const forPercent = totalVotes > 0 ? (p.votes_for / totalVotes) * 100 : 0;
                
                return (
                  <div key={p.id} style={{ background: 'var(--bg-secondary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                    <div className="flex justify-between items-start mb-2">
                      <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1.1rem' }}>{p.title}</div>
                      <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.id}</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
                      {p.description}
                    </div>
                    
                    {/* Voting Progress */}
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                      <div className="flex justify-between" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--success)' }}>For: {p.votes_for.toLocaleString()} ITK</span>
                        <span style={{ color: 'var(--danger)' }}>Against: {p.votes_against.toLocaleString()} ITK</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${forPercent}%`, background: 'var(--success)', height: '100%' }}></div>
                        <div style={{ width: `${100 - forPercent}%`, background: 'var(--danger)', height: '100%' }}></div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="btn" style={{ flex: 1, borderColor: 'var(--success)', color: 'var(--success)' }} onClick={() => handleVote(p.id, 'for')}>
                        <ThumbsUp size={16} /> Vote For
                      </button>
                      <button className="btn" style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleVote(p.id, 'against')}>
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

      <div className="flex-col gap-6">
        <Panel title="Create Proposal" icon={<Shield size={18} />}>
          <form className="flex-col gap-4" onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input type="text" className="input" required value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="select" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                <option value="protocol">Protocol Upgrade</option>
                <option value="economic">Economic Parameter</option>
                <option value="security">Security Adjustment</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description & Rationale</label>
              <textarea className="input" rows={4} required value={newDesc} onChange={e => setNewDesc(e.target.value)}></textarea>
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              Submit Proposal (Requires 100 ITK Stake)
            </button>
          </form>
        </Panel>

        <Panel title="Proposal History" icon={<Clock size={18} />}>
          {isLoading ? (
            <div className="skeleton" style={{ height: '100px' }} />
          ) : pastProposals.length === 0 ? (
             <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
               No historical proposals found.
             </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Proposal</th><th>Category</th><th>Status</th></tr></thead>
                <tbody>
                  {pastProposals.map(p => (
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
  );
}
