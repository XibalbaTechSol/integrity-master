import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { APIKeyPanel } from '../../src/components/tabs/APIKeyPanel';
import { useDashboard } from '../../src/context/useDashboard';
import { mockDashboardContext } from './test-utils';
import { api } from '../../src/services/api';

vi.mock('../../src/context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

vi.mock('../../src/services/api', () => ({
  api: {
    getApiKeys: vi.fn(),
    generateApiKey: vi.fn(),
    deleteApiKey: vi.fn(),
  },
}));

describe('APIKeyPanel', () => {
  const mockKeys = [
    { api_key: 'sk-existing-123', created_at: new Date().toISOString(), expires_at: new Date().toISOString() }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getApiKeys as any).mockResolvedValue(mockKeys);
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });
  });

  it('renders initial state with existing keys', async () => {
    (useDashboard as any).mockReturnValue(mockDashboardContext);

    render(<APIKeyPanel />);
    
    await waitFor(() => {
      expect(screen.getByText(/sk-existing/i)).toBeInTheDocument();
      expect(screen.getByText(/Generate Key/i)).toBeInTheDocument();
    });
  });

  it('generates a key successfully', async () => {
    const addToastMock = vi.fn();
    (useDashboard as any).mockReturnValue({
      ...mockDashboardContext,
      addToast: addToastMock,
    });

    (api.generateApiKey as any).mockResolvedValue({ 
      api_key: 'sk-123456789', 
      created_at: new Date().toISOString(),
      expires_at: new Date().toISOString() 
    });

    render(<APIKeyPanel />);
    
    await waitFor(() => screen.getByText(/Generate Key/i));
    const genBtn = screen.getByRole('button', { name: /Generate Key/i });
    fireEvent.click(genBtn);

    await waitFor(() => {
      expect(api.generateApiKey).toHaveBeenCalled();
      expect(screen.getByDisplayValue('sk-123456789')).toBeInTheDocument();
      expect(addToastMock).toHaveBeenCalledWith('success', expect.stringContaining('generated'));
    });
  });

  it('copies key to clipboard', async () => {
    (useDashboard as any).mockReturnValue(mockDashboardContext);
    (api.generateApiKey as any).mockResolvedValue({ 
      api_key: 'sk-123456789',
      created_at: new Date().toISOString(),
      expires_at: new Date().toISOString()
    });

    render(<APIKeyPanel />);
    
    await waitFor(() => screen.getByRole('button', { name: /Generate Key/i }));
    fireEvent.click(screen.getByRole('button', { name: /Generate Key/i }));
    
    await waitFor(() => screen.getByDisplayValue('sk-123456789'));

    const copyBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('Copy'));
    if (copyBtn) fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('sk-123456789');
  });

  it('deletes a key successfully', async () => {
    const addToastMock = vi.fn();
    (useDashboard as any).mockReturnValue({
      ...mockDashboardContext,
      addToast: addToastMock,
    });
    
    window.confirm = vi.fn().mockReturnValue(true);
    (api.deleteApiKey as any).mockResolvedValue({ status: 'deleted' });

    render(<APIKeyPanel />);
    
    await waitFor(() => screen.getByTitle('Delete Key'));
    const deleteBtn = screen.getByTitle('Delete Key');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.deleteApiKey).toHaveBeenCalledWith('sk-existing-123');
      expect(addToastMock).toHaveBeenCalledWith('success', expect.stringContaining('deleted'));
    });
  });
});
