import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';
import { I18nProvider } from '@shared/i18n';

// Mock component that throws an error
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

// Mock component for testing retry functionality
function RetryableComponent({ throwCount = 0, key: componentKey }: { throwCount?: number; key?: string }) {
  const [attempts, setAttempts] = React.useState(0);
  
  React.useEffect(() => {
    setAttempts(prev => prev + 1);
  }, [componentKey]); // Re-run when key changes (on retry)
  
  if (attempts <= throwCount) {
    throw new Error(`Attempt ${attempts} failed`);
  }
  
  return <div>Success after {attempts} attempts</div>;
}

const renderWithI18n = (component: React.ReactNode) => {
  return render(
    <I18nProvider language="en" onLanguageChange={() => {}}>
      {component}
    </I18nProvider>
  );
};

describe('ErrorBoundary', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  let consoleGroup: ReturnType<typeof vi.spyOn>;
  let consoleGroupEnd: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock console methods to avoid noise in tests
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleGroup = vi.spyOn(console, 'group').mockImplementation(() => {});
    consoleGroupEnd = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    consoleGroup.mockRestore();
    consoleGroupEnd.mockRestore();
  });

  it('renders children when there is no error', () => {
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders default error UI when child component throws', () => {
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  it('shows technical details when expanded', () => {
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const detailsButton = screen.getByText('Technical Details');
    fireEvent.click(detailsButton);

    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    
    renderWithI18n(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object),
      expect.any(String)
    );
  });

  it('uses custom fallback when provided', () => {
    const customFallback = (error: Error, errorId: string, retry: () => void) => (
      <div>
        <h1>Custom Error UI</h1>
        <p>Error: {error.message}</p>
        <button onClick={retry}>Custom Retry</button>
      </div>
    );

    renderWithI18n(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    expect(screen.getByText('Custom Retry')).toBeInTheDocument();
  });

  it('allows retry up to maximum attempts', () => {
    // Simple test that verifies retry functionality exists
    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error initially
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Should have retry button
    const retryButton = screen.queryByText('Try Again');
    expect(retryButton).toBeInTheDocument();

    // Click retry - error should still be shown since component always throws
    if (retryButton) {
      fireEvent.click(retryButton);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    }
  });

  it('disables retry button after maximum attempts', () => {
    const AlwaysThrow = () => {
      throw new Error('Always fails');
    };

    renderWithI18n(
      <ErrorBoundary>
        <AlwaysThrow />
      </ErrorBoundary>
    );

    // Exhaust retry attempts (3 max retries)
    let retryButton = screen.queryByText('Try Again');
    if (retryButton) fireEvent.click(retryButton);
    
    retryButton = screen.queryByText('Try Again');
    if (retryButton) fireEvent.click(retryButton);
    
    retryButton = screen.queryByText('Try Again');
    if (retryButton) fireEvent.click(retryButton);

    // After 3 retries, button should be disabled or hidden
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('reloads page when reload button is clicked', () => {
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Reload Page'));
    expect(mockReload).toHaveBeenCalled();
  });

  it('logs error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    renderWithI18n(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleGroup).toHaveBeenCalledWith(expect.stringContaining('Error Report'));
    expect(consoleError).toHaveBeenCalledWith('Error:', expect.any(Error));

    process.env.NODE_ENV = originalEnv;
  });

  it('generates unique error IDs for different errors', () => {
    const onError1 = vi.fn();
    const onError2 = vi.fn();

    // First error boundary
    renderWithI18n(
      <ErrorBoundary onError={onError1}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError1).toHaveBeenCalled();
    const errorId1 = onError1.mock.calls[0]?.[2];

    // Second error boundary with different component
    function DifferentError() {
      throw new Error('Different error');
    }

    renderWithI18n(
      <ErrorBoundary onError={onError2}>
        <DifferentError />
      </ErrorBoundary>
    );

    expect(onError2).toHaveBeenCalled();
    const errorId2 = onError2.mock.calls[0]?.[2];
    
    expect(errorId1).toBeDefined();
    expect(errorId2).toBeDefined();
    expect(errorId1).not.toBe(errorId2);
  });
});