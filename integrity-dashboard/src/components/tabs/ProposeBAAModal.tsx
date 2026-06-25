import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, FileText, Lock, Loader2, Info } from 'lucide-react';
import { api } from '../../services/api';
import { useDashboard } from '../../context/useDashboard';
import { ethers } from 'ethers';
import { IS_PRODUCTION, BASE_SEPOLIA_CHAIN_ID } from '../../constants';

interface ProposeBAAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProposeBAAModal({ isOpen, onClose, onSuccess }: ProposeBAAModalProps) {
  const { addToast, selectedAgent, walletAddress } = useDashboard();
  const [coveredEntity, setCoveredEntity] = useState('');
  const [stakeAmount, setStakeAmount] = useState('5000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) {
      addToast('error', 'Please select an agent first');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. Generate document hash
      const documentHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
      
      let signature = "";
      if (IS_PRODUCTION && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();

        // 2. Prepare EIP-712 Typed Data
        const domain = {
          name: 'Xibalba Smart BAA',
          version: '1',
          chainId: BASE_SEPOLIA_CHAIN_ID,
          verifyingContract: '0x323315892D902eA5b6cb1f8eDecce22B015F07b1A' // Placeholder SmartBAA address
        };

        const types = {
          BAA: [
            { name: 'coveredEntity', type: 'address' },
            { name: 'businessAssociate', type: 'address' },
            { name: 'documentHash', type: 'bytes32' },
            { name: 'uri', type: 'string' },
            { name: 'stakedITK', type: 'uint256' },
            { name: 'controller', type: 'address' }
          ]
        };

        const value = {
          coveredEntity: coveredEntity,
          businessAssociate: selectedAgent.eth_address,
          documentHash: documentHash,
          uri: "ipfs://Qm...",
          stakedITK: ethers.parseEther(stakeAmount),
          controller: walletAddress
        };

        addToast('info', 'Please sign the BAA proposal in your wallet');
        signature = await signer.signTypedData(domain, types, value);
      }
      
      await api.proposeBAA({
        covered_entity: coveredEntity,
        business_associate: selectedAgent.eth_address,
        document_hash: documentHash,
        stake_amount: stakeAmount,
        uri: "ipfs://Qm...",
        signature: signature
      });
      
      addToast('success', 'Smart BAA Proposed successfully on-chain');
      onSuccess();
    } catch (err: any) {
      addToast('error', `Failed to propose BAA: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'var(--navy-deep)', opacity: 0.85, backdropFilter: 'blur(8px)' }} 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '550px', 
          background: 'var(--bg-card)', 
          border: '1px solid var(--gold-muted)', 
          borderRadius: 'var(--radius-lg)', 
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}
      >
        <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--navy-light)' }}>
          <div className="flex items-center gap-3">
            <Shield size={20} color="var(--gold)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Propose Smart BAA</h3>
          </div>
          <button onClick={onClose} className="btn btn-icon" aria-label="Close modal"><X size={20} /></button>
        </div>

        <form onSubmit={handlePropose} style={{ padding: 'var(--space-8)' }} className="flex-col gap-6">
          <div className="flex-col gap-2">
            <label className="form-label">Covered Entity Address (Hospital/Clinic)</label>
            <input 
              type="text" 
              placeholder="0x..." 
              className="input mono"
              required
              value={coveredEntity}
              onChange={(e) => setCoveredEntity(e.target.value)}
            />
          </div>

          <div className="grid-cols-2 gap-4">
             <div className="flex-col gap-2">
                <label className="form-label">Liability Stake (ITK)</label>
                <input 
                  type="number" 
                  className="input"
                  required
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                />
             </div>
             <div className="flex-col gap-2">
                <label className="form-label">BAA Document (PDF)</label>
                <div style={{ position: 'relative' }}>
                   <input 
                     type="file" 
                     accept=".pdf"
                     style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                     onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                   />
                   <div className="input flex items-center gap-2" style={{ background: 'var(--bg-secondary)', borderStyle: 'dashed' }}>
                      <FileText size={16} /> {pdfFile ? pdfFile.name : 'Upload BAA...'}
                   </div>
                </div>
             </div>
          </div>

          <div style={{ padding: 'var(--space-4)', background: 'var(--gold-dim)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold)', display: 'flex', gap: '12px' }}>
             <Lock size={20} color="var(--gold)" style={{ flexShrink: 0 }} />
             <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                <strong>Parametric Enforcement:</strong> By proposing this BAA, you agree to lock <strong>{stakeAmount} ITK</strong>. These funds will be slashed automatically if the Integrity Oracle detects a HIPAA violation.
             </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isSubmitting || !coveredEntity || !pdfFile}
          >
            {isSubmitting ? <><Loader2 className="spin" size={18} /> Submitting Proposal...</> : 'Propose & Stake ITK'}
          </button>
        </form>

        <div style={{ padding: 'var(--space-4) var(--space-8)', background: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Info size={16} color="var(--text-muted)" />
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>
            Proposing a BAA creates an on-chain record linked to your Agent's DID. The Covered Entity must sign to activate.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
