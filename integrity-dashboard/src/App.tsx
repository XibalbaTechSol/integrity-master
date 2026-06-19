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
import { TrajectoryPanel } from './components/tabs/TrajectoryPanel';

import React from 'react';

const TabContainer = React.memo(({ isActive, PanelComponent }: { isActive: boolean, PanelComponent: React.ComponentType }) => {
  const MemoizedPanel = React.useMemo(() => <PanelComponent />, [PanelComponent]);
  return (
    <div style={{ display: isActive ? 'block' : 'none', height: '100%' }}>
      {MemoizedPanel}
    </div>
  );
});

function DashboardShell() {
  const { activeTab } = useDashboard();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <TabNav />
        <main className="content-area">
          <TabContainer isActive={activeTab === 'telemetry'} PanelComponent={TelemetryPanel} />
          <TabContainer isActive={activeTab === 'identity'} PanelComponent={IdentityPanel} />
          <TabContainer isActive={activeTab === 'ledger'} PanelComponent={LedgerPanel} />
          <TabContainer isActive={activeTab === 'zk'} PanelComponent={ZKProverPanel} />
          <TabContainer isActive={activeTab === 'factory'} PanelComponent={FactoryPanel} />
          <TabContainer isActive={activeTab === 'compliance'} PanelComponent={CompliancePanel} />
          <TabContainer isActive={activeTab === 'shield'} PanelComponent={ShieldPanel} />
          <TabContainer isActive={activeTab === 'oracle'} PanelComponent={OracleRegistryPanel} />
          <TabContainer isActive={activeTab === 'credit'} PanelComponent={CreditPanel} />
          <TabContainer isActive={activeTab === 'markets'} PanelComponent={MarketsPanel} />
          <TabContainer isActive={activeTab === 'staking'} PanelComponent={StakingPanel} />
          <TabContainer isActive={activeTab === 'stability'} PanelComponent={StabilityPanel} />
          <TabContainer isActive={activeTab === 'governance'} PanelComponent={GovernancePanel} />
          <TabContainer isActive={activeTab === 'trajectory'} PanelComponent={TrajectoryPanel} />
          <TabContainer isActive={activeTab === 'advanced'} PanelComponent={AdvancedPanel} />
          <TabContainer isActive={activeTab === 'wallet'} PanelComponent={WalletPanel} />
          <TabContainer isActive={activeTab === 'apikeys'} PanelComponent={APIKeyPanel} />
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
