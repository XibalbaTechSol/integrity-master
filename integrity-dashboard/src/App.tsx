import React, { Suspense, lazy } from 'react';
import { DashboardProvider } from './context/DashboardProvider';
import { useDashboard } from './context/useDashboard';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { TabNav } from './components/layout/TabNav';
import { ToastManager } from './components/shared/Toast';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Landing Page
import { LandingPage } from './pages/LandingPage';

// Lazy load all panels
const TelemetryPanel = lazy(() => import('./components/tabs/TelemetryPanel').then(m => ({ default: m.TelemetryPanel })));
const IdentityPanel = lazy(() => import('./components/tabs/IdentityPanel').then(m => ({ default: m.IdentityPanel })));
const LedgerPanel = lazy(() => import('./components/tabs/LedgerPanel').then(m => ({ default: m.LedgerPanel })));
const ZKProverPanel = lazy(() => import('./components/tabs/ZKProverPanel').then(m => ({ default: m.ZKProverPanel })));
const FactoryPanel = lazy(() => import('./components/tabs/FactoryPanel').then(m => ({ default: m.FactoryPanel })));
const CompliancePanel = lazy(() => import('./components/tabs/CompliancePanel').then(m => ({ default: m.CompliancePanel })));
const ShieldPanel = lazy(() => import('./components/tabs/ShieldPanel').then(m => ({ default: m.ShieldPanel })));
const OracleRegistryPanel = lazy(() => import('./components/tabs/OracleRegistryPanel').then(m => ({ default: m.OracleRegistryPanel })));
const CreditPanel = lazy(() => import('./components/tabs/CreditPanel').then(m => ({ default: m.CreditPanel })));
const GovernancePanel = lazy(() => import('./components/tabs/GovernancePanel').then(m => ({ default: m.GovernancePanel })));
const MarketsPanel = lazy(() => import('./components/tabs/MarketsPanel').then(m => ({ default: m.MarketsPanel })));
const StakingPanel = lazy(() => import('./components/tabs/StakingPanel').then(m => ({ default: m.StakingPanel })));
const StabilityPanel = lazy(() => import('./components/tabs/StabilityPanel').then(m => ({ default: m.StabilityPanel })));
const AdvancedPanel = lazy(() => import('./components/tabs/AdvancedPanel').then(m => ({ default: m.AdvancedPanel })));
const WalletPanel = lazy(() => import('./components/tabs/WalletPanel').then(m => ({ default: m.WalletPanel })));
const APIKeyPanel = lazy(() => import('./components/tabs/APIKeyPanel').then(m => ({ default: m.APIKeyPanel })));
const TrajectoryPanel = lazy(() => import('./components/tabs/TrajectoryPanel').then(m => ({ default: m.TrajectoryPanel })));

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
    <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
  </div>
);

function DashboardShell() {
  const { activeTab } = useDashboard();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <TabNav />
        <main className="content-area">
          <Suspense fallback={<LoadingFallback />}>
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
            {activeTab === 'trajectory' && <TrajectoryPanel />}
            {activeTab === 'advanced' && <AdvancedPanel />}
            {activeTab === 'wallet' && <WalletPanel />}
            {activeTab === 'apikeys' && <APIKeyPanel />}
          </Suspense>
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
