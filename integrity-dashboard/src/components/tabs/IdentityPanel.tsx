import { useState } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { Panel } from '../shared/Panel';
import { Key, Users, ShieldCheck, Search, Link as LinkIcon } from 'lucide-react';
import { DIDExplorer } from '../legacy-ui/DIDExplorer';
import { AgentOnboarding } from '../legacy-ui/AgentOnboarding';
import { XNSSearchService } from '../legacy-ui/XNSSearchService';
import { ClaimAgentModal } from './ClaimAgentModal';

export function IdentityPanel() {
  const { selectedAgent, fetchData } = useDashboard();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  return (
    <div className="flex-col gap-6">
      <Panel title="Decentralized Identifier (DID)" icon={<Key size={18} />}>
        {selectedAgent ? (
          <DIDExplorer agent={selectedAgent} />
        ) : (
          <div className="text-muted" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
            Select an agent from the sidebar to view its Decentralized Identity Document.
          </div>
        )}
      </Panel>

      <Panel title="XNS Search Service" icon={<Search size={18} />}>
        <XNSSearchService />
      </Panel>

      <Panel title="Identity Management" icon={<Users size={18} />}>
        <div className="flex-col gap-4">
           <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              Manage your autonomous agent identities. You can either deploy a new identity or claim ownership of an existing one.
           </p>
           <div className="flex gap-3">
             <button className="btn btn-primary" onClick={() => setIsRegisterModalOpen(true)} style={{ flex: 1 }}>
               <ShieldCheck size={16} style={{ marginRight: '8px' }} /> Register New
             </button>
             <button className="btn btn-outline" onClick={() => setIsClaimModalOpen(true)} style={{ flex: 1 }}>
               <LinkIcon size={16} style={{ marginRight: '8px' }} /> Claim Existing
             </button>
           </div>
        </div>
      </Panel>
      
      {isRegisterModalOpen && (
         <AgentOnboarding 
           isOpen={isRegisterModalOpen} 
           onClose={() => setIsRegisterModalOpen(false)} 
           onSuccess={() => { setIsRegisterModalOpen(false); fetchData(); }} 
         />
      )}
      {isClaimModalOpen && (
         <ClaimAgentModal 
           isOpen={isClaimModalOpen} 
           onClose={() => setIsClaimModalOpen(false)} 
           onSuccess={() => { setIsClaimModalOpen(false); fetchData(); }} 
         />
      )}
    </div>
  );
}
