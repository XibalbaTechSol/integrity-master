import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { TabNav } from './components/layout/TabNav';
import { ToastManager } from './components/shared/Toast';

// Placeholder imports for tabs (we'll implement these next)
import { TelemetryPanel } from './components/tabs/TelemetryPanel';
import { IdentityPanel } from './components/tabs/IdentityPanel';
import { LedgerPanel } from './components/tabs/LedgerPanel';
import { ZKProverPanel } from './components/tabs/ZKProverPanel';
import { FactoryPanel } from './components/tabs/FactoryPanel';
import { CompliancePanel } from './components/tabs/CompliancePanel';
import { CreditPanel } from './components/tabs/CreditPanel';
import { GovernancePanel } from './components/tabs/GovernancePanel';
import { MarketsPanel } from './components/tabs/MarketsPanel';
import { StakingPanel } from './components/tabs/StakingPanel';
import { StabilityPanel } from './components/tabs/StabilityPanel';
import { AdvancedPanel } from './components/tabs/AdvancedPanel';
import { WalletPanel } from './components/tabs/WalletPanel';

function DashboardShell() {
  const { activeTab } = useDashboard();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <TabNav />
        <main className="content-area">
          {activeTab === 'telemetry' && <TelemetryPanel />}
          {activeTab === 'identity' && <IdentityPanel />}
          {activeTab === 'ledger' && <LedgerPanel />}
          {activeTab === 'zk' && <ZKProverPanel />}
          {activeTab === 'factory' && <FactoryPanel />}
          {activeTab === 'compliance' && <CompliancePanel />}
          {activeTab === 'credit' && <CreditPanel />}
          {activeTab === 'markets' && <MarketsPanel />}
          {activeTab === 'staking' && <StakingPanel />}
          {activeTab === 'stability' && <StabilityPanel />}
          {activeTab === 'governance' && <GovernancePanel />}
          {activeTab === 'advanced' && <AdvancedPanel />}
          {activeTab === 'wallet' && <WalletPanel />}
        </main>
      </div>
      <ToastManager />
    </div>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <DashboardShell />
    </DashboardProvider>
  );
}
