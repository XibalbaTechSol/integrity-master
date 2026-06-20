import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from './MetricCard';

/**
 * Unit tests for the MetricCard component.
 * Validates rendering of label, value, subValue, and loading states.
 */
describe('MetricCard', () => {
  it('renders label and value correctly', () => {
    // ARRANGE
    render(<MetricCard label="Total AIS" value="850" />);

    // ASSERT
    expect(screen.getByText('Total AIS')).toBeDefined();
    expect(screen.getByText('850')).toBeDefined();
  });

  it('renders subValue when provided', () => {
    // ARRANGE
    render(<MetricCard label="Balance" value="1000 ITK" subValue="+$50.00" />);

    // ASSERT
    expect(screen.getByText('+$50.00')).toBeDefined();
  });

  it('renders skeleton when loading', () => {
    // ARRANGE
    const { container } = render(<MetricCard label="Loading..." value="---" isLoading={true} />);

    // ASSERT
    expect(container.querySelector('.skeleton')).toBeDefined();
    expect(screen.queryByText('---')).toBeNull();
  });

  it('renders progress bar when progress is provided', () => {
    // ARRANGE
    const { container } = render(<MetricCard label="Progress" value="50%" progress={50} />);

    // ASSERT
    const progressBar = container.querySelector('div[style*="width: 50%"]');
    expect(progressBar).toBeDefined();
  });
});
