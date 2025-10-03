export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  gameState?: any;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceIssue {
  type: 'memory' | 'fps' | 'bundle' | 'network';
  value: number;
  threshold: number;
  timestamp: string;
  context: ErrorContext;
}

export interface UserAction {
  action: string;
  timestamp: string;
  context: ErrorContext;
}

export interface ActionOutcome {
  success: boolean;
  duration?: number;
  error?: string;
}

class ErrorReporter {
  private reports: ErrorReport[] = [];
  private performanceIssues: PerformanceIssue[] = [];
  private userActions: Array<UserAction & { outcome?: ActionOutcome }> = [];
  private maxReports = 100; // Limit stored reports to prevent memory issues

  reportError(error: Error, context: ErrorContext = {}): string {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const report: ErrorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context,
      severity: this.determineSeverity(error, context),
    };

    this.reports.push(report);
    
    // Keep only the most recent reports
    if (this.reports.length > this.maxReports) {
      this.reports = this.reports.slice(-this.maxReports);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ErrorReporter] ${report.severity.toUpperCase()}:`, report);
    }

    // In production, send to external service
    this.sendToExternalService(report);

    return errorId;
  }

  trackPerformanceIssue(issue: PerformanceIssue): void {
    this.performanceIssues.push(issue);
    
    // Keep only recent performance issues
    if (this.performanceIssues.length > this.maxReports) {
      this.performanceIssues = this.performanceIssues.slice(-this.maxReports);
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(`[ErrorReporter] Performance Issue:`, issue);
    }

    // Report critical performance issues
    if (issue.type === 'memory' && issue.value > issue.threshold * 2) {
      this.reportError(
        new Error(`Critical memory usage: ${issue.value}MB (threshold: ${issue.threshold}MB)`),
        { ...issue.context, component: 'PerformanceMonitor' }
      );
    }
  }

  logUserAction(action: UserAction, outcome: ActionOutcome): void {
    const actionWithOutcome = { ...action, outcome };
    this.userActions.push(actionWithOutcome);
    
    // Keep only recent actions
    if (this.userActions.length > this.maxReports) {
      this.userActions = this.userActions.slice(-this.maxReports);
    }

    // Report failed critical actions
    if (!outcome.success && this.isCriticalAction(action.action)) {
      this.reportError(
        new Error(`Critical action failed: ${action.action} - ${outcome.error}`),
        { ...action.context, action: action.action }
      );
    }
  }

  getRecentReports(count = 10): ErrorReport[] {
    return this.reports.slice(-count);
  }

  getPerformanceIssues(count = 10): PerformanceIssue[] {
    return this.performanceIssues.slice(-count);
  }

  getUserActions(count = 20): Array<UserAction & { outcome?: ActionOutcome }> {
    return this.userActions.slice(-count);
  }

  clearReports(): void {
    this.reports = [];
    this.performanceIssues = [];
    this.userActions = [];
  }

  private determineSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    // Critical errors that break core functionality
    if (error.message.includes('WebGL') || 
        error.message.includes('Canvas') ||
        error.message.includes('PixiJS') ||
        context.component === 'Game') {
      return 'critical';
    }

    // High severity for UI components
    if (context.component?.includes('View') || 
        context.component?.includes('Screen')) {
      return 'high';
    }

    // Medium for other component errors
    if (context.component) {
      return 'medium';
    }

    // Low for everything else
    return 'low';
  }

  private isCriticalAction(action: string): boolean {
    const criticalActions = [
      'game_start',
      'game_init',
      'webgl_init',
      'audio_init',
      'save_settings',
    ];
    return criticalActions.includes(action);
  }

  private sendToExternalService(_report: ErrorReport): void {
    // In a real application, you would send this to your error reporting service
    // Examples: Sentry, Bugsnag, LogRocket, etc.
    
    if (process.env.NODE_ENV === 'production') {
      // Example implementation:
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report)
      // }).catch(err => console.error('Failed to report error:', err));
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { totalErrors: number; recentErrors: ErrorReport[] } {
    return {
      totalErrors: this.reports.length,
      recentErrors: this.reports.slice(-10), // Last 10 errors
    };
  }
}

// Export the class for direct instantiation
export { ErrorReporter };

// Singleton instance
export const errorReporter = new ErrorReporter();

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  errorReporter.reportError(event.error || new Error(event.message), {
    component: 'Global',
    additionalData: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    },
  });
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  errorReporter.reportError(
    event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
    {
      component: 'Global',
      action: 'unhandled_promise_rejection',
    }
  );
});