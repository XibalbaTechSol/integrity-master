import { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Panel } from '../shared/Panel';
import { StatusBadge } from '../shared/StatusBadge';
import { Wallet, Send, ArrowDownLeft, ArrowUpRight, RefreshCw, CreditCard } from 'lucide-react';
import { api } from '../../services/api';

export function WalletPanel() {
  const { walletAddress, walletBalance, agents, fetchData, addToast } = useDashboard();
  
  // Transfer Form State
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !recipient || !amount) return;

    setIsTransferring(true);
    try {
      await api.transferTokens(walletAddress, recipient, parseFloat(amount));
      addToast('success', `Transferred ${amount} ITK to ${recipient.substring(0, 8)}...`);
      setAmount('');
      fetchData();
    } catch (err: any) {
      addToast('error', `Transfer failed: ${err.message}`);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleRepayFromWallet = async (loanId: string, amount: number) => {
    if (!walletAddress) return;
    try {
      // Logic: First transfer to agent, then repay. 
      // For simplicity in the MVP, we assume the Oracle can direct-repay from the controller if authorized.
      await api.repay(walletAddress, {
        loan_id: loanId,
        amount_itk: amount
      });
      addToast('success', 'Loan repayment processed from controller wallet');
      fetchData();
    } catch (err: any) {
      addToast('error', `Repayment failed: ${err.message}`);
    }
  };

  return (
    <div className="flex-col gap-6">
      <div className="grid-cols-3">
        <Panel title="Personal ITK Wallet" icon={<Wallet size={18} />} className="flex-col justify-between">
          {!walletAddress ? (
            <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
              Connect MetaMask to view wallet state.
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>
                  {walletBalance.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Available ITK Balance
                </div>
              </div>
              <div className="flex justify-between items-center" style={{ padding: 'var(--space-2) 0', borderTop: '1px solid var(--glass-border)' }}>
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>Wallet Address</span>
                <span className="mono" style={{ fontSize: '0.75rem' }}>{walletAddress.substring(0, 10)}...</span>
              </div>
              <div className="flex justify-between items-center" style={{ padding: 'var(--space-2) 0', borderTop: '1px solid var(--glass-border)' }}>
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>Network</span>
                <StatusBadge status="base-sepolia" type="info" />
              </div>
            </>
          )}
        </Panel>

        <Panel title="Authorize ITK Transfer" icon={<Send size={18} />} style={{ gridColumn: 'span 2' }}>
          <form onSubmit={handleTransfer} className="flex-col gap-4">
            <div className="grid-cols-2" style={{ gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Recipient Address or Agent</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="0x... or select agent" 
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  required
                />
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {agents.map(a => (
                    <button 
                      key={a.eth_address}
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: '0.65rem', padding: '2px 6px', whiteSpace: 'nowrap' }}
                      onClick={() => setRecipient(a.eth_address)}
                    >
                      {a.alias}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (ITK)</label>
                <input 
                  type="number" 
                  className="input" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Max: {walletBalance.toLocaleString()} ITK
                </div>
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={!walletAddress || isTransferring || !amount}>
              {isTransferring ? <RefreshCw className="spin" size={16} /> : <ArrowUpRight size={16} />}
              Execute Secure Transfer
            </button>
          </form>
        </Panel>
      </div>

      <div className="grid-cols-2">
        <Panel title="Repayment Bridge" icon={<CreditCard size={18} />}>
          <div className="flex-col gap-4">
            <div className="text-muted" style={{ fontSize: '0.875rem' }}>
              Directly repay agent loans using your controller wallet balance to maintain fleet AIS health.
            </div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Agent</th><th>Loan Balance</th><th>Due</th><th>Action</th></tr></thead>
                <tbody>
                  {agents.flatMap(a => (a.credit_profile?.active_loans || []).map(l => ({ agent: a, loan: l }))).map(({ agent, loan }) => (
                    <tr key={loan.loan_id}>
                      <td>{agent.alias}</td>
                      <td className="mono">{(loan.principal - loan.repaid_amount).toLocaleString()} ITK</td>
                      <td style={{ fontSize: '0.75rem' }}>{new Date(loan.due_date).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn btn-ghost" 
                          style={{ color: 'var(--success)', fontSize: '0.75rem', padding: '4px 8px' }}
                          onClick={() => handleRepayFromWallet(loan.loan_id, 1000)}
                          disabled={!walletAddress || loan.status === 'repaid'}
                        >
                          Repay 1k
                        </button>
                      </td>
                    </tr>
                  ))}
                  {agents.every(a => !a.credit_profile?.active_loans?.length) && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-4)' }} className="text-muted">No active agent loans detected.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>

        <Panel title="Recent Activity" icon={<ArrowDownLeft size={18} />}>
           <div className="flex-col gap-4">
              <div className="flex items-center justify-between" style={{ padding: 'var(--space-2)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <div className="flex items-center gap-3">
                  <div style={{ color: 'var(--success)' }}><ArrowDownLeft size={16} /></div>
                  <div style={{ fontSize: '0.875rem' }}>Received from L2 Bridge</div>
                </div>
                <div className="mono" style={{ color: 'var(--success)' }}>+5,000 ITK</div>
              </div>
              <div className="flex items-center justify-between" style={{ padding: 'var(--space-2)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <div className="flex items-center gap-3">
                  <div style={{ color: 'var(--primary)' }}><ArrowUpRight size={16} /></div>
                  <div style={{ fontSize: '0.875rem' }}>Stake: Agent Alpha</div>
                </div>
                <div className="mono">-10,000 ITK</div>
              </div>
              <div className="flex items-center justify-between" style={{ padding: 'var(--space-2)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <div className="flex items-center gap-3">
                  <div style={{ color: 'var(--warning)' }}><RefreshCw size={16} /></div>
                  <div style={{ fontSize: '0.875rem' }}>Loan Repayment: Agent Beta</div>
                </div>
                <div className="mono">-2,500 ITK</div>
              </div>
           </div>
        </Panel>
      </div>
    </div>
  );
}
