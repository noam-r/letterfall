// Export all stores
export { useGameStateStore } from './GameStateStore';
export { useSettingsStore } from './SettingsStore';
export { useStatisticsStore } from './StatisticsStore';

// Import for internal use
import { useGameStateStore } from './GameStateStore';
import { useSettingsStore } from './SettingsStore';
import { useStatisticsStore } from './StatisticsStore';

// Export types
export type {
  Difficulty,
  SpeedSetting,
  WordProgress,
  SessionSnapshot,
  RoundPhase,
  CollectResult,
} from './GameStateStore';

// Export selector hooks
export {
  useDifficulty,
  useSpeed,
  useNoiseLevel,
  useReducedMotion,
  useMuted,
  useLanguage,
  useSelectedTopicId,
  useShowOnboarding,
} from './SettingsStore';

export {
  useRoundsPlayed,
  useWins,
  useWinStreak,
  useBestCredits,
  useLastSessions,
  useWinRate,
} from './StatisticsStore';

// Import the actual store types
import type { GameState } from './GameStateStore';
import type { SettingsState } from './SettingsStore';
import type { StatisticsState } from './StatisticsStore';

// Create a unified state type for backward compatibility
type UnifiedState = {
  // Game state
  view: GameState['view'];
  roundPhase: GameState['roundPhase'];
  credits: GameState['credits'];
  topicId: GameState['topicId'];
  topicName: GameState['topicName'];
  wordPool: GameState['wordPool'];
  words: GameState['words'];
  activeWord: GameState['activeWord'];
  construction: GameState['construction'];
  fairnessPulse: GameState['fairnessPulse'];
  feedbackFlash: GameState['feedbackFlash'];

  // Settings
  difficulty: SettingsState['difficulty'];
  speed: SettingsState['speed'];
  noiseLevel: SettingsState['noiseLevel'];
  reducedMotion: SettingsState['reducedMotion'];
  muted: SettingsState['muted'];
  language: SettingsState['language'];
  selectedTopicId: SettingsState['selectedTopicId'];
  showOnboarding: SettingsState['showOnboarding'];

  // Statistics
  roundsPlayed: StatisticsState['roundsPlayed'];
  wins: StatisticsState['wins'];
  winStreak: StatisticsState['winStreak'];
  bestCredits: StatisticsState['bestCredits'];
  lastSessions: StatisticsState['lastSessions'];

  // Game actions
  setView: GameState['setView'];
  startRound: GameState['startRound'];
  restartRound: GameState['restartRound'];
  selectWord: GameState['selectWord'];
  collectLetter: GameState['collectLetter'];
  missLetter: GameState['missLetter'];
  resetRoundState: GameState['resetRoundState'];
  setFairnessPulse: GameState['setFairnessPulse'];
  pauseRound: GameState['pauseRound'];
  resumeRound: GameState['resumeRound'];
  setFeedbackFlash: GameState['setFeedbackFlash'];

  // Settings actions
  setDifficulty: SettingsState['setDifficulty'];
  setSpeed: SettingsState['setSpeed'];
  setNoiseLevel: SettingsState['setNoiseLevel'];
  setReducedMotion: SettingsState['setReducedMotion'];
  toggleMute: SettingsState['toggleMute'];
  setSelectedTopic: SettingsState['setSelectedTopic'];
  setLanguage: (language: Parameters<SettingsState['setLanguage']>[0]) => void;
  dismissOnboarding: () => void;
  requestOnboarding: () => void;
};

// Create a unified store function with getState and subscribe methods
function createUnifiedState(): UnifiedState {
  const gameState = useGameStateStore.getState();
  const settings = useSettingsStore.getState();
  const statistics = useStatisticsStore.getState();

  return {
    // Game state
    view: gameState.view,
    roundPhase: gameState.roundPhase,
    credits: gameState.credits,
    topicId: gameState.topicId,
    topicName: gameState.topicName,
    wordPool: gameState.wordPool,
    words: gameState.words,
    activeWord: gameState.activeWord,
    construction: gameState.construction,
    fairnessPulse: gameState.fairnessPulse,
    feedbackFlash: gameState.feedbackFlash,

    // Settings
    difficulty: settings.difficulty,
    speed: settings.speed,
    noiseLevel: settings.noiseLevel,
    reducedMotion: settings.reducedMotion,
    muted: settings.muted,
    language: settings.language,
    selectedTopicId: settings.selectedTopicId,
    showOnboarding: settings.showOnboarding,

    // Statistics
    roundsPlayed: statistics.roundsPlayed,
    wins: statistics.wins,
    winStreak: statistics.winStreak,
    bestCredits: statistics.bestCredits,
    lastSessions: statistics.lastSessions,

    // Game actions
    setView: gameState.setView,
    startRound: gameState.startRound,
    restartRound: gameState.restartRound,
    selectWord: gameState.selectWord,
    collectLetter: gameState.collectLetter,
    missLetter: gameState.missLetter,
    resetRoundState: gameState.resetRoundState,
    setFairnessPulse: gameState.setFairnessPulse,
    pauseRound: gameState.pauseRound,
    resumeRound: gameState.resumeRound,
    setFeedbackFlash: gameState.setFeedbackFlash,

    // Settings actions
    setDifficulty: settings.setDifficulty,
    setSpeed: settings.setSpeed,
    setNoiseLevel: settings.setNoiseLevel,
    setReducedMotion: settings.setReducedMotion,
    toggleMute: settings.toggleMute,
    setSelectedTopic: settings.setSelectedTopic,
    setLanguage: (language: Parameters<typeof settings.setLanguage>[0]) => {
      settings.setLanguage(language);
      gameState.updateLanguage(language);
    },
    dismissOnboarding: () => {
      settings.dismissOnboarding();
      gameState.resumeRound();
    },
    requestOnboarding: () => {
      settings.requestOnboarding();
      gameState.pauseRound();
    },
  };
}

