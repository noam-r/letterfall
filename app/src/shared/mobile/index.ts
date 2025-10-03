export { TouchManager } from './TouchManager';
export type { TouchPoint, TouchGesture, TouchManagerConfig } from './TouchManager';

export { ResponsiveManager } from './ResponsiveManager';
export type { ViewportInfo, ResponsiveBreakpoints, ResponsiveConfig } from './ResponsiveManager';

export { DevicePerformance } from './DevicePerformance';
export type { DeviceCapabilities, PerformanceProfile } from './DevicePerformance';

export {
  useTouchGestures,
  useResponsive,
  useDevicePerformance,
  useHapticFeedback,
  useOrientation,
  useMobileGameOptimizations,
} from './hooks';