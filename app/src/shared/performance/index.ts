// Core performance manager
export { PerformanceManager } from './PerformanceManager';
export type {
  MemoryStats,
  PerformanceMetrics,
  DeviceInfo,
  RenderSettings,
} from './PerformanceManager';

// Performance store
export {
  usePerformanceStore,
  useCurrentMetrics,
  usePerformanceAlerts,
  useIsMonitoring,
  useDeviceInfo,
  useRenderSettings,
} from './store';
export type { PerformanceAlert } from './store';

// Performance hooks
export {
  usePerformanceManager,
  usePerformanceMonitoring,
  useEntityCountTracking,
  usePerformanceMetrics,
  usePerformanceAlerts as usePerformanceAlertsHook,
  usePerformanceSummary,
  useAutoQualityAdjustment,
  useMemoryManagement,
} from './hooks';

// Performance components
export { PerformanceOverlay } from './PerformanceOverlay';