import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreditPanel } from '../../src/components/tabs/CreditPanel';
import { useDashboard } from '../../src/context/useDashboard';
import { mockDashboardContext } from './test-utils';
import { api } from '../../src/services/api';

vi.mock('../../src/context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

vi.mock('../../src/services/api', () => ({
  api: {
    borrow: vi.fn(),
    repay: vi.fn(),
  },
}));

const mockAgent = {
  eth_address: '0x123',
  alias: 'Test Agent',
  current_ais: 800,
  credit_profile: {
    credit_score: 750,
    max_borrow_limit: 10000,
    total_borrowed: 2000,
    default_count: 0,
    active_loans: [
      {
        loan_id: 'loan-1',
        principal: 2000,
        interest_rate: 0.05,
        due_date: '2026-12-31T00:00:00Z',
        status: 'active',
        repaid_amount: 500,
      }
    ]
  }
};

describe('CreditPanel', () => {
  it('renders "Select an agent" message when no agent is selected', () => {
    (useDashboard as unknown).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: null,
    });

    render(<CreditPanel />);
    // Check for the one in Credit Profile
    expect(screen.getAllByText(/Select an agent/i)[0]).toBeInTheDocument();
  });

  it('renders credit profile metrics when an agent is selected', () => {
    (useDashboard as unknown).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: mockAgent,
    });

    render(<CreditPanel />);
    expect(screen.getByText('750')).toBeInTheDocument();
    expect(screen.getByText('10,000 ITK')).toBeInTheDocument();
    // Use getAllByText for '2,000 ITK' as it appears in profile and table
    expect(screen.getAllByText('2,000 ITK').length).toBeGreaterThan(0);
  });

  it('shows error message when borrow amount exceeds limit', async () => {
    (useDashboard as unknown).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: mockAgent,
    });

    render(<CreditPanel />);
    const input = screen.getByLabelText(/Principal Amount/i);
    fireEvent.change(input, { target: { value: '15000' } });

    expect(screen.getByText(/Exceeds maximum borrow limit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Loan Application/i })).toBeDisabled();
  });

  it('submits loan application successfully', async () => {
    const fetchDataMock = vi.fn();
    const addToastMock = vi.fn();
    (useDashboard as unknown).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: mockAgent,
      fetchData: fetchDataMock,
      addToast: addToastMock,
    });

    (api.borrow as unknown).mockResolvedValue({ status: 'success' });

    render(<CreditPanel />);
    const input = screen.getByLabelText(/Principal Amount/i);
    fireEvent.change(input, { target: { value: '5000' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Loan Application/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.borrow).toHaveBeenCalledWith(mockAgent.eth_address, {
        amount_itk: 5000,
        term_days: 30,
      });
      expect(addToastMock).toHaveBeenCalledWith('success', expect.stringContaining('Loan approved'));
      expect(fetchDataMock).toHaveBeenCalled();
    });
  });

  it('renders active loans table', () => {
    (useDashboard as unknown).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: mockAgent,
    });

    render(<CreditPanel />);
    expect(screen.getByText('loan-1...')).toBeInTheDocument();
    expect(screen.getAllByText('2,000 ITK').length).toBeGreaterThan(0);
    expect(screen.getByText('5.0%')).toBeInTheDocument();
  });
});
