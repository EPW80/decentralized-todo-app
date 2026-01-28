import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Tooltip from '../../components/Tooltip';

describe('Tooltip Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('shows tooltip on hover', async () => {
    render(
      <Tooltip content="Tooltip text" delay={0}>
        <button>Hover me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover me');
    
    await act(async () => {
      fireEvent.mouseEnter(button);
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText('Tooltip text')).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', async () => {
    render(
      <Tooltip content="Tooltip text" delay={0}>
        <button>Hover me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover me');
    
    await act(async () => {
      fireEvent.mouseEnter(button);
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText('Tooltip text')).toBeInTheDocument();

    await act(async () => {
      fireEvent.mouseLeave(button);
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
  });

  it('respects delay prop', async () => {
    render(
      <Tooltip content="Tooltip text" delay={500}>
        <button>Hover me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover me');
    fireEvent.mouseEnter(button);

    // Tooltip should not appear immediately
    expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();

    // Fast-forward time past the delay
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText('Tooltip text')).toBeInTheDocument();
  });

  it('supports different positions', () => {
    const positions: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right'];

    positions.forEach(position => {
      const { unmount } = render(
        <Tooltip content="Tooltip text" position={position}>
          <button>Hover me</button>
        </Tooltip>
      );

      expect(screen.getByText('Hover me')).toBeInTheDocument();
      unmount();
    });
  });

  it('renders JSX content', async () => {
    render(
      <Tooltip content={<div>Complex <strong>content</strong></div>} delay={0}>
        <button>Hover me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover me');
    
    await act(async () => {
      fireEvent.mouseEnter(button);
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText('Complex')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('cleans up timeout on unmount', () => {
    const { unmount } = render(
      <Tooltip content="Tooltip text" delay={500}>
        <button>Hover me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover me');
    fireEvent.mouseEnter(button);

    unmount();

    // Should not throw error
    vi.advanceTimersByTime(500);
  });

  it('cancels delayed show on mouse leave', async () => {
    render(
      <Tooltip content="Tooltip text" delay={500}>
        <button>Hover me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover me');
    fireEvent.mouseEnter(button);

    // Leave before delay completes
    vi.advanceTimersByTime(250);
    fireEvent.mouseLeave(button);

    // Complete the delay
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Tooltip should not appear
    expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
  });
});
