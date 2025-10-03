import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceManager } from '../PerformanceManager';
import { LetterEntityPool } from '@game/engine/LetterEntityPool';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  minFPS: 30,
  maxFrameTime: 33.33, // ~30fps
  maxLetterPoolOperationTime: 1, // 1ms
  maxStateUpdateTime: 5, // 5ms
};

describe('Performance Regression Tests', () => {
  let performanceManager: PerformanceManager;
  let letterPool: LetterEntityPool;

  beforeEach(() => {
    performanceManager = new PerformanceManager();
    letterPool = new LetterEntityPool({
      initialSize: 10,
      maxSize: 50,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#000000',
      },
    });
    
    // Start monitoring
    performanceManager.startMonitoring();
  });

  afterEach(() => {
    performanceManager.destroy();
    letterPool.cleanup();
  });

  describe('Memory Usage Tests', () => {
    it('should not exceed memory threshold during normal operation', async () => {
      const initialMemory = performanceManager.getMemoryUsage();
      
      // Simulate normal game operations
      const letters: any[] = [];
      for (let i = 0; i < 1000; i++) {
        letters.push(letterPool.acquire('A', i, i));
      }

      // Release letters
      letters.forEach(letter => letterPool.release(letter));

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const finalMemory = performanceManager.getMemoryUsage();
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;

      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.maxMemoryUsage);
    });

    it('should not leak memory with repeated letter operations', async () => {
      const measurements: number[] = [];
      
      for (let iteration = 0; iteration < 10; iteration++) {
        // Perform operations
        const letters: any[] = [];
        for (let i = 0; i < 100; i++) {
          letters.push(letterPool.acquire('B', i, i));
        }
        letters.forEach(letter => letterPool.release(letter));

        // Measure memory
        const memory = performanceManager.getMemoryUsage();
        measurements.push(memory.usedJSHeapSize);

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Memory should not continuously increase
      const firstMeasurement = measurements[0];
      const lastMeasurement = measurements[measurements.length - 1];
      const memoryGrowth = lastMeasurement - firstMeasurement;

      // Allow some growth but not excessive
      expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.maxMemoryUsage * 0.1);
    });
  });

  describe('FPS Performance Tests', () => {
    it('should maintain acceptable FPS during intensive operations', async () => {
      const fpsReadings: number[] = [];
      const startTime = performance.now();
      let frameCount = 0;

      const measureFPS = () => {
        frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        
        if (elapsed >= 1000) { // Every second
          const fps = (frameCount / elapsed) * 1000;
          fpsReadings.push(fps);
          frameCount = 0;
        }

        // Simulate intensive operations
        const letters: any[] = [];
        for (let i = 0; i < 50; i++) {
          letters.push(letterPool.acquire('C', Math.random() * 800, Math.random() * 600));
        }
        letters.forEach(letter => letterPool.release(letter));

        if (fpsReadings.length < 3) {
          requestAnimationFrame(measureFPS);
        }
      };

      return new Promise<void>((resolve) => {
        requestAnimationFrame(measureFPS);
        
        setTimeout(() => {
          const averageFPS = fpsReadings.reduce((sum, fps) => sum + fps, 0) / fpsReadings.length;
          expect(averageFPS).toBeGreaterThan(PERFORMANCE_THRESHOLDS.minFPS);
          resolve();
        }, 3500);
      });
    });
  });

  describe('Operation Performance Tests', () => {
    it('should complete letter pool operations within time threshold', () => {
      const operationTimes: number[] = [];

      for (let i = 0; i < 1000; i++) {
        const startTime = performance.now();
        
        const letter = letterPool.acquire('D', i, i);
        letterPool.release(letter);
        
        const endTime = performance.now();
        operationTimes.push(endTime - startTime);
      }

      const averageTime = operationTimes.reduce((sum, time) => sum + time, 0) / operationTimes.length;
      const maxTime = Math.max(...operationTimes);

      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.maxLetterPoolOperationTime);
      expect(maxTime).toBeLessThan(PERFORMANCE_THRESHOLDS.maxLetterPoolOperationTime * 5); // Allow some variance
    });

    it('should handle bulk operations efficiently', () => {
      const bulkSizes = [100, 500, 1000];
      
      bulkSizes.forEach(size => {
        const startTime = performance.now();
        
        const letters: any[] = [];
        for (let i = 0; i < size; i++) {
          letters.push(letterPool.acquire('E', i, i));
        }
        
        letters.forEach(letter => letterPool.release(letter));
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const timePerOperation = totalTime / size;

        expect(timePerOperation).toBeLessThan(PERFORMANCE_THRESHOLDS.maxLetterPoolOperationTime);
      });
    });
  });

  describe('Performance Monitoring Tests', () => {
    it('should track performance metrics accurately', async () => {
      // Let it run for a bit to collect data
      await new Promise(resolve => setTimeout(resolve, 1000));

      const metrics = performanceManager.getMetrics();
      
      expect(metrics.fps).toBeGreaterThan(0);
      expect(metrics.frameTime).toBeGreaterThan(0);
      expect(metrics.memory.usedJSHeapSize).toBeGreaterThan(0);
      expect(metrics.memory.totalJSHeapSize).toBeGreaterThan(0);
    });

    it('should detect performance issues', async () => {
      // Simulate performance issue
      const simulateSlowOperation = () => {
        const start = performance.now();
        while (performance.now() - start < 50) {
          // Busy wait to simulate slow operation
        }
      };

      // Run slow operations
      for (let i = 0; i < 5; i++) {
        simulateSlowOperation();
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const metrics = performanceManager.getMetrics();
      
      // Should detect the performance degradation
      expect(metrics.frameTime).toBeGreaterThan(PERFORMANCE_THRESHOLDS.maxFrameTime);
    });
  });

  describe('Stress Tests', () => {
    it('should handle maximum concurrent letter entities', () => {
      const maxLetters = 1000;
      const letters: any[] = [];

      const startTime = performance.now();

      // Acquire maximum letters
      for (let i = 0; i < maxLetters; i++) {
        letters.push(letterPool.acquire('F', i % 800, i % 600));
      }

      const acquisitionTime = performance.now() - startTime;

      // Release all letters
      const releaseStartTime = performance.now();
      letters.forEach(letter => letterPool.release(letter));
      const releaseTime = performance.now() - releaseStartTime;

      // Both operations should complete in reasonable time
      expect(acquisitionTime).toBeLessThan(100); // 100ms for 1000 acquisitions
      expect(releaseTime).toBeLessThan(100); // 100ms for 1000 releases
      expect(letterPool.getActiveCount()).toBe(0);
    });

    it('should maintain performance under rapid state changes', () => {
      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // Simulate rapid acquire/release cycles
        const letter = letterPool.acquire('G', i % 100, i % 100);
        letterPool.release(letter);
      }

      const totalTime = performance.now() - startTime;
      const timePerIteration = totalTime / iterations;

      expect(timePerIteration).toBeLessThan(PERFORMANCE_THRESHOLDS.maxLetterPoolOperationTime);
    });
  });

  describe('Memory Leak Detection', () => {
    it('should not accumulate objects over time', async () => {
      const initialMetrics = performanceManager.getMetrics();
      
      // Perform many operations
      for (let cycle = 0; cycle < 100; cycle++) {
        const letters: any[] = [];
        
        for (let i = 0; i < 50; i++) {
          letters.push(letterPool.acquire('H', i, i));
        }
        
        letters.forEach(letter => letterPool.release(letter));
        
        // Occasional pause to allow cleanup
        if (cycle % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const finalMetrics = performanceManager.getMetrics();
      const memoryIncrease = finalMetrics.memory.usedJSHeapSize - initialMetrics.memory.usedJSHeapSize;

      // Memory increase should be minimal
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.maxMemoryUsage * 0.05);
    });
  });

  describe('Performance Regression Benchmarks', () => {
    it('should maintain baseline performance for common operations', () => {
      const benchmarks = {
        singleAcquire: 0,
        singleRelease: 0,
        bulkAcquire: 0,
        bulkRelease: 0,
      };

      // Single acquire benchmark
      let startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        const letter = letterPool.acquire('I', 0, 0);
        letterPool.release(letter);
      }
      benchmarks.singleAcquire = performance.now() - startTime;

      // Bulk operations benchmark
      startTime = performance.now();
      const letters: any[] = [];
      for (let i = 0; i < 1000; i++) {
        letters.push(letterPool.acquire('J', i, i));
      }
      benchmarks.bulkAcquire = performance.now() - startTime;

      startTime = performance.now();
      letters.forEach(letter => letterPool.release(letter));
      benchmarks.bulkRelease = performance.now() - startTime;

      // All benchmarks should complete within reasonable time
      expect(benchmarks.singleAcquire).toBeLessThan(50); // 50ms for 1000 operations
      expect(benchmarks.bulkAcquire).toBeLessThan(50);
      expect(benchmarks.bulkRelease).toBeLessThan(50);

      console.log('Performance Benchmarks:', benchmarks);
    });
  });
});