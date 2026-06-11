import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FactoryPanel } from '../../src/components/tabs/FactoryPanel';
import { useDashboard } from '../../src/context/DashboardContext';
import { mockDashboardContext } from './test-utils';
import { api } from '../../src/services/api';

vi.mock('../../src/context/DashboardContext', () => ({
  useDashboard: vi.fn(),
}));

vi.mock('../../src/services/api', () => ({
  api: {
    deployContract: vi.fn(),
  },
}));

const mockAgent = {
  eth_address: '0x1234567890abcdef',
  alias: 'Test Factory',
};

describe('FactoryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state', () => {
    (useDashboard as any).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: null,
    });

    render(<FactoryPanel />);
    expect(screen.getByText(/Contract Logic Template/i)).toBeInTheDocument();
  });

  it('changes contract template when type is selected', () => {
    (useDashboard as any).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: mockAgent,
    });

    render(<FactoryPanel />);
    const select = screen.getByLabelText(/Contract Type/i);
    fireEvent.change(select, { target: { value: 'Escrow' } });

    expect(screen.getByText(/AutonomousEscrow/i)).toBeInTheDocument();
  });

  it('deploys a contract successfully', async () => {
    const addToastMock = vi.fn();
    (useDashboard as any).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: mockAgent,
      addToast: addToastMock,
    });

    (api.deployContract as any).mockResolvedValue({
      contract_address: '0xnewcontract',
      status: 'deployed'
    });

    render(<FactoryPanel />);
    
    const deployBtn = screen.getByRole('button', { name: /Compile & Deploy Contract/i });
    fireEvent.click(deployBtn);

    await waitFor(() => {
      expect(api.deployContract).toHaveBeenCalled();
      expect(addToastMock).toHaveBeenCalledWith('success', expect.stringContaining('0xnewcontract'));
    }, { timeout: 3000 });
  });

  it('handles deployment failure', async () => {
    const addToastMock = vi.fn();
    (useDashboard as any).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: mockAgent,
      addToast: addToastMock,
    });

    (api.deployContract as any).mockRejectedValue(new Error('Out of gas'));

    render(<FactoryPanel />);
    
    const deployBtn = screen.getByRole('button', { name: /Compile & Deploy Contract/i });
    fireEvent.click(deployBtn);

    await waitFor(() => {
      expect(addToastMock).toHaveBeenCalledWith('error', expect.stringContaining('Out of gas'));
    }, { timeout: 3000 });
  });
});
