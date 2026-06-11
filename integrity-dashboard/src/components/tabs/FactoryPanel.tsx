import { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Panel } from '../shared/Panel';
import { Hammer, Code, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { TransactionStepper } from '../shared/TransactionStepper';
import type { Step } from '../shared/TransactionStepper';

export function FactoryPanel() {
  const { selectedAgent, addToast } = useDashboard();
  const [contractType, setContractType] = useState('SLA');
  const [language, setLanguage] = useState('Solidity');
  const [isDeploying, setIsDeploying] = useState(false);
  
  const [steps, setSteps] = useState<Step[]>([
    { id: 'compile', label: 'Compiling Source Code...', status: 'pending' },
    { id: 'prove', label: 'Generating ZK-Integrity Proof...', status: 'pending' },
    { id: 'broadcast', label: 'Broadcasting to Base L2...', status: 'pending' },
    { id: 'finalize', label: 'Waiting for Oracle Finality...', status: 'pending' },
  ]);

  const updateStep = (id: string, status: Step['status']) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const templates: Record<string, { lang: string, code: string }> = {
    SLA: { lang: 'solidity', code: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\ncontract ServiceLevelAgreement {\n  address public provider;\n  uint256 public minAIS = 800;\n\n  function verifyPerformance() external view returns (bool) {\n    // Oracle-verified logic\n    return true;\n  }\n}' },
    Escrow: { lang: 'solidity', code: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\ncontract AutonomousEscrow {\n  address public arbiter = 0x67bA5D723E1F5517afF7eb980E2f73a9e17aD556;\n  \n  function release() external {\n    // Released only if AIS > threshold\n  }\n}' },
    RevenueShare: { lang: 'solidity', code: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\ncontract RevShare {\n  mapping(address => uint256) public shares;\n  \n  function distribute() external {\n    // Split ITK based on equity\n  }\n}' },
    LoanAgreement: { lang: 'solidity', code: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\ncontract CollateralizedLoan {\n  address public borrower;\n  uint256 public principal;\n  uint256 public requiredAIS;\n\n  function liquidate() external {\n    // Foreclosure logic if AIS drops\n  }\n}' }
  };

  const [code, setCode] = useState(templates.SLA.code);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;

    setIsDeploying(true);
    setSteps(steps.map(s => ({ ...s, status: 'pending' })));

    try {
      updateStep('compile', 'loading');
      await new Promise(r => setTimeout(r, 1500));
      updateStep('compile', 'completed');

      updateStep('prove', 'loading');
      await new Promise(r => setTimeout(r, 2000));
      updateStep('prove', 'completed');

      updateStep('broadcast', 'loading');
      const res = await api.deployContract({
        owner_address: selectedAgent.eth_address,
        contract_type: contractType,
        language,
        code
      });
      updateStep('broadcast', 'completed');

      updateStep('finalize', 'loading');
      await new Promise(r => setTimeout(r, 1000));
      updateStep('finalize', 'completed');

      addToast('success', `Contract ${contractType} deployed to ${res.contract_address}`);
    } catch (err: any) {
      setSteps(prev => prev.map(s => s.status === 'loading' ? { ...s, status: 'error' } : s));
      addToast('error', `Deployment failed: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="grid-cols-2">
      <div className="flex-col gap-6">
        <Panel title="Contract Logic Template" icon={<Code size={18} />}>
          <div className="flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Contract Type</label>
              <select 
                className="select" 
                value={contractType} 
                onChange={e => {
                  setContractType(e.target.value);
                  setCode(templates[e.target.value].code);
                }}
              >
                <option value="SLA">Service Level Agreement (SLA)</option>
                <option value="Escrow">Autonomous Escrow</option>
                <option value="RevenueShare">Revenue Share</option>
                <option value="LoanAgreement">Loan Agreement</option>
              </select>
            </div>
            
            <div style={{ height: '350px', background: '#0a0a0c', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <pre style={{ margin: 0, padding: 'var(--space-4)', fontSize: '0.75rem', color: 'var(--primary)', height: '100%', overflowY: 'auto' }}>
                <code>{code}</code>
              </pre>
            </div>
          </div>
        </Panel>
      </div>

      <div className="flex-col gap-6">
        <Panel title="Deployment Parameters" icon={<Hammer size={18} />}>
          <form className="flex-col gap-4" onSubmit={handleDeploy}>
            <div className="form-group">
              <label className="form-label">Target Blockchain</label>
              <select className="select">
                <option value="base">Base L2 (Mainnet-Ready)</option>
                <option value="eth">Ethereum Mainnet</option>
                <option value="arb">Arbitrum One</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Compiler Language</label>
              <div className="flex gap-2">
                {['Solidity', 'Vyper', 'Noir (ZK)'].map(l => (
                  <button 
                    key={l} 
                    type="button"
                    className={`btn ${language === l ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setLanguage(l)}
                    style={{ flex: 1, fontSize: '0.75rem' }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {isDeploying && (
              <div className="animate-fade-in">
                <TransactionStepper title="Deployment Pipeline" steps={steps} />
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} disabled={isDeploying || !selectedAgent}>
              {isDeploying ? <RefreshCw className="animate-spin" size={16} /> : <Hammer size={16} />}
              Compile & Deploy Contract
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
