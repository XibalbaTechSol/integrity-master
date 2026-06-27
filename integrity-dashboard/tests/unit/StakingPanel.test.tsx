import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StakingPanel } from '../../src/components/tabs/StakingPanel';
import { useDashboard } from '../../src/context/DashboardContext';
import { mockDashboardContext } from './test-utils';
import { api } from '../../src/services/api';

vi.mock('../../src/context/DashboardContext', () => ({
  useDashboard: vi.fn(),
}));

vi.mock('../../src/services/api', () => ({
  api: {
    stake: vi.fn(),
  },
}));

const mockAgent = {
  eth_address: '0x123',
  alias: 'Test Staker',
  staked_itk: 10000,
};

describe('StakingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state', () => {
    (useDashboard as unknown).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: null,
    });

    render(<StakingPanel />);
    expect(screen.getByText(/Total ITK Staked/i)).toBeInTheDocument();
    expect(screen.getByText(/Please select an agent to manage bonds/i)).toBeInTheDocument();
  });

  it('renders agent stake when selected', () => {
    (useDashboard as unknown).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: mockAgent,
    });

    render(<StakingPanel />);
    expect(screen.getByText('10,000')).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount to Stake/i)).toBeInTheDocument();
  });

  it('stakes successfully', async () => {
    const addToastMock = vi.fn();
    (useDashboard as unknown).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: mockAgent,
      addToast: addToastMock,
      fetchData: vi.fn(),
    });

    (api.stake as unknown).mockResolvedValue({ status: 'success' });

    render(<StakingPanel />);
    
    const input = screen.getByLabelText(/Amount to Stake/i);
    fireEvent.change(input, { target: { value: '500' } });
    
    const stakeBtn = screen.getByRole('button', { name: /Commit Bond/i });
    fireEvent.click(stakeBtn);

    await waitFor(() => {
      expect(api.stake).toHaveBeenCalledWith(mockAgent.eth_address, 500);
      expect(addToastMock).toHaveBeenCalledWith('success', expect.stringContaining('Successfully staked'));
    });
  });
});
