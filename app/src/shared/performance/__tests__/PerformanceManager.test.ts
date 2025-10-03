import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceManager } from '../PerformanceManager';

// Mock performance.memory for testing
const mockMemory = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
};

// Mock performance.now
const mockPerformanceNow = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockPerformanceNow.mockReturnValue(1000);
  
  // Mock performance object
  Object.defineProperty(global, 'performance', {
    value: {
      now: mockPerformanceNow,
      memory: mockMemory,
    },
    writable: true,
  });

  // Mock navigator
  Object.defineProperty(global, 'navigator', {
    value: {
      hardwareConcurrency: 4,
      deviceMemory: 8,
      connection: {
        effectiveType: '4g',
        downlink: 10,
      },
    },
    writable: true,
  });
});

describe('PerformanceManager', () => {
  let performanceManager: PerformanceManager;

  beforeEach(() => {
    performanceManager = new PerformanceManager();
  });

  describe('monitorMemory', () => {
    it('should return memory stats in MB', () => {
      const memoryStats = performanceManager.monitorMemory();
      
      expect(memoryStats.usedMB).toBe(50);
      expect(memoryStats.totalMB).toBe(100);
      expect(memoryStats.limitMB).toBe(2048);
      expect(memoryStats.usedJSHeapSize).toBe(mockMemory.usedJSHeapSize);
    });

    it('should return zero values when memory API is not available', () => {
      // Remove memory from performance
      Object.defineProperty(global, 'performance', {
        value: { now: mockPerformanceNow },
        writable: true,
      });

      const memoryStats = performanceManager.monitorMemory();
      
      expect(memoryStats.usedMB).toBe(0);
      expect(memoryStats.totalMB).toBe(0);
      expect(memoryStats.limitMB).toBe(0);
    });
  });

  describe('trackFPS', () => {
    it('should return performance metrics with FPS tracking', () => {
      // First frame
      mockPerformanceNow.mockReturnValue(1000);
      performanceManager.trackFPS();
      
      // Second frame
      mockPerformanceNow.mockReturnValue(1016.67);
      const metrics2 = performanceManager.trackFPS();
      
      // Verify metrics structure and reasonable values
      expect(metrics2.fps).toBeGreaterThan(0);
      expect(metrics2.fps).toBeLessThan(1000); // Sanity check
      expect(metrics2.memoryUsage).toBeDefined();
      expect(metrics2.memoryUsage.usedMB).toBe(50);
      expect(metrics2.renderTime).toBeGreaterThan(0);
      expect(metrics2.entityCount).toBe(0);
      expect(metrics2.timestamp).toBe(1016.67);
    });
  });

  describe('getDeviceInfo', () => {
    it('should return device capabilities', () => {
      const deviceInfo = performanceManager.getDeviceInfo();
      
      expect(deviceInfo.hardwareConcurrency).toBe(4);
      expect(deviceInfo.deviceMemory).toBe(8);
      expect(deviceInfo.connection?.effectiveType).toBe('4g');
      expect(deviceInfo.connection?.downlink).toBe(10);
    });
  });

  describe('optimizeRendering', () => {
    it('should return high-quality settings for high-end devices', () => {
      const deviceInfo = {
        hardwareConcurrency: 8,
        deviceMemory: 16,
        connection: { effectiveType: '4g', downlink: 50 },
      };
      
      const settings = performanceManager.optimizeRendering(deviceInfo);
      
      expect(settings.antialias).toBe(true);
      expect(settings.powerPreference).toBe('high-performance');
      expect(settings.maxTextures).toBe(16);
    });

    it('should return low-quality settings for low-end devices', () => {
      const deviceInfo = {
        hardwareConcurrency: 2,
        deviceMemory: 2,
        connection: { effectiveType: '2g', downlink: 1 },
      };
      
      const settings = performanceManager.optimizeRendering(deviceInfo);
      
      expect(settings.antialias).toBe(false);
      expect(settings.powerPreference).toBe('low-power');
      expect(settings.maxTextures).toBe(8);
    });
  });

  describe('adjustQuality', () => {
    it('should reduce quality when FPS is low', () => {
      const metrics = {
        fps: 25, // Low FPS
        memoryUsage: {
          usedJSHeapSize: mockMemory.usedJSHeapSize,
          totalJSHeapSize: mockMemory.totalJSHeapSize,
          jsHeapSizeLimit: mockMemory.jsHeapSizeLimit,
          usedMB: 50,
          totalMB: 100,
          limitMB: 2048,
        },
        renderTime: 20,
        entityCount: 10,
        timestamp: 1000,
      };
      
      const settings = performanceManager.adjustQuality(metrics);
      
      expect(settings.antialias).toBe(false);
      expect(settings.resolution).toBe(1);
      expect(settings.powerPreference).toBe('low-power');
    });

    it('should reduce texture count when memory usage is high', () => {
      const metrics = {
        fps: 60,
        memoryUsage: {
          usedJSHeapSize: 150 * 1024 * 1024,
          totalJSHeapSize: 200 * 1024 * 1024,
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
          usedMB: 150,
          totalMB: 200,
          limitMB: 2048,
        },
        renderTime: 10,
        entityCount: 10,
        timestamp: 1000,
      };
      
      const settings = performanceManager.adjustQuality(metrics);
      
      expect(settings.maxTextures).toBe(8);
    });
  });

  describe('reset', () => {
    it('should clear performance history', () => {
      // Track some FPS to build history with different timestamps
      mockPerformanceNow.mockReturnValue(1000);
      performanceManager.trackFPS();
      
      mockPerformanceNow.mockReturnValue(1016.67);
      performanceManager.trackFPS();
      
      mockPerformanceNow.mockReturnValue(1033.33);
      performanceManager.trackFPS();
      
      const summaryBefore = performanceManager.getPerformanceSummary();
      expect(summaryBefore.avgFps).toBeGreaterThan(0);
      
      performanceManager.reset();
      
      const summaryAfter = performanceManager.getPerformanceSummary();
      expect(summaryAfter.avgFps).toBe(0);
    });
  });
});