import React, { Component, type ReactNode } from 'react';
import { useTranslations } from '@shared/i18n';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorId: string, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void;
  isolate?: boolean; // If true, only catches errors from direct children
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId || `error_${Date.now()}`;
    
    // Log error details
    console.error('ErrorBoundary caught an error:', {
      error,
      errorInfo,
      errorId,
      retryCount: this.retryCount,
    });

    this.setState({ errorInfo });

    // Report error if callback provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }

    // Report to error reporting system
    this.reportError(error, errorInfo, errorId);
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    // Send error to reporting system (could be external service)
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.retryCount,
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Report [${errorId}]`);
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Full Report:', errorReport);
      console.groupEnd();
    }

    // In production, you would send this to your error reporting service
    // Example: sendToErrorReportingService(errorReport);
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    }
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorId) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorId, this.handleRetry);
      }

      // Default fallback UI
      return <DefaultErrorFallback 
        error={this.state.error} 
        errorId={this.state.errorId}
        canRetry={this.retryCount < this.maxRetries}
        onRetry={this.handleRetry}
      />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error;
  errorId: string;
  canRetry: boolean;
  onRetry: () => void;
}

function DefaultErrorFallback({ error, errorId, canRetry, onRetry }: DefaultErrorFallbackProps) {
  const t = useTranslations();

  return (
    <div className="error-boundary">
      <div className="error-boundary__content">
        <h2 className="error-boundary__title">
          {t.errorBoundary?.title || 'Something went wrong'}
        </h2>
        <p className="error-boundary__message">
          {t.errorBoundary?.message || 'An unexpected error occurred. Please try refreshing the page.'}
        </p>
        <details className="error-boundary__details">
          <summary>{t.errorBoundary?.technicalDetails || 'Technical Details'}</summary>
          <div className="error-boundary__error-info">
            <p><strong>Error ID:</strong> {errorId}</p>
            <p><strong>Error:</strong> {error.message}</p>
            {process.env.NODE_ENV === 'development' && error.stack && (
              <pre className="error-boundary__stack">{error.stack}</pre>
            )}
          </div>
        </details>
        <div className="error-boundary__actions">
          {canRetry && (
            <button 
              className="error-boundary__retry" 
              onClick={onRetry}
              type="button"
            >
              {t.errorBoundary?.retry || 'Try Again'}
            </button>
          )}
          <button 
            className="error-boundary__reload" 
            onClick={() => window.location.reload()}
            type="button"
          >
            {t.errorBoundary?.reload || 'Reload Page'}
          </button>
        </div>
      </div>
    </div>
  );
}