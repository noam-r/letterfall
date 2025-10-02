import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { APP_VIEW, type AppView } from './routes';
import { audioBus } from '@shared/audio';
import { getTopicById } from '@data/topics';
import type { Language } from '@shared/i18n';

audioBus.setMuted(true);

export type Difficulty = 'Easy' | 'Standard' | 'Hard';
export type SpeedSetting = 'Slow' | 'Normal' | 'Fast';

export type WordProgress = {
  word: string;
  found: boolean;
  progress: string;
};

export type SessionSnapshot = {
  id: string;
  topicId: string | null;
  topicName: string | null;
  words: WordProgress[];
  creditsRemaining: number;
  result: 'won' | 'lost';
  completedAt: number;
};

export type RoundPhase = 'idle' | 'playing' | 'paused' | 'won' | 'lost';

type RoundTopicInput = {
  id: string;
  name: string;
  words: string[];
};

type CollectResult = {
  matched: boolean;
  completedWord: boolean;
  roundWon: boolean;
};

type AppState = {
  view: AppView;
  roundPhase: RoundPhase;
  credits: number;
  topicId: string | null;
  topicName: string | null;
  wordPool: string[];
  words: WordProgress[];
  activeWord: string | null;
  construction: string;
  difficulty: Difficulty;
  speed: SpeedSetting;
  noiseLevel: number;
  reducedMotion: boolean;
  muted: boolean;
  selectedTopicId: string | null;
  language: Language;
  fairnessPulse: number | null;
  showOnboarding: boolean;
  feedbackFlash: { type: 'hit' | 'miss' | 'fairness'; timestamp: number } | null;
  roundsPlayed: number;
  wins: number;
  winStreak: number;
  bestCredits: number;
  lastSessions: SessionSnapshot[];
  setView: (view: AppView) => void;
  toggleMute: () => void;
  setReducedMotion: (value: boolean) => void;
  setDifficulty: (value: Difficulty) => void;
  setSpeed: (value: SpeedSetting) => void;
  setNoiseLevel: (value: number) => void;
  setSelectedTopic: (topicId: string | null) => void;
  setLanguage: (language: Language) => void;
  startRound: (topic: RoundTopicInput) => void;
  restartRound: () => void;
  selectWord: (word: string) => void;
  collectLetter: (letter: string) => CollectResult;
  missLetter: () => void;
  resetRoundState: () => void;
  setFairnessPulse: (timestamp: number | null) => void;
  pauseRound: () => void;
  resumeRound: () => void;
  dismissOnboarding: () => void;
  requestOnboarding: () => void;
  setFeedbackFlash: (flash: { type: 'hit' | 'miss' | 'fairness'; timestamp: number } | null) => void;
};


function buildSnapshot(state: AppState, words: WordProgress[], credits: number, result: 'won' | 'lost'): SessionSnapshot {
  return {
    id: crypto.randomUUID(),
    topicId: state.topicId,
    topicName: state.topicName,
    words: words.map((entry) => ({ ...entry })),
    creditsRemaining: credits,
    result,
    completedAt: Date.now(),
  };
}

const INITIAL_CREDITS = 100;
const WORDS_PER_ROUND = 5;
const MAX_SESSION_HISTORY = 5;
export const LOW_CREDIT_THRESHOLD = 20;

function popRandom(list: string[]): string | undefined {
  if (list.length === 0) {
    return undefined;
  }
  const index = Math.floor(Math.random() * list.length);
  const [picked] = list.splice(index, 1);
  return picked;
}

function normalizeWord(word: string) {
  return word.trim().toLowerCase();
}

function sampleWords(pool: string[], count: number, recentWords?: Set<string>) {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const raw of pool) {
    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }
    const key = normalizeWord(trimmed);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(trimmed);
  }

  const normalizedRecent = new Set<string>();
  if (recentWords) {
    for (const word of recentWords) {
      normalizedRecent.add(normalizeWord(word));
    }
  }

  const preferred = unique.filter((word) => !normalizedRecent.has(normalizeWord(word)));
  const fallback = unique.filter((word) => normalizedRecent.has(normalizeWord(word)));

  const candidates = preferred.length >= count ? preferred : [...preferred, ...fallback];
  const poolCopy = [...candidates];
  const chosen: string[] = [];
  while (poolCopy.length > 0 && chosen.length < Math.min(count, unique.length)) {
    const picked = popRandom(poolCopy);
    if (picked) {
      chosen.push(picked);
    }
  }

  return chosen;
}

