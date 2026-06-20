import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton';

/**
 * Unit tests for the Skeleton component.
 * Validates rendering and custom styles.
 */
describe('Skeleton', () => {
  it('renders with default classes', () => {
    // ARRANGE
    const { container } = render(<Skeleton />);

    // ASSERT
    expect(container.firstChild?.className).toContain('skeleton');
  });

  it('applies custom className', () => {
    // ARRANGE
    const { container } = render(<Skeleton className="custom-class" />);

    // ASSERT
    expect(container.firstChild?.className).toContain('custom-class');
  });

  it('applies custom styles', () => {
    // ARRANGE
    const { container } = render(<Skeleton style={{ width: '100px' }} />);

    // ASSERT
    const element = container.firstChild as HTMLElement;
    expect(element.style.width).toBe('100px');
  });
});
