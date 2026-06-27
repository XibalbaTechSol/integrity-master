import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../MetricCard';
import React from 'react';

/**
 * @test MetricCard component
 */
describe('MetricCard', () => {
  /**
   * Validates that the card renders label and value correctly.
   */
  it('renders label and value correctly', () => {
    render(<MetricCard label="Test Label" value="1000" />);
    expect(screen.getByText('Test Label')).toBeDefined();
    expect(screen.getByText('1000')).toBeDefined();
  });

  /**
   * Ensures skeleton is shown when isLoading is true.
   */
  it('shows skeleton when loading', () => {
    const { container } = render(<MetricCard label="L" value="V" isLoading />);
    expect(container.querySelector('.skeleton')).not.toBeNull();
  });
});
