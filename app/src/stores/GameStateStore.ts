import { create } from 'zustand';
import { audioBus } from '@shared/audio';
import { getTopicById } from '@data/topics';
import type { Language } from '@shared/i18n';
import { APP_VIEW, type AppView } from '@app/routes';
import { useStatisticsStore } from './StatisticsStore';

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

export type CollectResult = {
  matched: boolean;
  completedWord: boolean;
  roundWon: boolean;
};

export interface GameState {
  // Current game state
  view: AppView;
  roundPhase: RoundPhase;
  credits: number;
  
  // Current round data
  topicId: string | null;
  topicName: string | null;
  wordPool: string[];
  words: WordProgress[];
  activeWord: string | null;
  construction: string;
  
  // Game feedback
  fairnessPulse: number | null;
  feedbackFlash: { type: 'hit' | 'miss' | 'fairness'; timestamp: number } | null;
  
  // Note: Statistics are now managed by StatisticsStore
  
  // Actions
  setView: (view: AppView) => void;
  startRound: (topic: RoundTopicInput) => void;
  restartRound: () => void;
  selectWord: (word: string) => void;
  collectLetter: (letter: string) => CollectResult;
  missLetter: () => void;
  resetRoundState: () => void;
  setFairnessPulse: (timestamp: number | null) => void;
  pauseRound: () => void;
  resumeRound: () => void;
  setFeedbackFlash: (flash: { type: 'hit' | 'miss' | 'fairness'; timestamp: number } | null) => void;
  updateLanguage: (language: Language) => void;
}

// Game constants
const INITIAL_CREDITS = 100;
const WORDS_PER_ROUND = 5;
// MAX_SESSION_HISTORY is now managed by StatisticsStore
export const LOW_CREDIT_THRESHOLD = 20;

// Utility functions
function buildSnapshot(state: GameState, words: WordProgress[], credits: number, result: 'won' | 'lost'): SessionSnapshot {
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

export const useGameStateStore = create<GameState>((set) => ({
  // Initial state
  view: APP_VIEW.Start,
  roundPhase: 'idle',
  credits: INITIAL_CREDITS,
  topicId: null,
  topicName: null,
  wordPool: [],
  words: [],
  activeWord: null,
  construction: '',
  fairnessPulse: null,
  feedbackFlash: null,

  // Actions
  setView: (view) => set({ view }),

  startRound: (topic) => {
    const statisticsStore = useStatisticsStore.getState();
    const recent = collectRecentWords(statisticsStore.lastSessions, topic.id);
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
  },

  restartRound: () =>
    set((state) => {
      if (!state.topicId || state.wordPool.length === 0) {
        return state;
      }
      const statisticsStore = useStatisticsStore.getState();
      const extra = state.words.map((entry) => entry.word);
      const recent = collectRecentWords(statisticsStore.lastSessions, state.topicId, extra);
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

      // Update statistics if round won
      if (roundWon) {
        const statisticsStore = useStatisticsStore.getState();
        statisticsStore.incrementRoundsPlayed();
        statisticsStore.incrementWins();
        statisticsStore.incrementWinStreak();
        statisticsStore.updateBestCredits(state.credits);
        statisticsStore.addSession(buildSnapshot(state, updatedWords, state.credits, 'won'));
      }

      return {
        words: updatedWords,
        activeWord: nextActive,
        construction: wordCompleted ? '' : newProgress,
        roundPhase: roundWon ? 'won' : state.roundPhase,
        fairnessPulse: null,
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
      
      // Update statistics if round lost
      if (lost) {
        const statisticsStore = useStatisticsStore.getState();
        statisticsStore.incrementRoundsPlayed();
        statisticsStore.resetWinStreak();
        statisticsStore.addSession(buildSnapshot(state, state.words, credits, 'lost'));
      }
      
      return {
        credits,
        roundPhase: lost ? 'lost' : state.roundPhase,
        fairnessPulse: lost ? null : state.fairnessPulse,
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

  setFairnessPulse: (timestamp) => set({ fairnessPulse: timestamp }),

  setFeedbackFlash: (flash) => set({ feedbackFlash: flash }),

  pauseRound: () => set((state) => (state.roundPhase === 'playing' ? { roundPhase: 'paused' } : state)),

  resumeRound: () => set((state) => (state.roundPhase === 'paused' ? { roundPhase: 'playing' } : state)),

  updateLanguage: (language) =>
    set((state) => {
      if (state.topicId) {
        const topic = getTopicById(state.topicId, language);
        if (topic) {
          return {
            topicName: topic.name,
            wordPool: [...topic.words],
            words: [],
            activeWord: null,
            construction: '',
            roundPhase: 'idle',
            credits: INITIAL_CREDITS,
            fairnessPulse: null,
            feedbackFlash: null,
          };
        }
      }
      return state;
    }),
}));