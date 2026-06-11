import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { APIKeyPanel } from '../../src/components/tabs/APIKeyPanel';
import { useDashboard } from '../../src/context/DashboardContext';
import { mockDashboardContext } from './test-utils';
import { api } from '../../src/services/api';

vi.mock('../../src/context/DashboardContext', () => ({
  useDashboard: vi.fn(),
}));

vi.mock('../../src/services/api', () => ({
  api: {
    generateApiKey: vi.fn(),
  },
}));

describe('APIKeyPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });
  });

  it('renders initial state', () => {
    (useDashboard as any).mockReturnValue(mockDashboardContext);

    render(<APIKeyPanel />);
    expect(screen.getByText(/Generate New API Key/i)).toBeInTheDocument();
  });

  it('generates a key successfully', async () => {
    const addToastMock = vi.fn();
    (useDashboard as any).mockReturnValue({
      ...mockDashboardContext,
      addToast: addToastMock,
    });

    (api.generateApiKey as any).mockResolvedValue({ api_key: 'sk-123456789' });

    render(<APIKeyPanel />);
    
    const genBtn = screen.getByRole('button', { name: /Generate New API Key/i });
    fireEvent.click(genBtn);

    await waitFor(() => {
      expect(api.generateApiKey).toHaveBeenCalled();
      expect(screen.getByDisplayValue('sk-123456789')).toBeInTheDocument();
      expect(addToastMock).toHaveBeenCalledWith('success', expect.stringContaining('generated'));
    });
  });

  it('copies key to clipboard', async () => {
    (useDashboard as any).mockReturnValue(mockDashboardContext);
    (api.generateApiKey as any).mockResolvedValue({ api_key: 'sk-123456789' });

    render(<APIKeyPanel />);
    
    fireEvent.click(screen.getByRole('button', { name: /Generate New API Key/i }));
    await waitFor(() => screen.getByDisplayValue('sk-123456789'));

    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('sk-123456789');
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });
});
