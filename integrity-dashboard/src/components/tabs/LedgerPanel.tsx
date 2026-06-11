import { useState, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import { useDashboard } from '../../context/DashboardContext';
import { StatusBadge } from '../shared/StatusBadge';
import { Layers, Search, Cpu, Activity, User, ShoppingCart, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import type { OwnedContract } from '../../types';

export function LedgerPanel() {
  const [contracts, setContracts] = useState<OwnedContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListing, setIsListing] = useState<string | null>(null);

  const { agents, selectedAgent, addToast } = useDashboard();

  useEffect(() => {
    fetchContracts();
  }, [agents]);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAllContracts();
      // Handle both paginated object and direct array
      if (Array.isArray(data)) {
        setContracts(data);
      } else if (data && typeof data === 'object' && Array.isArray((data as any).logs)) {
        setContracts((data as any).logs);
      } else {
        setContracts([]);
      }
    } catch (err) {
      // Fallback
      const allContracts = agents.flatMap(a => a.owned_contracts || []);
      setContracts(allContracts as OwnedContract[]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleListInMarket = async (contract: OwnedContract) => {
    if (!selectedAgent) return;
    setIsListing(contract.contract_address);
    try {
      await api.listMarketContract({
        contract_address: contract.contract_address,
        title: `${selectedAgent.alias}: ${contract.contract_type} Service`,
        description: `Autonomous contract for ${contract.contract_type} execution via Factory instance.`,
        reward_itk: contract.revenue_generated > 0 ? contract.revenue_generated : 100.0,
        min_ais_required: selectedAgent.current_ais
      });
      addToast('success', 'Contract listed in A2A Marketplace');
    } catch (err: any) {
      addToast('error', `Listing failed: ${err.message}`);
    } finally {
      setIsListing(null);
    }
  };

  const filtered = contracts.filter(c => 
    c.contract_address.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.contract_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid-cols-2">
      <div className="flex-col gap-6">
        <Panel title="Selected Agent Ledger Scope" icon={<User size={18} />}>
          {!selectedAgent ? (
            <div className="text-muted" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
              Select an agent to view localized scope.
            </div>
          ) : (
            <div className="flex-col gap-4">
              <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontWeight: 600, fontSize: '1.25rem', color: 'var(--primary)', marginBottom: 'var(--space-2)' }}>
                  {selectedAgent.alias}
                </div>
                <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: 'var(--space-4)' }}>
                  {selectedAgent.eth_address}
                </div>
                <div className="grid-cols-2">
                  <div style={{ background: 'var(--surface)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                    <div className="flex items-center gap-2 text-muted" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                      <Activity size={14} /> AIS Score
                    </div>
                    <div className="mono" style={{ fontSize: '1.25rem', color: 'var(--success)' }}>
                      {selectedAgent.current_ais}
                    </div>
                  </div>
                  <div style={{ background: 'var(--surface)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                    <div className="flex items-center gap-2 text-muted" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                      <Cpu size={14} /> Model
                    </div>
                    <div style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>
                      {selectedAgent.model_class}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: 'var(--space-3)', background: 'var(--primary-dim)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
                  A2A Market Integration
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                  Use the "List" action on your deployed contracts to offer them as autonomous services in the global mesh network.
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <div className="flex-col gap-6">
        <Panel title="Smart Contract Ledger" icon={<Layers size={18} />}>
          <div className="flex items-center gap-2 mb-4" style={{ background: 'var(--surface)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search by address or type..." 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '0.875rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="table-container">
            {isLoading ? (
              <div className="skeleton" style={{ height: '300px' }} />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Address</th>
                    <th>Chain</th>
                    <th>Revenue</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.contract_address}>
                      <td><StatusBadge status={c.contract_type} /></td>
                      <td className="mono" title={c.contract_address}>
                        {c.contract_address.substring(0, 10)}...
                      </td>
                      <td style={{ fontSize: '0.75rem' }}>{c.chain?.replace('-', ' ') || 'Base'}</td>
                      <td style={{ color: 'var(--success)' }}>${c.revenue_generated || 0}</td>
                      <td>
                        <button 
                          className="btn btn-icon" 
                          title="List in A2A Marketplace"
                          onClick={() => handleListInMarket(c)}
                          disabled={isListing === c.contract_address || !selectedAgent}
                        >
                          {isListing === c.contract_address ? <RefreshCw size={14} className="spin" /> : <ShoppingCart size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No contracts found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
