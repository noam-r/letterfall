/**
 * End-to-end validation tests
 * Tests complete user flows and system integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IntegrationValidator } from './integration-validation';

// Mock DOM APIs that might not be available in test environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock performance APIs
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000,
    },
  },
});

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn(callback => setTimeout(callback, 16)),
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn(id => clearTimeout(id)),
});

describe('End-to-End Validation', () => {
  let validator: IntegrationValidator;

  beforeEach(() => {
    validator = new IntegrationValidator();
    
    // Clear any existing DOM elements
    document.body.innerHTML = '';
    
    // Reset document classes
    document.documentElement.className = '';
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
    document.documentElement.className = '';
  });

  describe('System Integration', () => {
    it('should validate all core systems', async () => {
      const results = await validator.runValidation();
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      
      // Check that we have results for all expected components
      const componentNames = results.map(r => r.component);
      expect(componentNames).toContain('PerformanceManager');
      expect(componentNames).toContain('LetterEntityPool');
      expect(componentNames).toContain('ResourceLoader');
      expect(componentNames).toContain('AccessibilityManager');
      expect(componentNames).toContain('ErrorReporter');
      expect(componentNames).toContain('ReducedMotionManager');
      
      // Calculate success rate
      const successRate = validator.getSuccessRate();
      expect(successRate).toBeGreaterThanOrEqual(80); // At least 80% should pass
    }, 10000);

    it('should achieve minimum success rate', async () => {
      const results = await validator.runValidation();
      const successRate = validator.getSuccessRate();
      
      // At least 80% of systems should be working
      expect(successRate).toBeGreaterThanOrEqual(80);
      
      // Log results for debugging
      console.log('Integration test results:', {
        successRate,
        totalTests: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      });
    });
  });
});