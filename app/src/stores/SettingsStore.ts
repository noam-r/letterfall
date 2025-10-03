import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { audioBus } from '@shared/audio';
import type { Language } from '@shared/i18n';
import type { Difficulty, SpeedSetting } from './GameStateStore';

export interface SettingsState {
  // Game settings
  difficulty: Difficulty;
  speed: SpeedSetting;
  noiseLevel: number;
  
  // Accessibility settings
  reducedMotion: boolean;
  muted: boolean;
  screenReaderEnabled: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  audioDescriptions: boolean;
  
  // UI settings
  language: Language;
  selectedTopicId: string | null;
  showOnboarding: boolean;
  
  // Actions
  setDifficulty: (value: Difficulty) => void;
  setSpeed: (value: SpeedSetting) => void;
  setNoiseLevel: (value: number) => void;
  setReducedMotion: (value: boolean) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  setScreenReaderEnabled: (value: boolean) => void;
  setKeyboardNavigation: (value: boolean) => void;
  setHighContrast: (value: boolean) => void;
  setAudioDescriptions: (value: boolean) => void;
  setLanguage: (language: Language) => void;
  setSelectedTopic: (topicId: string | null) => void;
  dismissOnboarding: () => void;
  requestOnboarding: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial settings
      difficulty: 'Standard',
      speed: 'Normal',
      noiseLevel: 0.15,
      reducedMotion: false,
      muted: true,
      screenReaderEnabled: true,
      keyboardNavigation: true,
      highContrast: false,
      audioDescriptions: true,
      language: 'en',
      selectedTopicId: null,
      showOnboarding: false,

      // Actions
      setDifficulty: (value) => set({ difficulty: value }),
      
      setSpeed: (value) => set({ speed: value }),
      
      setNoiseLevel: (value) => set({ noiseLevel: value }),
      
      setReducedMotion: (value) => set({ reducedMotion: value }),
      
      toggleMute: () =>
        set((state) => {
          const next = !state.muted;
          audioBus.setMuted(next);
          return { muted: next };
        }),
      
      setMuted: (muted) => {
        audioBus.setMuted(muted);
        set({ muted });
      },
      
      setScreenReaderEnabled: (value) => set({ screenReaderEnabled: value }),
      
      setKeyboardNavigation: (value) => set({ keyboardNavigation: value }),
      
      setHighContrast: (value) => set({ highContrast: value }),
      
      setAudioDescriptions: (value) => set({ audioDescriptions: value }),
      
      setLanguage: (language) => set({ language }),
      
      setSelectedTopic: (topicId) => set({ selectedTopicId: topicId }),
      
      dismissOnboarding: () => set({ showOnboarding: false }),
      
      requestOnboarding: () => set({ showOnboarding: true }),
    }),
    {
      name: 'letterfall-settings-store',
      // Persist all settings
      partialize: (state) => ({
        difficulty: state.difficulty,
        speed: state.speed,
        noiseLevel: state.noiseLevel,
        reducedMotion: state.reducedMotion,
        muted: state.muted,
        screenReaderEnabled: state.screenReaderEnabled,
        keyboardNavigation: state.keyboardNavigation,
        highContrast: state.highContrast,
        audioDescriptions: state.audioDescriptions,
        language: state.language,
        selectedTopicId: state.selectedTopicId,
        showOnboarding: state.showOnboarding,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useDifficulty = () => useSettingsStore((state) => state.difficulty);
export const useSpeed = () => useSettingsStore((state) => state.speed);
export const useNoiseLevel = () => useSettingsStore((state) => state.noiseLevel);
export const useReducedMotion = () => useSettingsStore((state) => state.reducedMotion);
export const useMuted = () => useSettingsStore((state) => state.muted);
export const useScreenReaderEnabled = () => useSettingsStore((state) => state.screenReaderEnabled);
export const useKeyboardNavigation = () => useSettingsStore((state) => state.keyboardNavigation);
export const useHighContrast = () => useSettingsStore((state) => state.highContrast);
export const useAudioDescriptions = () => useSettingsStore((state) => state.audioDescriptions);
export const useLanguage = () => useSettingsStore((state) => state.language);
export const useSelectedTopicId = () => useSettingsStore((state) => state.selectedTopicId);
export const useShowOnboarding = () => useSettingsStore((state) => state.showOnboarding);