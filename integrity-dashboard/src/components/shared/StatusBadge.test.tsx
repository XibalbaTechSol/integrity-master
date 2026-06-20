import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

// Mock getTier from ../../types
vi.mock('../../types', () => ({
  getTier: (ais: number) => {
    if (ais >= 850) return 'AAA';
    if (ais >= 700) return 'AA';
    return 'A';
  }
}));

/**
 * Unit tests for the StatusBadge component.
 * Validates tier-based and status-based rendering.
 */
describe('StatusBadge', () => {
  it('renders tier based on AIS', () => {
    // ARRANGE
    render(<StatusBadge ais={900} />);

    // ASSERT
    expect(screen.getByText('Tier AAA')).toBeDefined();
  });

  it('renders active status correctly', () => {
    // ARRANGE
    render(<StatusBadge status="Active" />);

    // ASSERT
    const badge = screen.getByText('Active');
    expect(badge).toBeDefined();
    expect(badge.className).toContain('badge-aa');
  });

  it('renders failed status correctly', () => {
    // ARRANGE
    render(<StatusBadge status="Failed" />);

    // ASSERT
    const badge = screen.getByText('Failed');
    expect(badge).toBeDefined();
    expect(badge.className).toContain('badge-c');
  });

  it('renders pending status correctly', () => {
    // ARRANGE
    render(<StatusBadge status="Pending" />);

    // ASSERT
    const badge = screen.getByText('Pending');
    expect(badge).toBeDefined();
    expect(badge.className).toContain('badge-a');
  });

  it('returns null when no props provided', () => {
    // ARRANGE
    const { container } = render(<StatusBadge />);

    // ASSERT
    expect(container.firstChild).toBeNull();
  });
});
