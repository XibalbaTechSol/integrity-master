import { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Panel } from '../shared/Panel';
import { StatusBadge } from '../shared/StatusBadge';
import { Coins, HandCoins, Clock, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

export function CreditPanel() {
  const { selectedAgent, addToast, fetchData } = useDashboard();
  
  // Loan Form State
  const [borrowAmount, setBorrowAmount] = useState('5000');
  const [termDays, setTermDays] = useState('30');
  const [isSubmitting, setIsBorrowing] = useState(false);

  // Derived calculations
  const p = parseFloat(borrowAmount) || 0;
  const ais = selectedAgent?.current_ais || 500;
  const interestRate = Math.max(1.5, 12 - (ais / 100)); // Dynamic rate based on AIS
  const borrowLimit = selectedAgent?.credit_profile?.max_borrow_limit || 10000;
  const isOverLimit = p > borrowLimit;

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    
    setIsBorrowing(true);
    try {
      await api.borrow(selectedAgent.eth_address, {
        amount_itk: p,
        term_days: parseInt(termDays)
      });
      addToast('success', 'Loan approved and funded via protocol credit');
      if (fetchData) await fetchData();
    } catch (err: any) {
      addToast('error', `Loan failed: ${err.message}`);
    } finally {
      setIsBorrowing(false);
    }
  };

  const handleRepay = async (loanId: string, amount: number) => {
    if (!selectedAgent) return;
    try {
      await api.repay(selectedAgent.eth_address, {
        loan_id: loanId,
        amount_itk: amount
      });
      addToast('success', 'Repayment processed successfully');
      if (fetchData) await fetchData();
    } catch (err: any) {
      addToast('error', `Repayment failed: ${err.message}`);
    }
  };

  const activeLoans = selectedAgent?.credit_profile?.active_loans || [];

  return (
    <div className="flex-col gap-6">
      <div className="grid-cols-3">
        <Panel title="Credit Profile" icon={<Coins size={18} />} className="flex-col justify-between">
          {!selectedAgent ? <div className="text-muted">Select an agent</div> : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                  {selectedAgent?.credit_profile?.credit_score || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Protocol Credit Score
                </div>
              </div>
              <div className="flex justify-between" style={{ padding: 'var(--space-2) 0', borderTop: '1px solid var(--glass-border)' }}>
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>Borrow Limit</span>
                <span className="mono" style={{ color: 'var(--success)' }}>{borrowLimit.toLocaleString()} ITK</span>
              </div>
              <div className="flex justify-between" style={{ padding: 'var(--space-2) 0', borderTop: '1px solid var(--glass-border)' }}>
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>Total Borrowed</span>
                <span className="mono">{(selectedAgent?.credit_profile?.total_borrowed || 0).toLocaleString()} ITK</span>
              </div>
              <div className="flex justify-between" style={{ padding: 'var(--space-2) 0', borderTop: '1px solid var(--glass-border)' }}>
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>Defaults</span>
                <span className="mono" style={{ color: (selectedAgent?.credit_profile?.default_count || 0) > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {selectedAgent?.credit_profile?.default_count || 0}
                </span>
              </div>
            </>
          )}
        </Panel>

        <Panel title="AIS Collateralized Loan" icon={<HandCoins size={18} />} style={{ gridColumn: 'span 2' }}>
          <form onSubmit={handleBorrow} className="grid-cols-2">
            <div className="flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Principal Amount (ITK)</label>
                <input type="number" className="input" value={borrowAmount} onChange={e => setBorrowAmount(e.target.value)} required />
                {isOverLimit && <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '4px' }}>Exceeds maximum borrow limit</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Term Duration</label>
                <select className="select" value={termDays} onChange={e => setTermDays(e.target.value)}>
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>
            </div>

            <div className="flex-col gap-4">
              <div style={{ background: 'var(--bg-primary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', height: '100%' }}>
                <div className="flex justify-between mb-2">
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Interest Rate (APR)</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold)' }}>{interestRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Estimated Repayment</span>
                  <span className="mono" style={{ fontSize: '1rem', fontWeight: 700 }}>
                    {(p * (1 + (interestRate / 100) * (parseInt(termDays) / 365))).toFixed(2)} ITK
                  </span>
                </div>
                
                <div style={{ padding: 'var(--space-2)', background: 'var(--primary-dim)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                   Collateral is automatically bound to your Agent's verified ITK stake and future revenue stream.
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-4)' }} disabled={!selectedAgent || isOverLimit || isSubmitting}>
                  {isSubmitting ? <RefreshCw className="spin" size={16} /> : 'Submit Loan Application'}
                </button>
              </div>
            </div>
          </form>
        </Panel>
      </div>

      <Panel title="Active Loans" icon={<Clock size={18} />}>
        {!selectedAgent ? (
          <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>Select an agent to view active loans.</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Principal</th>
                  <th>APR</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Repayment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.map((loan: any) => {
                  const totalDue = loan.principal * (1 + (loan.interest_rate));
                  const progress = (loan.repaid_amount / totalDue) * 100; 
                  return (
                    <tr key={loan.loan_id}>
                      <td className="mono" title={loan.loan_id}>{loan.loan_id.substring(0, 12)}...</td>
                      <td className="mono" style={{ color: 'var(--gold)' }}>{loan.principal.toLocaleString()} ITK</td>
                      <td>{(loan.interest_rate * 100).toFixed(1)}%</td>
                      <td>{new Date(loan.due_date).toLocaleDateString()}</td>
                      <td><StatusBadge status={loan.status.toLowerCase()} /></td>
                      <td style={{ minWidth: '150px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px' }}>
                          <span>{loan.repaid_amount.toLocaleString()} ITK</span>
                          <span className="text-muted">{Math.round(progress)}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, progress)}%`, background: 'var(--success)' }} />
                        </div>
                      </td>
                      <td>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--success)' }} 
                          onClick={() => handleRepay(loan.loan_id, 1000.0)}
                          disabled={loan.status === 'repaid'}
                        >
                          Repay 1k
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {activeLoans.length === 0 && (
                  <tr><td colSpan={7} className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No active loans found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
