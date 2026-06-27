import { useState, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import { Key, Copy, CheckCircle, AlertTriangle, Trash2, Clock, Plus } from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { api } from '../../services/api';

interface APIKey {
  api_key: string;
  created_at: string;
  expires_at: string;
}

export function APIKeyPanel() {
  const { addToast } = useDashboard();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [newKey, setNewKey] = useState<APIKey | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expirationDays, setExpirationDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const keys = await api.getApiKeys();
      setApiKeys((keys as APIKey[]) || []);
    } catch (err: any) {
      addToast('error', `Failed to fetch API Keys: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateApiKey(expirationDays);
      setNewKey(res as any);
      setApiKeys(prev => [...prev, res as any]);
      addToast('success', 'New Developer API Key generated');
    } catch (err: any) {
      addToast('error', `Failed to generate API Key: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteKey = async (key: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;
    
    setIsDeleting(key);
    try {
      await api.deleteApiKey(key);
      setApiKeys(prev => prev.filter(k => k.api_key !== key));
      if (newKey?.api_key === key) setNewKey(null);
      addToast('success', 'API Key deleted');
    } catch (err: any) {
      addToast('error', `Failed to delete API Key: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex-col gap-6">
      <Panel title="Developer API Keys" icon={<Key size={18} />}>
        <div className="flex-col gap-6">
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>
            Generate a Developer API Key to authenticate your agent with the Integrity Oracle without a hardware-backed DID. 
            Agents using this auth bypass are mathematically capped at a Trust Level (AIS) of <strong style={{ color: 'var(--primary)' }}>300</strong>.
          </div>

          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ marginBottom: 'var(--space-3)', fontSize: '0.9rem', fontWeight: 600 }}>Generate New Key</h4>
            <div className="flex items-center gap-4">
              <div className="flex-col gap-1">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expiration (Days)</label>
                <select 
                  className="input" 
                  value={expirationDays} 
                  onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                  style={{ minWidth: '120px' }}
                >
                  <option value={7}>7 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={365}>1 Year</option>
                </select>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handleGenerateKey}
                disabled={isGenerating}
                style={{ marginTop: 'auto' }}
              >
                {isGenerating ? 'Generating...' : <><Plus size={16} style={{ marginRight: '8px' }} /> Generate Key</>}
              </button>
            </div>
          </div>

          {newKey && (
            <div style={{ padding: 'var(--space-4)', background: 'rgba(0, 255, 135, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--success)' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--success)' }}>
                <CheckCircle size={16} /> 
                <span style={{ fontWeight: 600 }}>New Key Generated</span>
              </div>
              <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
                Please copy this key now. For security reasons, it will never be shown again in full.
              </div>
              
              <div className="flex gap-2 items-center">
                <input 
                  type="text" 
                  className="input mono" 
                  value={newKey.api_key} 
                  readOnly 
                  style={{ flex: 1, letterSpacing: '1px' }}
                />
                <button className="btn" onClick={() => copyToClipboard(newKey.api_key)} style={{ minWidth: '100px' }}>
                  {copiedKey === newKey.api_key ? 'Copied!' : <><Copy size={16} style={{ marginRight: '8px' }} /> Copy</>}
                </button>
              </div>
            </div>
          )}

          <div className="flex-col gap-3">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Active API Keys</h4>
            {isLoading ? (
              <div className="text-muted" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>Loading keys...</div>
            ) : apiKeys.length === 0 ? (
              <div className="text-muted" style={{ padding: 'var(--space-4)', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                No active API keys found.
              </div>
            ) : (
              <div className="flex-col gap-2">
                {apiKeys.map((key) => (
                  <div 
                    key={key.api_key} 
                    className="flex items-center justify-between" 
                    style={{ 
                      padding: 'var(--space-3) var(--space-4)', 
                      background: 'var(--bg-secondary)', 
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div className="flex-col gap-1">
                      <div className="mono" style={{ fontSize: '0.85rem' }}>
                        {key.api_key.substring(0, 12)}...{key.api_key.substring(key.api_key.length - 4)}
                      </div>
                      <div className="flex items-center gap-3" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1"><Clock size={12} /> Expires: {new Date(key.expires_at).toLocaleDateString()}</span>
                        <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => copyToClipboard(key.api_key)}
                        title="Copy Key"
                      >
                        {copiedKey === key.api_key ? 'Copied' : <Copy size={14} />}
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => handleDeleteKey(key.api_key)}
                        disabled={isDeleting === key.api_key}
                        style={{ color: 'var(--danger)' }}
                        title="Delete Key"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: 'var(--space-3)', background: 'rgba(255, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger)', display: 'flex', gap: '12px' }}>
            <AlertTriangle size={20} color="var(--danger)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
              <strong>Security Warning:</strong> Never commit your API key to public repositories. If your key is compromised, delete it immediately and generate a new one.
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
