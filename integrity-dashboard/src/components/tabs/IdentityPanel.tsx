import { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Panel } from '../shared/Panel';
import { Key, Users, ShieldCheck } from 'lucide-react';
import { DIDExplorer } from '../legacy-ui/DIDExplorer';
import { AgentOnboarding } from '../legacy-ui/AgentOnboarding';

export function IdentityPanel() {
  const { selectedAgent, fetchData } = useDashboard();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  return (
    <div className="flex-col gap-6">
      <div className="grid-cols-2">
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
        </div>

        <div className="flex-col gap-6">
          <Panel title="Register New Agent" icon={<Users size={18} />}>
            <div className="flex-col gap-4">
               <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                  Deploy a new autonomous agent identity to the network using our interactive secure onboarding flow.
               </p>
               <button className="btn btn-success" onClick={() => setIsRegisterModalOpen(true)}>
                 <ShieldCheck size={16} /> Open Registration Flow
               </button>
            </div>
            {isRegisterModalOpen && (
               <AgentOnboarding 
                 isOpen={isRegisterModalOpen} 
                 onClose={() => setIsRegisterModalOpen(false)} 
                 onSuccess={() => { setIsRegisterModalOpen(false); fetchData(); }} 
               />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
