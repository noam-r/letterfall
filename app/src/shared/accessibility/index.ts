export { AccessibilityManager } from './AccessibilityManager';
export type { AccessibilitySettings, GameEvent, GameState } from './AccessibilityManager';
export { AccessibilityProvider, useAccessibility } from './context';
export {
  useGameStateAnnouncements,
  useAudioCues,
  useKeyboardHandler,
  useFocusManagement,
  useGameKeyboardControls,
  useReducedMotion,
} from './hooks';
export { ReducedMotionManager, reducedMotionManager } from './ReducedMotionManager';
export type { ReducedMotionConfig } from './ReducedMotionManager';
export { useReducedMotion as useReducedMotionManager } from './ReducedMotionManager';