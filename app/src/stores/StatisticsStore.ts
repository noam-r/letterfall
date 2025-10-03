import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionSnapshot } from './GameStateStore';

export interface StatisticsState {
  // Game statistics
  roundsPlayed: number;
  wins: number;
  winStreak: number;
  bestCredits: number;
  lastSessions: SessionSnapshot[];
  
  // Actions
  incrementRoundsPlayed: () => void;
  incrementWins: () => void;
  incrementWinStreak: () => void;
  resetWinStreak: () => void;
  updateBestCredits: (credits: number) => void;
  addSession: (session: SessionSnapshot) => void;
  clearStatistics: () => void;
}

const MAX_SESSION_HISTORY = 5;

export const useStatisticsStore = create<StatisticsState>()(
  persist(
    (set) => ({
      // Initial statistics
      roundsPlayed: 0,
      wins: 0,
      winStreak: 0,
      bestCredits: 0,
      lastSessions: [],

      // Actions
      incrementRoundsPlayed: () =>
        set((state) => ({ roundsPlayed: state.roundsPlayed + 1 })),

      incrementWins: () =>
        set((state) => ({ wins: state.wins + 1 })),

      incrementWinStreak: () =>
        set((state) => ({ winStreak: state.winStreak + 1 })),

      resetWinStreak: () => set({ winStreak: 0 }),

      updateBestCredits: (credits) =>
        set((state) => ({ bestCredits: Math.max(state.bestCredits, credits) })),

      addSession: (session) =>
        set((state) => ({
          lastSessions: [session, ...state.lastSessions].slice(0, MAX_SESSION_HISTORY),
        })),

      clearStatistics: () =>
        set({
          roundsPlayed: 0,
          wins: 0,
          winStreak: 0,
          bestCredits: 0,
          lastSessions: [],
        }),
    }),
    {
      name: 'letterfall-statistics-store',
      // Persist all statistics
      partialize: (state) => ({
        roundsPlayed: state.roundsPlayed,
        wins: state.wins,
        winStreak: state.winStreak,
        bestCredits: state.bestCredits,
        lastSessions: state.lastSessions,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useRoundsPlayed = () => useStatisticsStore((state) => state.roundsPlayed);
export const useWins = () => useStatisticsStore((state) => state.wins);
export const useWinStreak = () => useStatisticsStore((state) => state.winStreak);
export const useBestCredits = () => useStatisticsStore((state) => state.bestCredits);
export const useLastSessions = () => useStatisticsStore((state) => state.lastSessions);
export const useWinRate = () => {
  const roundsPlayed = useStatisticsStore((state) => state.roundsPlayed);
  const wins = useStatisticsStore((state) => state.wins);
  return roundsPlayed > 0 ? (wins / roundsPlayed) * 100 : 0;
};