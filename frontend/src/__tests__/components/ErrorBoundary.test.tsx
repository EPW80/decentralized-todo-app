import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '../../components/ErrorBoundary';
import { Web3Provider } from '../../contexts/Web3Context';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Test wrapper with all required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Web3Provider>{children}</Web3Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Suppress console.error for these tests
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error fallback when error is thrown', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('displays error message in fallback', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      </TestWrapper>
    );

    // In development mode, error message appears in the error details section
    const errorMessages = screen.getAllByText(/test error message/i);
    expect(errorMessages.length).toBeGreaterThan(0);
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <TestWrapper>
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('displays Try Again button', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('displays Go to Home button', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    const customFallback = (error: Error) => (
      <div>Custom error: {error.message}</div>
    );

    render(
      <TestWrapper>
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText(/custom error: test error message/i)).toBeInTheDocument();
  });
});
