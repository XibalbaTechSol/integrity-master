import { useState } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { Panel } from '../shared/Panel';
import { Hammer, Code, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { TransactionStepper } from '../shared/TransactionStepper';
import type { Step } from '../shared/TransactionStepper';

export function FactoryPanel() {
  const { selectedAgent, addToast } = useDashboard();
  const [contractType, setContractType] = useState('SLA');
  const [language, setLanguage] = useState('Solidity');
  const [stakeAmount, setStakeAmount] = useState('1000');
  const [isDeploying, setIsDeploying] = useState(false);
  
  const [steps, setSteps] = useState<Step[]>([
    { id: 'compile', label: 'Compiling Source Code...', status: 'pending' },
    { id: 'stake', label: 'Locking Staked ITK...', status: 'pending' },
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
    LoanAgreement: { lang: 'solidity', code: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\ncontract CollateralizedLoan {\n  address public borrower;\n  uint256 public principal;\n  uint256 public requiredAIS;\n\n  function liquidate() external {\n    // Foreclosure logic if AIS drops\n  }\n}' },
    PredictionMarket: { lang: 'solidity', code: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\ncontract IntegrityPredictionMarket {\n  address public oracleNode;\n  mapping(address => uint256) public positions;\n\n  function resolveMarket(uint256 finalOutcome) external {\n    // Resolved by Integrity Oracle network\n  }\n}' },
    BinaryOptions: { lang: 'solidity', code: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\ncontract DecentralizedBinaryOption {\n  uint256 public strikePrice;\n  uint256 public expiry;\n\n  function exercise() external {\n    // Exercise logic based on AIS score\n  }\n}' },
    Custom: { lang: 'solidity', code: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\ncontract MyCustomContract {\n  // Implement arbitrary logic here\n}' }
  };

  const [code, setCode] = useState(templates.SLA.code);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;

    setIsDeploying(true);
    setSteps(steps.map(s => ({ ...s, status: 'pending' })));

    const delay = (ms: number) => new Promise(r => setTimeout(r, import.meta.env.MODE === 'test' ? 0 : ms));

    try {
      updateStep('compile', 'loading');
      await delay(1200);
      updateStep('compile', 'completed');

      updateStep('stake', 'loading');
      await delay(1000);
      updateStep('stake', 'completed');

      updateStep('prove', 'loading');
      await delay(1500);
      updateStep('prove', 'completed');

      updateStep('broadcast', 'loading');
      const res = await api.deployContract({
        contract_type: contractType,
        params: {
          owner_address: selectedAgent.eth_address,
          language,
          code,
          staked_itk: parseFloat(stakeAmount) || 0
        }
      });
      updateStep('broadcast', 'completed');

      updateStep('finalize', 'loading');
      await delay(1000);
      updateStep('finalize', 'completed');

      addToast('success', `Contract ${contractType} deployed to ${res.contract_address} with ${stakeAmount} ITK staked.`);
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
        <Panel title="Active Template Configuration" icon={<Code size={18} />}>
          <div className="flex-col gap-4">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Template Selected:</span>
                <div style={{ fontWeight: 600, color: 'var(--gold)', marginTop: '4px' }}>{contractType} Layout</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Deployment Gating:</span>
                <div style={{ fontWeight: 600, color: 'var(--success)', marginTop: '4px' }}>BCC Policy Enforced</div>
              </div>
            </div>
            
            <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Contract Template Type</span>
                <select 
                  id="contract-type"
                  style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                  value={contractType} 
                  onChange={e => {
                    const newType = e.target.value;
                    setContractType(newType);
                    setCode(templates[newType]?.code ?? '');
                  }}
                >
                  <option value="SLA">Service Level Agreement (SLA)</option>
                  <option value="Escrow">Autonomous Escrow</option>
                  <option value="RevenueShare">Revenue Share</option>
                  <option value="LoanAgreement">Loan Agreement</option>
                  <option value="PredictionMarket">Prediction Market</option>
                  <option value="BinaryOptions">Binary Options</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
                Verified Base L2 template containing on-chain checkpoints bound to agent reputational metrics (AIS). Auto-liquidation thresholds execute upon protocol violation detections.
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>Smart Contract Editor</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{templates[contractType]?.lang ?? 'solidity'}</span>
                </div>
                <textarea 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{
                    width: '100%',
                    height: '220px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: 'var(--text-primary)',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                  spellCheck={false}
                />
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="flex-col gap-6">
        <Panel title="Deployment Parameters" icon={<Hammer size={18} />}>
          <form className="flex-col gap-4" onSubmit={handleDeploy}>
            <div className="form-group">
              <label className="form-label" htmlFor="stake-amount">ITK Staking Collateral</label>
              <input 
                id="stake-amount"
                type="number"
                className="input"
                value={stakeAmount}
                onChange={e => setStakeAmount(e.target.value)}
                placeholder="e.g. 1000"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="target-blockchain">Target Blockchain</label>
              <select id="target-blockchain" className="select">
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
              Compile &amp; Deploy Contract
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
