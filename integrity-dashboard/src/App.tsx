import { DashboardProvider } from './context/DashboardProvider';
import { useDashboard } from './context/useDashboard';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { TabNav } from './components/layout/TabNav';
import { ToastManager } from './components/shared/Toast';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Landing Page
import { LandingPage } from './pages/LandingPage';

// Tabs
import { TelemetryPanel } from './components/tabs/TelemetryPanel';
import { IdentityPanel } from './components/tabs/IdentityPanel';
import { LedgerPanel } from './components/tabs/LedgerPanel';
import { ZKProverPanel } from './components/tabs/ZKProverPanel';
import { FactoryPanel } from './components/tabs/FactoryPanel';
import { CompliancePanel } from './components/tabs/CompliancePanel';
import { ShieldPanel } from './components/tabs/ShieldPanel';
import { OracleRegistryPanel } from './components/tabs/OracleRegistryPanel';
import { CreditPanel } from './components/tabs/CreditPanel';
import { GovernancePanel } from './components/tabs/GovernancePanel';
import { MarketsPanel } from './components/tabs/MarketsPanel';
import { StakingPanel } from './components/tabs/StakingPanel';
import { StabilityPanel } from './components/tabs/StabilityPanel';
import { AdvancedPanel } from './components/tabs/AdvancedPanel';
import { WalletPanel } from './components/tabs/WalletPanel';
import { APIKeyPanel } from './components/tabs/APIKeyPanel';

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
          {activeTab === 'shield' && <ShieldPanel />}
          {activeTab === 'oracle' && <OracleRegistryPanel />}
          {activeTab === 'credit' && <CreditPanel />}
          {activeTab === 'markets' && <MarketsPanel />}
          {activeTab === 'staking' && <StakingPanel />}
          {activeTab === 'stability' && <StabilityPanel />}
          {activeTab === 'governance' && <GovernancePanel />}
          {activeTab === 'advanced' && <AdvancedPanel />}
          {activeTab === 'wallet' && <WalletPanel />}
          {activeTab === 'apikeys' && <APIKeyPanel />}
        </main>
      </div>
      <ToastManager />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/dashboard" 
          element={
            <DashboardProvider>
              <DashboardShell />
            </DashboardProvider>
          } 
        />
        <Route 
          path="/login" 
          element={
            <DashboardProvider>
              <DashboardShell />
            </DashboardProvider>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
