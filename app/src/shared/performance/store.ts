import { create } from 'zustand';
import type { PerformanceMetrics, RenderSettings, DeviceInfo } from './PerformanceManager';

export interface PerformanceAlert {
  id: string;
  type: 'memory' | 'fps' | 'render';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}

interface PerformanceState {
  // Current metrics
  currentMetrics: PerformanceMetrics | null;
  
  // Performance history (last 5 minutes)
  metricsHistory: PerformanceMetrics[];
  
  // Device information
  deviceInfo: DeviceInfo | null;
  
  // Current render settings
  renderSettings: RenderSettings | null;
  
  // Performance alerts
  alerts: PerformanceAlert[];
  
  // Monitoring state
  isMonitoring: boolean;
  monitoringInterval: number; // in milliseconds
  
  // Entity count tracking
  entityCount: number;
  
  // Actions
  updateMetrics: (metrics: PerformanceMetrics) => void;
  setDeviceInfo: (info: DeviceInfo) => void;
  setRenderSettings: (settings: RenderSettings) => void;
  setEntityCount: (count: number) => void;
  startMonitoring: (interval?: number) => void;
  stopMonitoring: () => void;
  addAlert: (alert: Omit<PerformanceAlert, 'id' | 'timestamp'>) => void;
  resolveAlert: (alertId: string) => void;
  clearAlerts: () => void;
  clearHistory: () => void;
}

const MAX_HISTORY_SIZE = 300; // 5 minutes at 1 sample per second
const DEFAULT_MONITORING_INTERVAL = 1000; // 1 second

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  fps: {
    warning: 45,
    critical: 30,
  },
  memory: {
    warning: 150, // MB
    critical: 200, // MB
  },
  renderTime: {
    warning: 20, // ms
    critical: 33, // ms (30fps threshold)
  },
};

export const usePerformanceStore = create<PerformanceState>((set) => ({
  currentMetrics: null,
  metricsHistory: [],
  deviceInfo: null,
  renderSettings: null,
  alerts: [],
  isMonitoring: false,
  monitoringInterval: DEFAULT_MONITORING_INTERVAL,
  entityCount: 0,

  updateMetrics: (metrics) => {
    set((state) => {
      // Update entity count in metrics
      const updatedMetrics = {
        ...metrics,
        entityCount: state.entityCount,
      };

      // Add to history
      const newHistory = [...state.metricsHistory, updatedMetrics];
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
      }

      // Check for performance issues and create alerts
      const newAlerts = [...state.alerts];
      
      // FPS alerts
      if (updatedMetrics.fps < PERFORMANCE_THRESHOLDS.fps.critical) {
        const existingAlert = newAlerts.find(a => a.type === 'fps' && !a.resolved);
        if (!existingAlert) {
          newAlerts.push({
            id: crypto.randomUUID(),
            type: 'fps',
            severity: 'critical',
            message: `Critical FPS drop: ${updatedMetrics.fps.toFixed(1)} FPS`,
            timestamp: updatedMetrics.timestamp,
            resolved: false,
          });
        }
      } else if (updatedMetrics.fps < PERFORMANCE_THRESHOLDS.fps.warning) {
        const existingAlert = newAlerts.find(a => a.type === 'fps' && !a.resolved);
        if (!existingAlert) {
          newAlerts.push({
            id: crypto.randomUUID(),
            type: 'fps',
            severity: 'warning',
            message: `Low FPS detected: ${updatedMetrics.fps.toFixed(1)} FPS`,
            timestamp: updatedMetrics.timestamp,
            resolved: false,
          });
        }
      }

      // Memory alerts
      if (updatedMetrics.memoryUsage && updatedMetrics.memoryUsage.usedMB > PERFORMANCE_THRESHOLDS.memory.critical) {
        const existingAlert = newAlerts.find(a => a.type === 'memory' && a.severity === 'critical' && !a.resolved);
        if (!existingAlert) {
          newAlerts.push({
            id: crypto.randomUUID(),
            type: 'memory',
            severity: 'critical',
            message: `Critical memory usage: ${updatedMetrics.memoryUsage.usedMB.toFixed(1)} MB`,
            timestamp: updatedMetrics.timestamp,
            resolved: false,
          });
        }
      } else if (updatedMetrics.memoryUsage && updatedMetrics.memoryUsage.usedMB > PERFORMANCE_THRESHOLDS.memory.warning) {
        const existingAlert = newAlerts.find(a => a.type === 'memory' && a.severity === 'warning' && !a.resolved);
        if (!existingAlert) {
          newAlerts.push({
            id: crypto.randomUUID(),
            type: 'memory',
            severity: 'warning',
            message: `High memory usage: ${updatedMetrics.memoryUsage.usedMB.toFixed(1)} MB`,
            timestamp: updatedMetrics.timestamp,
            resolved: false,
          });
        }
      }

      // Render time alerts
      if (updatedMetrics.renderTime > PERFORMANCE_THRESHOLDS.renderTime.critical) {
        const existingAlert = newAlerts.find(a => a.type === 'render' && a.severity === 'critical' && !a.resolved);
        if (!existingAlert) {
          newAlerts.push({
            id: crypto.randomUUID(),
            type: 'render',
            severity: 'critical',
            message: `Critical render time: ${updatedMetrics.renderTime.toFixed(1)} ms`,
            timestamp: updatedMetrics.timestamp,
            resolved: false,
          });
        }
      } else if (updatedMetrics.renderTime > PERFORMANCE_THRESHOLDS.renderTime.warning) {
        const existingAlert = newAlerts.find(a => a.type === 'render' && a.severity === 'warning' && !a.resolved);
        if (!existingAlert) {
          newAlerts.push({
            id: crypto.randomUUID(),
            type: 'render',
            severity: 'warning',
            message: `Slow render time: ${updatedMetrics.renderTime.toFixed(1)} ms`,
            timestamp: updatedMetrics.timestamp,
            resolved: false,
          });
        }
      }

      return {
        currentMetrics: updatedMetrics,
        metricsHistory: newHistory,
        alerts: newAlerts,
      };
    });
  },

  setDeviceInfo: (info) => set({ deviceInfo: info }),

  setRenderSettings: (settings) => set({ renderSettings: settings }),

  setEntityCount: (count) => set({ entityCount: count }),

  startMonitoring: (interval = DEFAULT_MONITORING_INTERVAL) => {
    set({ isMonitoring: true, monitoringInterval: interval });
  },

  stopMonitoring: () => {
    set({ isMonitoring: false });
  },

  addAlert: (alert) => {
    set((state) => ({
      alerts: [
        ...state.alerts,
        {
          ...alert,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ],
    }));
  },

  resolveAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ),
    }));
  },

  clearAlerts: () => set({ alerts: [] }),

  clearHistory: () => set({ metricsHistory: [] }),
}));

// Selector hooks for common use cases
export const useCurrentMetrics = () => usePerformanceStore((state) => state.currentMetrics);
export const usePerformanceAlerts = () => usePerformanceStore((state) => state.alerts.filter(a => !a.resolved));
export const useIsMonitoring = () => usePerformanceStore((state) => state.isMonitoring);
export const useDeviceInfo = () => usePerformanceStore((state) => state.deviceInfo);
export const useRenderSettings = () => usePerformanceStore((state) => state.renderSettings);