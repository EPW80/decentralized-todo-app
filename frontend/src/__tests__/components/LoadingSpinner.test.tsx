import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as useReducedMotionModule from '../../hooks/useReducedMotion';

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('LoadingSpinner', () => {
  it('renders spinner with default props', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender, container } = render(<LoadingSpinner size="sm" />);
    let spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('w-6', 'h-6');

    rerender(<LoadingSpinner size="md" />);
    spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('w-12', 'h-12');

    rerender(<LoadingSpinner size="lg" />);
    spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('w-16', 'h-16');

    rerender(<LoadingSpinner size="xl" />);
    spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('w-24', 'h-24');
  });

  it('renders full-screen variant', () => {
    const { container } = render(<LoadingSpinner fullScreen />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('fixed', 'inset-0');
  });

  it('renders blockchain variant', () => {
    const { container } = render(<LoadingSpinner variant="blockchain" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toBeInTheDocument();
  });

  it('respects reduced motion preference', () => {
    vi.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(true);

    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).not.toHaveClass('animate-spin');
  });

  it('has screen reader support', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders message with correct text size', () => {
    const { rerender } = render(<LoadingSpinner size="sm" message="Test" />);
    expect(screen.getByText('Test')).toHaveClass('text-xs');

    rerender(<LoadingSpinner size="md" message="Test" />);
    expect(screen.getByText('Test')).toHaveClass('text-sm');

    rerender(<LoadingSpinner size="lg" message="Test" />);
    expect(screen.getByText('Test')).toHaveClass('text-base');

    rerender(<LoadingSpinner size="xl" message="Test" />);
    expect(screen.getByText('Test')).toHaveClass('text-lg');
  });
});
