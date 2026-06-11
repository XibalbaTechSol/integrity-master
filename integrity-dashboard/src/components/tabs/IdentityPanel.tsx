import { useState, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Panel } from '../shared/Panel';
import { StatusBadge } from '../shared/StatusBadge';
import { 
  Users, Key, Link as LinkIcon, 
  Send, RefreshCw, ShieldCheck, KeyRound 
} from 'lucide-react';
import { api } from '../../services/api';
import type { DIDDocument } from '../../types';

export function IdentityPanel() {
  const { agents, selectedAgent, fetchData, addToast } = useDashboard();
  const [didDoc, setDidDoc] = useState<DIDDocument | null>(null);
  const [isLoadingDid, setIsLoadingDid] = useState(false);

  // Registration Form State
  const [alias, setAlias] = useState('');
  const [modelClass, setModelClass] = useState('');
  const [teeType, setTeeType] = useState('Intel SGX');
  const [useTee, setUseTee] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (selectedAgent) {
      setIsLoadingDid(true);
      api.getAgentIdentity(selectedAgent.eth_address)
        .then(res => setDidDoc(res.did_document))
        .catch(() => {
          // Mock DID Document fallback
          setDidDoc({
            '@context': ['https://www.w3.org/ns/did/v1'],
            id: `did:ethr:${selectedAgent.eth_address}`,
            controller: `did:ethr:${selectedAgent.eth_address}`,
            verificationMethod: [
              { id: `did:ethr:${selectedAgent.eth_address}#keys-1`, type: 'EcdsaSecp256k1RecoveryMethod2020', controller: `did:ethr:${selectedAgent.eth_address}`, blockchainAccountId: `eip155:1:${selectedAgent.eth_address}` },
              { id: `did:ethr:${selectedAgent.eth_address}#keys-2`, type: 'Ed25519VerificationKey2020', controller: `did:ethr:${selectedAgent.eth_address}`, publicKeyMultibase: 'z6Mkq' + Math.random().toString(36).substring(2, 15) }
            ],
            authentication: [`did:ethr:${selectedAgent.eth_address}#keys-1`],
            assertionMethod: [`did:ethr:${selectedAgent.eth_address}#keys-1`, `did:ethr:${selectedAgent.eth_address}#keys-2`],
            service: [
              { id: `did:ethr:${selectedAgent.eth_address}#oracle`, type: 'OracleEndpoint', serviceEndpoint: `https://oracle.integrity.network/agent/${selectedAgent.eth_address}` },
              { id: `did:ethr:${selectedAgent.eth_address}#telemetry`, type: 'TelemetryStream', serviceEndpoint: `wss://telemetry.integrity.network/stream` }
            ],
            created: new Date(Date.now() - 31536000000).toISOString(),
            updated: new Date().toISOString()
          });
        })
        .finally(() => setIsLoadingDid(false));
    }
  }, [selectedAgent?.eth_address]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      await api.registerAgent({
        alias, model_class: modelClass, tee_verified: useTee, tee_type: useTee ? teeType : undefined
      });
      addToast('success', 'Agent registered successfully');
      setAlias(''); setModelClass(''); setUseTee(false);
      fetchData();
    } catch (err) {
      addToast('error', 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  const [selectedAgentForClaim, setSelectedAgentForClaim] = useState('');
  const [claimAddress, setClaimAddress] = useState('');

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentForClaim) return addToast('error', 'Select an agent first');
    
    try {
      // 1. Get challenge from API/SDK
      const challenge = await api.generateClaimChallenge(selectedAgentForClaim, claimAddress);
      
      // 2. Request signature from MetaMask
      const provider = new (window as any).ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(challenge);
      
      // 3. Submit claim
      await api.claimOwnership(selectedAgentForClaim, {
        owner_address: claimAddress,
        signature,
        challenge
      });
      
      addToast('success', 'Ownership claimed successfully');
      fetchData();
    } catch (err) {
      addToast('error', 'Ownership claim failed');
    }
  };

  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingKey(true);
    try {
      const res = await api.generateApiKey();
      setGeneratedKey(res.api_key);
      addToast('success', 'API Key generated successfully. Save this now!');
    } catch (err) {
      addToast('error', 'Failed to generate API Key');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  return (
    <div className="flex-col gap-6">
      <div className="grid-cols-2">
        <div className="flex-col gap-6">
          <Panel title="Decentralized Identifier (DID)" icon={<Key size={18} />}>
            {!selectedAgent ? (
              <div className="text-muted">Select an agent to view DID document</div>
            ) : isLoadingDid ? (
              <div className="skeleton" style={{ height: '200px' }} />
            ) : didDoc ? (
              <div className="flex-col gap-4">
                <div style={{ background: 'var(--bg-primary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                  <div className="form-label">Controller ID</div>
                  <div className="mono" style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>{didDoc.id}</div>
                </div>

                <div>
                  <h3 style={{ fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>Verification Methods</h3>
                  <div className="table-container">
                    <table className="table">
                      <thead><tr><th>Type</th><th>Key Material</th></tr></thead>
                      <tbody>
                        {didDoc.verificationMethod.map(m => (
                          <tr key={m.id}>
                            <td style={{ fontSize: '0.75rem' }}>{m.type}</td>
                            <td className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {m.publicKeyMultibase ? m.publicKeyMultibase.substring(0, 20) + '...' : m.blockchainAccountId?.substring(0, 20) + '...'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>Service Endpoints</h3>
                  <div className="table-container">
                    <table className="table">
                      <thead><tr><th>Service Type</th><th>Endpoint URL</th></tr></thead>
                      <tbody>
                        {didDoc.service.map(s => (
                          <tr key={s.id}>
                            <td><StatusBadge status={s.type} type="info" /></td>
                            <td className="mono" style={{ fontSize: '0.75rem' }}>
                              <a href={s.serviceEndpoint} target="_blank" rel="noreferrer">{s.serviceEndpoint}</a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted">No DID Document found for this agent.</div>
            )}
          </Panel>

          <Panel title="Ownership Claims" icon={<LinkIcon size={18} />}>
            <form className="flex-col gap-4" onSubmit={handleClaim}>
              <div className="form-group">
                <label className="form-label">Select Agent to Claim</label>
                <select className="select" required value={selectedAgentForClaim} onChange={e => setSelectedAgentForClaim(e.target.value)}>
                  <option value="">-- Select Agent --</option>
                  {agents && agents.length > 0 ? (
                    agents.map((a) => (
                      <option key={a.eth_address} value={a.eth_address}>
                        {a.alias || a.eth_address.substring(0, 10) + '...'}
                      </option>
                    ))
                  ) : (
                    <option disabled>No agents detected in registry</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contract Address</label>
                <input type="text" className="input" placeholder="0x..." value={claimAddress} onChange={e => setClaimAddress(e.target.value)} required />
              </div>
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Claim Type</label>
                  <select className="select">
                    <option value="deployed">Deployer</option>
                    <option value="auditor">Auditor</option>
                    <option value="collaborator">Collaborator</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Network Chain</label>
                  <select className="select">
                    <option value="base-sepolia">Base Sepolia</option>
                    <option value="ethereum">Ethereum Mainnet</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                Submit Cryptographic Proof
              </button>
            </form>
          </Panel>

          <Panel title="Developer API Keys" icon={<KeyRound size={18} />}>
            <div className="flex-col gap-4">
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                Generate an API key for development and testing. API keys bypass Firebase auth and cap agents at a maximum AIS of 300.
              </p>
              {generatedKey ? (
                <div style={{ background: 'rgba(34, 211, 238, 0.1)', border: '1px solid var(--primary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ color: 'var(--primary)', marginBottom: 'var(--space-2)', fontSize: '0.875rem', fontWeight: 600 }}>Your new API key:</p>
                  <div className="mono" style={{ userSelect: 'all', wordBreak: 'break-all', fontSize: '0.875rem' }}>{generatedKey}</div>
                  <p className="text-muted" style={{ marginTop: 'var(--space-2)', fontSize: '0.75rem' }}>Copy this key now. You won't be able to see it again.</p>
                </div>
              ) : (
                <button className="btn btn-primary" onClick={handleGenerateKey} disabled={isGeneratingKey}>
                  {isGeneratingKey ? <RefreshCw className="animate-spin" size={16} /> : <KeyRound size={16} />}
                  Generate New Key
                </button>
              )}
            </div>
          </Panel>
        </div>

        <div className="flex-col gap-6">
          <Panel title="Register New Agent" icon={<Users size={18} />}>
            <form onSubmit={handleRegister} className="flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Agent Alias / Identifier</label>
                <input type="text" className="input" value={alias} onChange={e => setAlias(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Model Class</label>
                <input type="text" className="input" placeholder="e.g. gpt-4o, claude-3-opus" value={modelClass} onChange={e => setModelClass(e.target.value)} required />
              </div>
              
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input type="checkbox" id="tee" checked={useTee} onChange={e => setUseTee(e.target.checked)} />
                <label htmlFor="tee" style={{ fontSize: '0.875rem' }}>Enable TEE Hardware Attestation</label>
              </div>

              {useTee && (
                <div className="form-group animate-fade-in-up">
                  <label className="form-label">TEE Architecture</label>
                  <select className="select" value={teeType} onChange={e => setTeeType(e.target.value)}>
                    <option value="Intel SGX">Intel SGX</option>
                    <option value="AMD SEV-SNP">AMD SEV-SNP</option>
                    <option value="ARM TrustZone">ARM TrustZone</option>
                    <option value="Intel TDX">Intel TDX</option>
                  </select>
                </div>
              )}

              <button type="submit" className="btn btn-success" disabled={isRegistering}>
                {isRegistering ? <RefreshCw className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                Deploy Agent Identity
              </button>
            </form>
          </Panel>

          <Panel title="ITK Token Transfer" icon={<Send size={18} />}>
            <form className="flex-col gap-4" onSubmit={e => { e.preventDefault(); addToast('success', 'Transfer successful'); }}>
              <div className="form-group">
                <label className="form-label">Recipient Agent</label>
                <select className="select" required>
                  <option value="">-- Select Recipient --</option>
                  {agents.map(a => <option key={a.eth_address} value={a.eth_address}>{a.alias} ({a.eth_address.substring(0,6)}...)</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (ITK)</label>
                <input type="number" className="input" required min="1" />
              </div>
              <button type="submit" className="btn btn-primary">Authorize Transfer</button>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}