function collectRecentWords(
  sessions: SessionSnapshot[],
  topicId: string | null,
  extraWords: string[] = [],
  maxSessions = 3,
  maxWords = 30
) {
  const recent = new Set<string>();

  const pushWord = (word: string) => {
    if (recent.size >= maxWords) {
      return;
    }
    recent.add(normalizeWord(word));
  };

  for (const word of extraWords) {
    pushWord(word);
  }

  let counted = 0;
  for (const session of sessions) {
    if (!topicId || session.topicId !== topicId) {
      continue;
    }
    for (const entry of session.words) {
      pushWord(entry.word);
      if (recent.size >= maxWords) {
        break;
      }
    }
    counted += 1;
    if (counted >= maxSessions || recent.size >= maxWords) {
      break;
    }
  }

  return recent;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: APP_VIEW.Start,
      roundPhase: 'idle',
      credits: INITIAL_CREDITS,
      topicId: null,
      topicName: null,
      wordPool: [],
      words: [],
      activeWord: null,
      construction: '',
      difficulty: 'Standard',
      speed: 'Normal',
      noiseLevel: 0.15,
      reducedMotion: false,
      muted: true,
      selectedTopicId: null,
      language: 'en',
      fairnessPulse: null,
      showOnboarding: false,
      feedbackFlash: null,
      roundsPlayed: 0,
      wins: 0,
      winStreak: 0,
      bestCredits: 0,
      lastSessions: [],
      setView: (view) => set({ view }),
      toggleMute: () =>
        set((state) => {
          const next = !state.muted;
          audioBus.setMuted(next);
          return { muted: next };
        }),
      setReducedMotion: (value) => set({ reducedMotion: value }),
      setDifficulty: (value) => set({ difficulty: value }),
      setSpeed: (value) => set({ speed: value }),
      setNoiseLevel: (value) => set({ noiseLevel: value }),
      setSelectedTopic: (topicId) => set({ selectedTopicId: topicId }),
      setLanguage: (language) =>
        set((state) => {
          const updates: Partial<AppState> = { language };
          if (state.topicId) {
            const topic = getTopicById(state.topicId, language);
            if (topic) {
              updates.topicName = topic.name;
              updates.wordPool = [...topic.words];
              updates.words = [];
              updates.activeWord = null;
              updates.construction = '';
              updates.roundPhase = 'idle';
              updates.credits = INITIAL_CREDITS;
              updates.fairnessPulse = null;
              updates.feedbackFlash = null;
            }
          }
          return updates;
        }),
      setFairnessPulse: (timestamp) => set({ fairnessPulse: timestamp }),
      setFeedbackFlash: (flash) => set({ feedbackFlash: flash }),
      pauseRound: () => set((state) => (state.roundPhase === 'playing' ? { roundPhase: 'paused' } : state)),
      resumeRound: () => set((state) => (state.roundPhase === 'paused' ? { roundPhase: 'playing' } : state)),
      dismissOnboarding: () =>
        set((state) => ({
          showOnboarding: false,
          roundPhase: state.roundPhase === 'paused' ? 'playing' : state.roundPhase,
        })),
      requestOnboarding: () =>
        set((state) => ({
          showOnboarding: true,
          roundPhase: state.roundPhase === 'playing' ? 'paused' : state.roundPhase,
        })),
      startRound: (topic) => {
        const recent = collectRecentWords(get().lastSessions, topic.id);
        let words = sampleWords(topic.words, WORDS_PER_ROUND, recent);
        if (words.length < Math.min(WORDS_PER_ROUND, topic.words.length)) {
          words = sampleWords(topic.words, WORDS_PER_ROUND);
        }
        const uniquePool = sampleWords(topic.words, topic.words.length);
        set(() => ({
          view: APP_VIEW.Playing,
          roundPhase: 'playing',
          credits: INITIAL_CREDITS,
          topicId: topic.id,
          topicName: topic.name,
          wordPool: uniquePool.length ? uniquePool : topic.words,
          words: words.map((word) => ({ word, found: false, progress: '' })),
          activeWord: words[0] ?? null,
          construction: '',
          fairnessPulse: null,
          feedbackFlash: null,
        }));
        if (get().showOnboarding) {
          set((state) => (state.roundPhase === 'playing' ? { roundPhase: 'paused' } : state));
        }
      },
      restartRound: () =>
        set((state) => {
          if (!state.topicId || state.wordPool.length === 0) {
            return state;
          }
          const extra = state.words.map((entry) => entry.word);
          const recent = collectRecentWords(state.lastSessions, state.topicId, extra);
          let words = sampleWords(state.wordPool, WORDS_PER_ROUND, recent);
          if (words.length < Math.min(WORDS_PER_ROUND, state.wordPool.length)) {
            words = sampleWords(state.wordPool, WORDS_PER_ROUND);
          }
          return {
            roundPhase: 'playing',
            credits: INITIAL_CREDITS,
            words: words.map((word) => ({ word, found: false, progress: '' })),
            activeWord: words[0] ?? null,
            construction: '',
            fairnessPulse: null,
            feedbackFlash: null,
          };
        }),
      selectWord: (word) =>
        set((state) => {
          const match = state.words.find((entry) => entry.word === word);
          if (!match) {
            return state;
          }
          return {
            activeWord: word,
            construction: match.progress,
          };
        }),
      collectLetter: (letter) => {
        let result: CollectResult = { matched: false, completedWord: false, roundWon: false };
        set((state) => {
          if (state.roundPhase !== 'playing' || !state.activeWord) {
            return state;
          }
          const index = state.words.findIndex((entry) => entry.word === state.activeWord);
          if (index === -1) {
            return state;
          }
          const currentEntry = state.words[index];
          const nextExpected = currentEntry.word[currentEntry.progress.length];
          if (!nextExpected || nextExpected.toLowerCase() !== letter.toLowerCase()) {
            audioBus.playMiss();
            return state;
          }

          const newProgress = currentEntry.progress + currentEntry.word[currentEntry.progress.length];
          const wordCompleted = newProgress.length === currentEntry.word.length;

          const updatedWords = state.words.map((entry, idx) =>
            idx === index ? { ...entry, progress: newProgress, found: wordCompleted } : entry
          );

          const nextActive = wordCompleted
            ? updatedWords.find((entry) => !entry.found)?.word ?? null
            : currentEntry.word;

          const roundWon = wordCompleted && updatedWords.every((entry) => entry.found);

          result = { matched: true, completedWord: wordCompleted, roundWon };

          audioBus.playCollect();

          return {
            words: updatedWords,
            activeWord: nextActive,
            construction: wordCompleted ? '' : newProgress,
            roundPhase: roundWon ? 'won' : state.roundPhase,
            fairnessPulse: null,
            roundsPlayed: roundWon ? state.roundsPlayed + 1 : state.roundsPlayed,
            wins: roundWon ? state.wins + 1 : state.wins,
            winStreak: roundWon ? state.winStreak + 1 : state.winStreak,
            bestCredits: roundWon ? Math.max(state.bestCredits, state.credits) : state.bestCredits,
            lastSessions: roundWon
              ? [
                  buildSnapshot(state, updatedWords, state.credits, 'won'),
                  ...state.lastSessions,
                ].slice(0, MAX_SESSION_HISTORY)
              : state.lastSessions,
          };
        });
        if (result.matched) {
          set({ feedbackFlash: { type: 'hit', timestamp: Date.now() } });
        }
        return result;
      },
      missLetter: () => {
        let triggered = false;
        set((state) => {
          if (state.roundPhase !== 'playing') {
            return state;
          }
          triggered = true;
          audioBus.playMiss();
          const credits = Math.max(0, state.credits - 1);
          const lost = credits === 0;
          return {
            credits,
            roundPhase: lost ? 'lost' : state.roundPhase,
            fairnessPulse: lost ? null : state.fairnessPulse,
            roundsPlayed: lost ? state.roundsPlayed + 1 : state.roundsPlayed,
            wins: state.wins,
            winStreak: lost ? 0 : state.winStreak,
            bestCredits: state.bestCredits,
            lastSessions: lost
              ? [
                  buildSnapshot(state, state.words, credits, 'lost'),
                  ...state.lastSessions,
                ].slice(0, MAX_SESSION_HISTORY)
              : state.lastSessions,
          };
        });
        if (triggered) {
          set({ feedbackFlash: { type: 'miss', timestamp: Date.now() } });
        }
      },
      resetRoundState: () =>
        set({
          roundPhase: 'idle',
          credits: INITIAL_CREDITS,
          words: [],
          activeWord: null,
          construction: '',
          topicId: null,
          topicName: null,
          wordPool: [],
          fairnessPulse: null,
          feedbackFlash: null,
        }),
    }),
    {
      name: 'letterfall-app-store',
      partialize: (state) => ({
        difficulty: state.difficulty,
        speed: state.speed,
        noiseLevel: state.noiseLevel,
        reducedMotion: state.reducedMotion,
        muted: state.muted,
        selectedTopicId: state.selectedTopicId,
        language: state.language,
        showOnboarding: state.showOnboarding,
        roundsPlayed: state.roundsPlayed,
        wins: state.wins,
        winStreak: state.winStreak,
        bestCredits: state.bestCredits,
        lastSessions: state.lastSessions,
      }),
    }
  )
);
