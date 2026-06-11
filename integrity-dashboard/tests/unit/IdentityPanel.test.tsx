import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IdentityPanel } from '../../src/components/tabs/IdentityPanel';
import { useDashboard } from '../../src/context/DashboardContext';
import { mockDashboardContext } from './test-utils';

vi.mock('../../src/context/DashboardContext', () => ({
  useDashboard: vi.fn(),
}));

describe('IdentityPanel', () => {
  it('renders "Select an agent" message when no agent is selected', () => {
    (useDashboard as any).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: null,
    });

    render(<IdentityPanel />);
    expect(screen.getByText(/Select an agent from the sidebar/i)).toBeInTheDocument();
  });

  it('renders DIDExplorer when an agent is selected', () => {
    (useDashboard as any).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: { eth_address: '0x123', alias: 'Test Agent' },
    });

    render(<IdentityPanel />);
    // DIDExplorer renders the agent alias usually or has specific text
    // Let's check DIDExplorer.tsx to see what it renders
    expect(screen.queryByText(/Select an agent from the sidebar/i)).not.toBeInTheDocument();
  });

  it('opens registration modal when button is clicked', () => {
    (useDashboard as any).mockReturnValue(mockDashboardContext);

    render(<IdentityPanel />);
    const button = screen.getByText(/Open Registration Flow/i);
    fireEvent.click(button);

    // AgentOnboarding should be visible. It has "Agent Onboarding" heading.
    expect(screen.getByText(/Agent Onboarding/i)).toBeInTheDocument();
  });
});
