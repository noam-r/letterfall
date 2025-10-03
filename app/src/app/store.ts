// Legacy store file - now uses the new split stores for backward compatibility
import { useAppStore as useNewAppStore } from '../stores';

// Re-export types for backward compatibility
export type {
  Difficulty,
  SpeedSetting,
  WordProgress,
  SessionSnapshot,
  RoundPhase,
  CollectResult,
} from '../stores';

// Re-export the LOW_CREDIT_THRESHOLD constant
export const LOW_CREDIT_THRESHOLD = 20;

// Use the new unified store for backward compatibility
export const useAppStore = useNewAppStore;