export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedMB: number;
  totalMB: number;
  limitMB: number;
}

export interface PerformanceMetrics {
  fps: number;
  memoryUsage?: MemoryStats;
  memory?: MemoryStats;
  renderTime: number;
  frameTime?: number;
  updateTime?: number;
  entityCount: number;
  timestamp: number;
}

export interface DeviceInfo {
  hardwareConcurrency: number;
  deviceMemory?: number;
  connection?: {
    effectiveType: string;
    downlink: number;
  };
}

export interface RenderSettings {
  antialias: boolean;
  resolution: number;
  maxTextures: number;
  powerPreference: 'default' | 'high-performance' | 'low-power';
}

export class PerformanceManager {
  private fpsHistory: number[] = [];
  private frameStartTime = 0;
  private lastFrameTime = performance.now();
  private renderTimeHistory: number[] = [];
  private readonly maxHistorySize = 60; // Keep 60 samples for 1 second at 60fps
  private isMonitoring = false;
  private animationFrameId?: number;
  
  constructor() {
    this.frameStartTime = performance.now();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitorFrame();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      fps: this.getCurrentFPS(),
      memoryUsage: this.getMemoryUsage(),
      renderTime: this.getAverageRenderTime(),
      entityCount: 0, // This would be set by the game engine
      timestamp: performance.now()
    };
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): MemoryStats {
    return this.monitorMemory();
  }

  /**
   * Destroy the performance manager
   */
  destroy(): void {
    this.stopMonitoring();
    this.fpsHistory = [];
    this.renderTimeHistory = [];
  }

  /**
   * Monitor frame performance
   */
  private monitorFrame(): void {
    if (!this.isMonitoring) return;

    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    
    if (deltaTime > 0) {
      const fps = 1000 / deltaTime;
      this.addFPSSample(fps);
    }
    
    this.lastFrameTime = now;
    this.animationFrameId = requestAnimationFrame(() => this.monitorFrame());
  }

  /**
   * Add FPS sample to history
   */
  private addFPSSample(fps: number): void {
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.maxHistorySize) {
      this.fpsHistory.shift();
    }
  }

  /**
   * Get current FPS
   */
  private getCurrentFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
  }

  /**
   * Get average render time
   */
  private getAverageRenderTime(): number {
    if (this.renderTimeHistory.length === 0) return 0;
    return this.renderTimeHistory.reduce((sum, time) => sum + time, 0) / this.renderTimeHistory.length;
  }

  /**
   * Monitor current memory usage
   */
  monitorMemory(): MemoryStats {
    const memory = (performance as any).memory;
    
    if (!memory) {
      // Fallback for browsers that don't support performance.memory
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        usedMB: 0,
        totalMB: 0,
        limitMB: 0,
      };
    }

    const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100;
    const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100;
    const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedMB,
      totalMB,
      limitMB,
    };
  }

  /**
   * Track FPS and return current metrics
   */
  trackFPS(): PerformanceMetrics {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    const fps = deltaTime > 0 ? 1000 / deltaTime : 0;
    
    // Update FPS history
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.maxHistorySize) {
      this.fpsHistory.shift();
    }
    
    // Calculate average FPS
    const avgFps = this.fpsHistory.reduce((sum, f) => sum + f, 0) / this.fpsHistory.length;
    
    // Calculate render time (time since frame start)
    const renderTime = now - this.frameStartTime;
    this.renderTimeHistory.push(renderTime);
    if (this.renderTimeHistory.length > this.maxHistorySize) {
      this.renderTimeHistory.shift();
    }
    
    const avgRenderTime = this.renderTimeHistory.reduce((sum, t) => sum + t, 0) / this.renderTimeHistory.length;
    
    this.lastFrameTime = now;
    this.frameStartTime = now;
    
    return {
      fps: Math.round(avgFps * 100) / 100,
      memoryUsage: this.monitorMemory(),
      renderTime: Math.round(avgRenderTime * 100) / 100,
      entityCount: 0, // Will be updated by the game runtime
      timestamp: now,
    };
  }

  /**
   * Get device capabilities information
   */
  getDeviceInfo(): DeviceInfo {
    const nav = navigator as any;
    
    return {
      hardwareConcurrency: nav.hardwareConcurrency || 4,
      deviceMemory: nav.deviceMemory,
      connection: nav.connection ? {
        effectiveType: nav.connection.effectiveType || 'unknown',
        downlink: nav.connection.downlink || 0,
      } : undefined,
    };
  }

  /**
   * Optimize rendering settings based on device capabilities
   */
  optimizeRendering(deviceInfo: DeviceInfo): RenderSettings {
    const isLowEnd = deviceInfo.hardwareConcurrency <= 2 || 
                     (deviceInfo.deviceMemory && deviceInfo.deviceMemory <= 2);
    
    const isSlowConnection = deviceInfo.connection?.effectiveType === 'slow-2g' || 
                            deviceInfo.connection?.effectiveType === '2g';

    return {
      antialias: !isLowEnd,
      resolution: isLowEnd ? 1 : window.devicePixelRatio || 1,
      maxTextures: isLowEnd ? 8 : 16,
      powerPreference: isLowEnd || isSlowConnection ? 'low-power' : 'high-performance',
    };
  }

  /**
   * Adjust quality settings based on current performance metrics
   */
  adjustQuality(metrics: PerformanceMetrics): RenderSettings {
    const deviceInfo = this.getDeviceInfo();
    const baseSettings = this.optimizeRendering(deviceInfo);
    
    // If FPS is consistently low, reduce quality
    if (metrics.fps < 30) {
      return {
        ...baseSettings,
        antialias: false,
        resolution: Math.min(baseSettings.resolution, 1),
        maxTextures: Math.min(baseSettings.maxTextures, 8),
        powerPreference: 'low-power',
      };
    }
    
    // If memory usage is high, be more conservative
    if (metrics.memoryUsage && metrics.memoryUsage.usedMB > 100) {
      return {
        ...baseSettings,
        maxTextures: Math.min(baseSettings.maxTextures, 8),
      };
    }
    
    return baseSettings;
  }

  /**
   * Reset performance tracking history
   */
  reset(): void {
    this.fpsHistory = [];
    this.renderTimeHistory = [];
    this.frameStartTime = performance.now();
    this.lastFrameTime = performance.now();
  }

  /**
   * Get performance summary statistics
   */
  getPerformanceSummary(): {
    avgFps: number;
    minFps: number;
    maxFps: number;
    avgRenderTime: number;
    maxRenderTime: number;
  } {
    if (this.fpsHistory.length === 0) {
      return {
        avgFps: 0,
        minFps: 0,
        maxFps: 0,
        avgRenderTime: 0,
        maxRenderTime: 0,
      };
    }

    const avgFps = this.fpsHistory.reduce((sum, f) => sum + f, 0) / this.fpsHistory.length;
    const minFps = Math.min(...this.fpsHistory);
    const maxFps = Math.max(...this.fpsHistory);
    
    const avgRenderTime = this.renderTimeHistory.reduce((sum, t) => sum + t, 0) / this.renderTimeHistory.length;
    const maxRenderTime = Math.max(...this.renderTimeHistory);

    return {
      avgFps: Math.round(avgFps * 100) / 100,
      minFps: Math.round(minFps * 100) / 100,
      maxFps: Math.round(maxFps * 100) / 100,
      avgRenderTime: Math.round(avgRenderTime * 100) / 100,
      maxRenderTime: Math.round(maxRenderTime * 100) / 100,
    };
  }
}