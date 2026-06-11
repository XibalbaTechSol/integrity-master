import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedPanel } from '../../src/components/tabs/AdvancedPanel';
import { useDashboard } from '../../src/context/DashboardContext';
import { mockDashboardContext } from './test-utils';
import { api } from '../../src/services/api';

vi.mock('../../src/context/DashboardContext', () => ({
  useDashboard: vi.fn(),
}));

vi.mock('../../src/services/api', () => ({
  api: {
    getProvenance: vi.fn(),
  },
}));

const mockLogs = [
  {
    log_id: 'log-1',
    action: 'INFERENCE',
    model_used: 'gpt-4o',
    input_hash: '0xabc123',
    output_hash: '0xdef456',
    created_at: new Date().toISOString(),
  }
];

describe('AdvancedPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders provenance logs when backend is online', async () => {
    (useDashboard as any).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: { eth_address: '0x123' },
      isBackendOffline: false,
    });
    (api.getProvenance as any).mockResolvedValue(mockLogs);

    render(<AdvancedPanel />);
    
    await waitFor(() => {
      expect(screen.getByText('INFERENCE')).toBeInTheDocument();
      expect(screen.getByText('gpt-4o')).toBeInTheDocument();
    });
  });

  it('shows offline message when backend is offline', () => {
    (useDashboard as any).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: { eth_address: '0x123' },
      isBackendOffline: true,
    });

    render(<AdvancedPanel />);
    expect(screen.getByText(/Oracle Database Offline/i)).toBeInTheDocument();
  });

  it('disables MEV protection for ineligible agents', () => {
    (useDashboard as any).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: { eth_address: '0x123', current_ais: 800 },
    });

    render(<AdvancedPanel />);
    const btn = screen.getByRole('button', { name: /Enable Protection/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/Ineligible: Requires Tier 3/i)).toBeInTheDocument();
  });

  it('enables MEV protection for eligible agents', async () => {
    (useDashboard as any).mockReturnValue({
      ...mockDashboardContext,
      selectedAgent: { eth_address: '0x123', current_ais: 1200 },
    });

    render(<AdvancedPanel />);
    const btn = screen.getByRole('button', { name: /Enable Protection/i });
    expect(btn).not.toBeDisabled();
    
    fireEvent.click(btn);
    expect(screen.getByText(/Enabled \(Protected\)/i)).toBeInTheDocument();
  });
});
