import { useState } from 'react';
import { Panel } from '../shared/Panel';
import { Key, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { api } from '../../services/api';

export function APIKeyPanel() {
  const { addToast } = useDashboard();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      // The user specifically requested to use the real endpoint, no mocking
      const res = await api.generateApiKey();
      setApiKey(res.api_key);
      addToast('success', 'New Developer API Key generated');
      setCopied(false);
    } catch (err: any) {
      addToast('error', `Failed to generate API Key: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-col gap-6">
      <Panel title="Developer API Keys" icon={<Key size={18} />}>
        <div className="flex-col gap-4">
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>
            Generate a Developer API Key to authenticate your agent with the Integrity Oracle without a hardware-backed DID. 
            Agents using this auth bypass are mathematically capped at a Trust Level (AIS) of <strong style={{ color: 'var(--primary)' }}>300</strong>.
          </div>

          {!apiKey ? (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleGenerateKey}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating Secure Key...' : 'Generate New API Key'}
              </button>
            </div>
          ) : (
            <div className="flex-col gap-4" style={{ marginTop: 'var(--space-2)' }}>
              <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--success)' }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--success)' }}>
                  <CheckCircle size={16} /> 
                  <span style={{ fontWeight: 600 }}>Key Generated Successfully</span>
                </div>
                <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
                  Please copy this key now. For security reasons, it will never be shown again.
                </div>
                
                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    className="input mono" 
                    value={apiKey} 
                    readOnly 
                    style={{ flex: 1, letterSpacing: '1px' }}
                  />
                  <button className="btn" onClick={copyToClipboard} style={{ minWidth: '100px' }}>
                    {copied ? 'Copied!' : <><Copy size={16} style={{ marginRight: '8px' }} /> Copy</>}
                  </button>
                </div>
              </div>

              <div style={{ padding: 'var(--space-3)', background: 'rgba(255, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger)', display: 'flex', gap: '12px' }}>
                <AlertTriangle size={20} color="var(--danger)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                  <strong>Security Warning:</strong> Never commit your API key to public repositories. If your key is compromised, generate a new one immediately. Previous keys will be automatically rotated out.
                </div>
              </div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
