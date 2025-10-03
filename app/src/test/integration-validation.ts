/**
 * Integration validation script for final testing
 * This script validates that all major systems work together
 */

import { PerformanceManager } from '../shared/performance/PerformanceManager';
import { LetterEntityPool } from '../game/engine/LetterEntityPool';
import { ResourceLoader } from '../shared/resources/ResourceLoader';
import { AccessibilityManager } from '../shared/accessibility/AccessibilityManager';
import { ReducedMotionManager } from '../shared/accessibility/ReducedMotionManager';
import { ErrorReporter } from '../shared/error/ErrorReporter';

/**
 * Validation results interface
 */
interface ValidationResult {
  component: string;
  passed: boolean;
  error?: string;
  metrics?: Record<string, any>;
}

/**
 * Main validation class
 */
export class IntegrationValidator {
  private results: ValidationResult[] = [];

  /**
   * Run all validation tests
   */
  async runValidation(): Promise<ValidationResult[]> {
    console.log('🚀 Starting integration validation...');
    
    // Test performance monitoring
    await this.validatePerformanceManager();
    
    // Test object pooling
    await this.validateLetterEntityPool();
    
    // Test resource loading
    await this.validateResourceLoader();
    
    // Test accessibility features
    await this.validateAccessibilityManager();
    
    // Test error handling
    await this.validateErrorReporter();
    
    // Test reduced motion
    await this.validateReducedMotionManager();
    
    // Print summary
    this.printSummary();
    
    return this.results;
  }

  /**
   * Validate PerformanceManager
   */
  private async validatePerformanceManager(): Promise<void> {
    try {
      const performanceManager = new PerformanceManager();
      
      // Test basic functionality
      performanceManager.startMonitoring();
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const metrics = performanceManager.getMetrics();
      
      if (metrics && typeof metrics.fps === 'number') {
        this.addResult('PerformanceManager', true, undefined, {
          fps: metrics.fps,
          memory: metrics.memory
        });
      } else {
        this.addResult('PerformanceManager', false, 'Invalid metrics format');
      }
      
      performanceManager.destroy();
    } catch (error) {
      this.addResult('PerformanceManager', false, (error as Error).message);
    }
  }

  /**
   * Validate LetterEntityPool
   */
  private async validateLetterEntityPool(): Promise<void> {
    try {
      const pool = new LetterEntityPool({
        initialSize: 5,
        maxSize: 20,
        style: {
          fontFamily: 'Arial',
          fontSize: 24,
          fill: '#000000',
        } as any,
      });
      
      // Test acquisition and release
      const letter1 = pool.acquire('A', 100, 50);
      const letter2 = pool.acquire('B', 200, 100);
      
      if (letter1 && letter2) {
        pool.release(letter1);
        pool.release(letter2);
        
        // Test reuse
        const letter3 = pool.acquire('C', 300, 150);
        
        this.addResult('LetterEntityPool', true, undefined, {
          activeCount: pool.getActiveCount(),
          poolSize: pool.getPoolSize()
        });
        
        pool.release(letter3);
      } else {
        this.addResult('LetterEntityPool', false, 'Failed to acquire letters');
      }
      
      pool.cleanup();
    } catch (error) {
      this.addResult('LetterEntityPool', false, (error as Error).message);
    }
  }

  /**
   * Validate ResourceLoader
   */
  private async validateResourceLoader(): Promise<void> {
    try {
      const loader = new ResourceLoader({
        timeout: 5000,
        retries: 1
      });
      
      // Test cache functionality
      const testData = { test: 'data' };
      
      // Mock a successful load by directly setting cache
      (loader as any).cache.set('data:/test.json', testData);
      
      const cached = loader.getCachedResource({ url: '/test.json', type: 'data', priority: 'high' });
      
      if (cached === testData) {
        this.addResult('ResourceLoader', true, undefined, {
          cacheSize: loader.getCacheStats().size
        });
      } else {
        this.addResult('ResourceLoader', false, 'Cache functionality failed');
      }
      
      loader.clearCache();
    } catch (error) {
      this.addResult('ResourceLoader', false, (error as Error).message);
    }
  }

  /**
   * Validate AccessibilityManager
   */
  private async validateAccessibilityManager(): Promise<void> {
    try {
      const accessibilityManager = new AccessibilityManager();
      
      // Test announcement
      accessibilityManager.announce('Test announcement');
      
      // Test focus management
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      document.body.appendChild(button);
      
      accessibilityManager.setFocusToElement(button);
      
      const config = accessibilityManager.getConfig();
      
      if (config && typeof config.announceGameEvents === 'boolean') {
        this.addResult('AccessibilityManager', true, undefined, {
          announceGameEvents: config.announceGameEvents,
          keyboardNavigation: config.keyboardNavigation
        });
      } else {
        this.addResult('AccessibilityManager', false, 'Invalid config format');
      }
      
      document.body.removeChild(button);
      accessibilityManager.destroy();
    } catch (error) {
      this.addResult('AccessibilityManager', false, (error as Error).message);
    }
  }

  /**
   * Validate ErrorReporter
   */
  private async validateErrorReporter(): Promise<void> {
    try {
      const errorReporter = new ErrorReporter();
      
      // Test error reporting (should not throw)
      errorReporter.reportError(new Error('Test error'), {
        component: 'IntegrationValidator',
        action: 'testing'
      });
      
      const stats = errorReporter.getErrorStats();
      
      if (stats && typeof stats.totalErrors === 'number') {
        this.addResult('ErrorReporter', true, undefined, {
          totalErrors: stats.totalErrors,
          recentErrors: stats.recentErrors
        });
      } else {
        this.addResult('ErrorReporter', false, 'Invalid stats format');
      }
    } catch (error) {
      this.addResult('ErrorReporter', false, (error as Error).message);
    }
  }

  /**
   * Validate ReducedMotionManager
   */
  private async validateReducedMotionManager(): Promise<void> {
    try {
      const reducedMotionManager = new ReducedMotionManager();
      
      // Test configuration
      // const initialConfig = reducedMotionManager.getConfig();
      
      reducedMotionManager.updateConfig({
        reduceAnimationSpeed: true,
        simplifyTransitions: true
      });
      
      const updatedConfig = reducedMotionManager.getConfig();
      
      if (updatedConfig.reduceAnimationSpeed && updatedConfig.simplifyTransitions) {
        this.addResult('ReducedMotionManager', true, undefined, {
          isEnabled: reducedMotionManager.getIsEnabled(),
          config: updatedConfig
        });
      } else {
        this.addResult('ReducedMotionManager', false, 'Configuration update failed');
      }
    } catch (error) {
      this.addResult('ReducedMotionManager', false, (error as Error).message);
    }
  }

  /**
   * Add a validation result
   */
  private addResult(component: string, passed: boolean, error?: string, metrics?: Record<string, any>): void {
    this.results.push({
      component,
      passed,
      error,
      metrics
    });
  }

  /**
   * Print validation summary
   */
  private printSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log('\n📊 Integration Validation Summary');
    console.log('================================');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.component}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.metrics) {
        console.log(`   Metrics:`, result.metrics);
      }
    });
    
    if (passed === total) {
      console.log('\n🎉 All integration tests passed!');
    } else {
      console.log(`\n⚠️  ${total - passed} integration test(s) failed.`);
    }
  }

  /**
   * Get validation success rate
   */
  getSuccessRate(): number {
    const passed = this.results.filter(r => r.passed).length;
    return this.results.length > 0 ? (passed / this.results.length) * 100 : 0;
  }
}