// Unified store hook for backward compatibility during migration
export function useAppStore(): UnifiedState;
export function useAppStore<T>(selector: (state: UnifiedState) => T): T;
export function useAppStore<T>(selector?: (state: UnifiedState) => T) {
  const gameState = useGameStateStore();
  const settings = useSettingsStore();
  const statistics = useStatisticsStore();

  const unifiedState: UnifiedState = {
    // Game state
    view: gameState.view,
    roundPhase: gameState.roundPhase,
    credits: gameState.credits,
    topicId: gameState.topicId,
    topicName: gameState.topicName,
    wordPool: gameState.wordPool,
    words: gameState.words,
    activeWord: gameState.activeWord,
    construction: gameState.construction,
    fairnessPulse: gameState.fairnessPulse,
    feedbackFlash: gameState.feedbackFlash,

    // Settings
    difficulty: settings.difficulty,
    speed: settings.speed,
    noiseLevel: settings.noiseLevel,
    reducedMotion: settings.reducedMotion,
    muted: settings.muted,
    language: settings.language,
    selectedTopicId: settings.selectedTopicId,
    showOnboarding: settings.showOnboarding,

    // Statistics
    roundsPlayed: statistics.roundsPlayed,
    wins: statistics.wins,
    winStreak: statistics.winStreak,
    bestCredits: statistics.bestCredits,
    lastSessions: statistics.lastSessions,

    // Game actions
    setView: gameState.setView,
    startRound: gameState.startRound,
    restartRound: gameState.restartRound,
    selectWord: gameState.selectWord,
    collectLetter: gameState.collectLetter,
    missLetter: gameState.missLetter,
    resetRoundState: gameState.resetRoundState,
    setFairnessPulse: gameState.setFairnessPulse,
    pauseRound: gameState.pauseRound,
    resumeRound: gameState.resumeRound,
    setFeedbackFlash: gameState.setFeedbackFlash,

    // Settings actions
    setDifficulty: settings.setDifficulty,
    setSpeed: settings.setSpeed,
    setNoiseLevel: settings.setNoiseLevel,
    setReducedMotion: settings.setReducedMotion,
    toggleMute: settings.toggleMute,
    setSelectedTopic: settings.setSelectedTopic,
    setLanguage: (language: Parameters<typeof settings.setLanguage>[0]) => {
      settings.setLanguage(language);
      gameState.updateLanguage(language);
    },
    dismissOnboarding: () => {
      settings.dismissOnboarding();
      gameState.resumeRound();
    },
    requestOnboarding: () => {
      settings.requestOnboarding();
      gameState.pauseRound();
    },
  };

  if (selector) {
    return selector(unifiedState);
  }

  return unifiedState;
}

// Add getState and subscribe methods for backward compatibility
useAppStore.getState = createUnifiedState;

useAppStore.subscribe = (listener: (state: UnifiedState, previousState: UnifiedState) => void) => {
  let previousState = createUnifiedState();
  
  const unsubscribeGame = useGameStateStore.subscribe(() => {
    const currentState = createUnifiedState();
    listener(currentState, previousState);
    previousState = currentState;
  });
  
  const unsubscribeSettings = useSettingsStore.subscribe(() => {
    const currentState = createUnifiedState();
    listener(currentState, previousState);
    previousState = currentState;
  });
  
  const unsubscribeStatistics = useStatisticsStore.subscribe(() => {
    const currentState = createUnifiedState();
    listener(currentState, previousState);
    previousState = currentState;
  });
  
  return () => {
    unsubscribeGame();
    unsubscribeSettings();
    unsubscribeStatistics();
  };
};