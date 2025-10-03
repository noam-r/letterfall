import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorReporter } from '../ErrorReporter';

describe('ErrorReporter', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorReporter.clearReports();
  });

  afterEach(() => {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  describe('reportError', () => {
    it('generates unique error IDs', () => {
      const error1 = new Error('Test error 1');
      const error2 = new Error('Test error 2');

      const id1 = errorReporter.reportError(error1);
      const id2 = errorReporter.reportError(error2);

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^error_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^error_\d+_[a-z0-9]+$/);
    });

    it('stores error reports', () => {
      const error = new Error('Test error');
      const context = { component: 'TestComponent', action: 'test_action' };

      errorReporter.reportError(error, context);

      const reports = errorReporter.getRecentReports(1);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toBe('Test error');
      expect(reports[0].context).toEqual(context);
    });

    it('determines severity correctly', () => {
      const webglError = new Error('WebGL initialization failed');
      const componentError = new Error('Component error');
      const genericError = new Error('Generic error');

      errorReporter.reportError(webglError, { component: 'Game' });
      errorReporter.reportError(componentError, { component: 'GameView' });
      errorReporter.reportError(genericError);

      const reports = errorReporter.getRecentReports(3);
      expect(reports[0].severity).toBe('critical'); // WebGL + Game component
      expect(reports[1].severity).toBe('high'); // View component
      expect(reports[2].severity).toBe('low'); // Generic error
    });

    it('limits stored reports to prevent memory issues', () => {
      // Generate more than the maximum number of reports
      for (let i = 0; i < 150; i++) {
        errorReporter.reportError(new Error(`Error ${i}`));
      }

      const reports = errorReporter.getRecentReports(200);
      expect(reports.length).toBeLessThanOrEqual(100);
      
      // Should keep the most recent reports
      expect(reports[reports.length - 1].message).toBe('Error 149');
    });

    it('logs errors in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      errorReporter.reportError(error);

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('[ErrorReporter]'),
        expect.objectContaining({ message: 'Test error' })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('trackPerformanceIssue', () => {
    it('stores performance issues', () => {
      const issue = {
        type: 'memory' as const,
        value: 150,
        threshold: 100,
        timestamp: new Date().toISOString(),
        context: { component: 'Game' }
      };

      errorReporter.trackPerformanceIssue(issue);

      const issues = errorReporter.getPerformanceIssues(1);
      expect(issues).toHaveLength(1);
      expect(issues[0]).toEqual(issue);
    });

    it('reports critical memory issues as errors', () => {
      const criticalMemoryIssue = {
        type: 'memory' as const,
        value: 250, // 2.5x threshold
        threshold: 100,
        timestamp: new Date().toISOString(),
        context: { component: 'Game' }
      };

      errorReporter.trackPerformanceIssue(criticalMemoryIssue);

      const reports = errorReporter.getRecentReports(1);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toContain('Critical memory usage');
    });

    it('logs performance issues in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const issue = {
        type: 'fps' as const,
        value: 30,
        threshold: 60,
        timestamp: new Date().toISOString(),
        context: {}
      };

      errorReporter.trackPerformanceIssue(issue);

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('[ErrorReporter] Performance Issue:'),
        issue
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logUserAction', () => {
    it('stores user actions with outcomes', () => {
      const action = {
        action: 'game_start',
        timestamp: new Date().toISOString(),
        context: { component: 'StartScreen' }
      };
      const outcome = { success: true, duration: 150 };

      errorReporter.logUserAction(action, outcome);

      const actions = errorReporter.getUserActions(1);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual({ ...action, outcome });
    });

    it('reports failed critical actions as errors', () => {
      const criticalAction = {
        action: 'game_start',
        timestamp: new Date().toISOString(),
        context: { component: 'StartScreen' }
      };
      const failedOutcome = { success: false, error: 'WebGL init failed' };

      errorReporter.logUserAction(criticalAction, failedOutcome);

      const reports = errorReporter.getRecentReports(1);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toContain('Critical action failed: game_start');
    });

    it('does not report non-critical action failures', () => {
      const nonCriticalAction = {
        action: 'ui_click',
        timestamp: new Date().toISOString(),
        context: { component: 'Button' }
      };
      const failedOutcome = { success: false, error: 'Button disabled' };

      errorReporter.logUserAction(nonCriticalAction, failedOutcome);

      const reports = errorReporter.getRecentReports();
      expect(reports).toHaveLength(0);
    });
  });

  describe('data management', () => {
    it('clears all reports when requested', () => {
      errorReporter.reportError(new Error('Test'));
      errorReporter.trackPerformanceIssue({
        type: 'fps',
        value: 30,
        threshold: 60,
        timestamp: new Date().toISOString(),
        context: {}
      });
      errorReporter.logUserAction(
        { action: 'test', timestamp: new Date().toISOString(), context: {} },
        { success: true }
      );

      expect(errorReporter.getRecentReports()).toHaveLength(1);
      expect(errorReporter.getPerformanceIssues()).toHaveLength(1);
      expect(errorReporter.getUserActions()).toHaveLength(1);

      errorReporter.clearReports();

      expect(errorReporter.getRecentReports()).toHaveLength(0);
      expect(errorReporter.getPerformanceIssues()).toHaveLength(0);
      expect(errorReporter.getUserActions()).toHaveLength(0);
    });

    it('limits stored data to prevent memory leaks', () => {
      // Test that all data types respect the maximum limit
      for (let i = 0; i < 150; i++) {
        errorReporter.reportError(new Error(`Error ${i}`));
        errorReporter.trackPerformanceIssue({
          type: 'memory',
          value: i,
          threshold: 100,
          timestamp: new Date().toISOString(),
          context: {}
        });
        errorReporter.logUserAction(
          { action: `action_${i}`, timestamp: new Date().toISOString(), context: {} },
          { success: true }
        );
      }

      expect(errorReporter.getRecentReports(200).length).toBeLessThanOrEqual(100);
      expect(errorReporter.getPerformanceIssues(200).length).toBeLessThanOrEqual(100);
      expect(errorReporter.getUserActions(200).length).toBeLessThanOrEqual(100);
    });
  });
});