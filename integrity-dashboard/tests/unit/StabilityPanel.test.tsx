import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StabilityPanel } from '../../src/components/tabs/StabilityPanel';
import { useDashboard } from '../../src/context/DashboardContext';
import { mockDashboardContext } from './test-utils';
import { api } from '../../src/services/api';

vi.mock('../../src/context/DashboardContext', () => ({
  useDashboard: vi.fn(),
}));

vi.mock('../../src/services/api', () => ({
  api: {
    getBenchmarks: vi.fn(),
    requestAudit: vi.fn(),
  },
}));

const mockBenchmarks = [
  {
    model_name: 'GPT-4o',
    provider_name: 'OpenAI',
    simulated_ais: 920,
    stability_metric: 0.98,
    grounding_metric: 0.96,
  }
];

const mockAgent = {
  eth_address: '0x123',
  alias: 'Test Auditor',
};

describe('StabilityPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.getBenchmarks as any).mockResolvedValue(mockBenchmarks);
  });

  it('renders benchmarks from API', async () => {
    (useDashboard as any).mockReturnValue(mockDashboardContext);

    render(<StabilityPanel />);
    
    await waitFor(() => {
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
      expect(screen.getByText('98.0%')).toBeInTheDocument();
      expect(screen.getByText('96.0%')).toBeInTheDocument();
    });
  });

  it('requests audit successfully', async () => {
    const addToastMock = vi.fn();
    (useDashboard as any).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: mockAgent,
      addToast: addToastMock,
    });

    (api.requestAudit as any).mockResolvedValue({ status: 'success' });

    render(<StabilityPanel />);
    
    const auditBtn = screen.getByRole('button', { name: /Start Certification Audit/i });
    fireEvent.click(auditBtn);

    await waitFor(() => {
      expect(api.requestAudit).toHaveBeenCalledWith(mockAgent.eth_address, 'AUTOMATED');
      expect(addToastMock).toHaveBeenCalledWith('success', expect.stringContaining('audit initialized'));
    });
  });

  it('disables audit button if no agent is selected', async () => {
    (useDashboard as any).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: null,
    });

    render(<StabilityPanel />);
    
    const auditBtn = screen.getByRole('button', { name: /Start Certification Audit/i });
    expect(auditBtn).toBeDisabled();
  });
});
