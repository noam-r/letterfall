import { useEffect, useRef, useCallback } from 'react';
import { PerformanceManager } from './PerformanceManager';
import { usePerformanceStore } from './store';

/**
 * Hook to initialize and manage the performance manager
 */
export function usePerformanceManager() {
  const managerRef = useRef<PerformanceManager | null>(null);
  
  // Initialize performance manager
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new PerformanceManager();
      
      // Set device info in store
      const deviceInfo = managerRef.current.getDeviceInfo();
      usePerformanceStore.getState().setDeviceInfo(deviceInfo);
      
      // Set initial render settings
      const renderSettings = managerRef.current.optimizeRendering(deviceInfo);
      usePerformanceStore.getState().setRenderSettings(renderSettings);
    }
    
    return () => {
      if (managerRef.current) {
        managerRef.current.reset();
      }
    };
  }, []);
  
  return managerRef.current;
}

/**
 * Hook to start/stop real-time performance monitoring
 */
export function usePerformanceMonitoring(enabled: boolean = true, interval: number = 1000) {
  const performanceManager = usePerformanceManager();
  const intervalRef = useRef<number | null>(null);
  const { updateMetrics, startMonitoring, stopMonitoring } = usePerformanceStore();
  
  const startMonitoringLoop = useCallback(() => {
    if (!performanceManager || intervalRef.current) return;
    
    startMonitoring(interval);
    
    const monitor = () => {
      const metrics = performanceManager.trackFPS();
      updateMetrics(metrics);
      
      // Check if quality adjustment is needed
      const adjustedSettings = performanceManager.adjustQuality(metrics);
      usePerformanceStore.getState().setRenderSettings(adjustedSettings);
    };
    
    // Initial measurement
    monitor();
    
    // Set up interval
    intervalRef.current = window.setInterval(monitor, interval);
  }, [performanceManager, interval, updateMetrics, startMonitoring]);
  
  const stopMonitoringLoop = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stopMonitoring();
  }, [stopMonitoring]);
  
  useEffect(() => {
    if (enabled) {
      startMonitoringLoop();
    } else {
      stopMonitoringLoop();
    }
    
    return stopMonitoringLoop;
  }, [enabled, startMonitoringLoop, stopMonitoringLoop]);
  
  return {
    start: startMonitoringLoop,
    stop: stopMonitoringLoop,
  };
}

/**
 * Hook to track entity count for performance monitoring
 */
export function useEntityCountTracking() {
  const { setEntityCount } = usePerformanceStore();
  
  const updateEntityCount = useCallback((count: number) => {
    setEntityCount(count);
  }, [setEntityCount]);
  
  return updateEntityCount;
}

/**
 * Hook to get performance metrics with automatic updates
 */
export function usePerformanceMetrics() {
  const currentMetrics = usePerformanceStore((state) => state.currentMetrics);
  const metricsHistory = usePerformanceStore((state) => state.metricsHistory);
  const isMonitoring = usePerformanceStore((state) => state.isMonitoring);
  
  // Calculate derived metrics
  const derivedMetrics = currentMetrics ? {
    ...currentMetrics,
    // Add trend indicators
    fpsTrend: metricsHistory.length >= 2 ? 
      currentMetrics.fps - metricsHistory[metricsHistory.length - 2].fps : 0,
    memoryTrend: metricsHistory.length >= 2 ? 
      (currentMetrics.memoryUsage?.usedMB || 0) - (metricsHistory[metricsHistory.length - 2].memoryUsage?.usedMB || 0) : 0,
  } : null;
  
  return {
    current: derivedMetrics,
    history: metricsHistory,
    isMonitoring,
  };
}

/**
 * Hook to get performance alerts with management functions
 */
export function usePerformanceAlerts() {
  const alerts = usePerformanceStore((state) => state.alerts);
  const { resolveAlert, clearAlerts, addAlert } = usePerformanceStore();
  
  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
  const warningAlerts = activeAlerts.filter(alert => alert.severity === 'warning');
  
  return {
    all: alerts,
    active: activeAlerts,
    critical: criticalAlerts,
    warnings: warningAlerts,
    resolve: resolveAlert,
    clear: clearAlerts,
    add: addAlert,
  };
}

/**
 * Hook to get performance summary statistics
 */
export function usePerformanceSummary() {
  const performanceManager = usePerformanceManager();
  const metricsHistory = usePerformanceStore((state) => state.metricsHistory);
  
  const summary = performanceManager ? performanceManager.getPerformanceSummary() : null;
  
  // Calculate additional statistics from history
  const historyStats = metricsHistory.length > 0 ? {
    totalSamples: metricsHistory.length,
    timeSpan: metricsHistory.length > 1 ? 
      metricsHistory[metricsHistory.length - 1].timestamp - metricsHistory[0].timestamp : 0,
    avgMemoryUsage: metricsHistory.reduce((sum, m) => sum + (m.memoryUsage?.usedMB || 0), 0) / metricsHistory.length,
    maxMemoryUsage: Math.max(...metricsHistory.map(m => m.memoryUsage?.usedMB || 0)),
    avgEntityCount: metricsHistory.reduce((sum, m) => sum + m.entityCount, 0) / metricsHistory.length,
    maxEntityCount: Math.max(...metricsHistory.map(m => m.entityCount)),
  } : null;
  
  return {
    ...summary,
    history: historyStats,
  };
}

/**
 * Hook to automatically adjust render quality based on performance
 */
export function useAutoQualityAdjustment() {
  const performanceManager = usePerformanceManager();
  const currentMetrics = usePerformanceStore((state) => state.currentMetrics);
  const { setRenderSettings } = usePerformanceStore();
  
  useEffect(() => {
    if (!performanceManager || !currentMetrics) return;
    
    const adjustedSettings = performanceManager.adjustQuality(currentMetrics);
    setRenderSettings(adjustedSettings);
  }, [performanceManager, currentMetrics, setRenderSettings]);
}

/**
 * Hook to trigger garbage collection when memory usage is high
 */
export function useMemoryManagement() {
  const currentMetrics = usePerformanceStore((state) => state.currentMetrics);
  const { addAlert } = usePerformanceStore();
  
  useEffect(() => {
    if (!currentMetrics) return;
    
    const memoryUsageMB = currentMetrics.memoryUsage?.usedMB || 0;
    
    // Trigger garbage collection if memory usage is very high
    if (memoryUsageMB > 200 && 'gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
        addAlert({
          type: 'memory',
          severity: 'warning',
          message: 'Triggered garbage collection due to high memory usage',
          resolved: false,
        });
      } catch (error) {
        console.warn('Failed to trigger garbage collection:', error);
      }
    }
  }, [currentMetrics, addAlert]);
}