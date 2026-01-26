import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CopyButton from '../../components/CopyButton';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('CopyButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders copy button with text variant', async () => {
    render(<CopyButton text="Hello World" displayText="Copy Me" variant="text" />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Copy Me')).toBeInTheDocument();
  });

  it('renders copy button with icon variant', () => {
    render(<CopyButton text="Hello World" variant="icon" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('copies text to clipboard when clicked', async () => {
    const textToCopy = 'Test text to copy';
    render(<CopyButton text={textToCopy} />);

    const button = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(button);
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(textToCopy);
  });

  it('shows success feedback after copying', async () => {
    render(<CopyButton text="Hello World" />);

    const button = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(button);
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.getByText(/copied/i)).toBeInTheDocument();
  });

  it('resets to default state after timeout', async () => {
    render(<CopyButton text="Hello World" />);

    const button = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(button);
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.getByText(/copied/i)).toBeInTheDocument();

    // Fast-forward past the timeout (2 seconds)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });

    expect(screen.queryByText(/copied/i)).not.toBeInTheDocument();
  });

  it('handles copy errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Copy failed'));

    render(<CopyButton text="Hello World" />);

    const button = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(button);
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('applies custom className', () => {
    render(<CopyButton text="Hello World" className="custom-class" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('has proper title attribute', () => {
    render(<CopyButton text="Hello World" />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Click to copy');
  });
});
