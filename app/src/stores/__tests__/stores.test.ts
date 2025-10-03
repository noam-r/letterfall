import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStateStore } from '../GameStateStore';
import { useSettingsStore } from '../SettingsStore';
import { useStatisticsStore } from '../StatisticsStore';

// Mock audio bus
vi.mock('@shared/audio', () => ({
  audioBus: {
    setMuted: vi.fn(),
    playMiss: vi.fn(),
    playCollect: vi.fn(),
  },
}));

// Mock topics
vi.mock('@data/topics', () => ({
  getTopicById: vi.fn((id: string) => ({
    id,
    name: `Topic ${id}`,
    words: ['test', 'word', 'list'],
  })),
}));

// Mock app routes
vi.mock('@app/routes', () => ({
  APP_VIEW: {
    Start: 'start',
    Playing: 'playing',
  },
}));

describe('Store Integration', () => {
  beforeEach(() => {
    // Reset all stores before each test
    useGameStateStore.setState({
      view: 'start',
      roundPhase: 'idle',
      credits: 100,
      topicId: null,
      topicName: null,
      wordPool: [],
      words: [],
      activeWord: null,
      construction: '',
      fairnessPulse: null,
      feedbackFlash: null,
    });

    useSettingsStore.setState({
      difficulty: 'Standard',
      speed: 'Normal',
      noiseLevel: 0.15,
      reducedMotion: false,
      muted: true,
      language: 'en',
      selectedTopicId: null,
      showOnboarding: false,
    });

    useStatisticsStore.setState({
      roundsPlayed: 0,
      wins: 0,
      winStreak: 0,
      bestCredits: 0,
      lastSessions: [],
    });
  });

  describe('GameStateStore', () => {
    it('should start a round correctly', () => {
      const gameStore = useGameStateStore.getState();
      
      gameStore.startRound(
        { id: 'test-topic', name: 'Test Topic', words: ['hello', 'world'] }
      );

      const state = useGameStateStore.getState();
      expect(state.view).toBe('playing');
      expect(state.roundPhase).toBe('playing');
      expect(state.topicId).toBe('test-topic');
      expect(state.credits).toBe(100);
      expect(state.words).toHaveLength(2);
    });

    it('should handle letter collection correctly', () => {
      const gameStore = useGameStateStore.getState();
      
      // Start a round first
      gameStore.startRound(
        { id: 'test', name: 'Test', words: ['cat'] }
      );

      // Collect letters to spell 'cat'
      let result = gameStore.collectLetter('c');
      expect(result.matched).toBe(true);
      expect(result.completedWord).toBe(false);

      result = gameStore.collectLetter('a');
      expect(result.matched).toBe(true);
      expect(result.completedWord).toBe(false);

      result = gameStore.collectLetter('t');
      expect(result.matched).toBe(true);
      expect(result.completedWord).toBe(true);
      expect(result.roundWon).toBe(true);

      const state = useGameStateStore.getState();
      expect(state.roundPhase).toBe('won');
    });

    it('should handle missed letters correctly', () => {
      const gameStore = useGameStateStore.getState();
      
      gameStore.startRound(
        { id: 'test', name: 'Test', words: ['cat'] }
      );

      const initialCredits = useGameStateStore.getState().credits;
      
      gameStore.missLetter();
      
      const state = useGameStateStore.getState();
      expect(state.credits).toBe(initialCredits - 1);
    });
  });

  describe('SettingsStore', () => {
    it('should update difficulty setting', () => {
      const settingsStore = useSettingsStore.getState();
      
      settingsStore.setDifficulty('Hard');
      
      const state = useSettingsStore.getState();
      expect(state.difficulty).toBe('Hard');
    });

    it('should toggle mute setting', () => {
      const settingsStore = useSettingsStore.getState();
      
      expect(useSettingsStore.getState().muted).toBe(true);
      
      settingsStore.toggleMute();
      
      expect(useSettingsStore.getState().muted).toBe(false);
    });

    it('should update language setting', () => {
      const settingsStore = useSettingsStore.getState();
      
      settingsStore.setLanguage('he');
      
      const state = useSettingsStore.getState();
      expect(state.language).toBe('he');
    });
  });

  describe('StatisticsStore', () => {
    it('should track game statistics correctly', () => {
      const statsStore = useStatisticsStore.getState();
      
      statsStore.incrementRoundsPlayed();
      statsStore.incrementWins();
      statsStore.incrementWinStreak();
      statsStore.updateBestCredits(150);
      
      const state = useStatisticsStore.getState();
      expect(state.roundsPlayed).toBe(1);
      expect(state.wins).toBe(1);
      expect(state.winStreak).toBe(1);
      expect(state.bestCredits).toBe(150);
    });

    it('should reset win streak on loss', () => {
      const statsStore = useStatisticsStore.getState();
      
      statsStore.incrementWinStreak();
      statsStore.incrementWinStreak();
      expect(useStatisticsStore.getState().winStreak).toBe(2);
      
      statsStore.resetWinStreak();
      expect(useStatisticsStore.getState().winStreak).toBe(0);
    });

    it('should add sessions to history', () => {
      const statsStore = useStatisticsStore.getState();
      
      const session = {
        id: 'test-session',
        topicId: 'test-topic',
        topicName: 'Test Topic',
        words: [{ word: 'test', found: true, progress: 'test' }],
        creditsRemaining: 95,
        result: 'won' as const,
        completedAt: Date.now(),
      };
      
      statsStore.addSession(session);
      
      const state = useStatisticsStore.getState();
      expect(state.lastSessions).toHaveLength(1);
      expect(state.lastSessions[0]).toEqual(session);
    });

    it('should limit session history to maximum size', () => {
      const statsStore = useStatisticsStore.getState();
      
      // Add 6 sessions (more than the limit of 5)
      for (let i = 0; i < 6; i++) {
        statsStore.addSession({
          id: `session-${i}`,
          topicId: 'test',
          topicName: 'Test',
          words: [],
          creditsRemaining: 100,
          result: 'won',
          completedAt: Date.now() + i,
        });
      }
      
      const state = useStatisticsStore.getState();
      expect(state.lastSessions).toHaveLength(5);
      expect(state.lastSessions[0].id).toBe('session-5'); // Most recent first
    });
  });

  describe('Store Integration', () => {
    it('should update statistics when game round is won', () => {
      const gameStore = useGameStateStore.getState();
      
      // Start a round
      gameStore.startRound(
        { id: 'test', name: 'Test', words: ['hi'] }
      );

      // Complete the word
      gameStore.collectLetter('h');
      gameStore.collectLetter('i');

      // Check that statistics were updated
      const stats = useStatisticsStore.getState();
      expect(stats.roundsPlayed).toBe(1);
      expect(stats.wins).toBe(1);
      expect(stats.winStreak).toBe(1);
      expect(stats.lastSessions).toHaveLength(1);
      expect(stats.lastSessions[0].result).toBe('won');
    });

    it('should update statistics when game round is lost', () => {
      const gameStore = useGameStateStore.getState();
      
      // Start a round
      gameStore.startRound(
        { id: 'test', name: 'Test', words: ['hello'] }
      );

      // Miss letters until credits run out
      for (let i = 0; i < 100; i++) {
        gameStore.missLetter();
      }

      // Check that statistics were updated
      const stats = useStatisticsStore.getState();
      expect(stats.roundsPlayed).toBe(1);
      expect(stats.wins).toBe(0);
      expect(stats.winStreak).toBe(0);
      expect(stats.lastSessions).toHaveLength(1);
      expect(stats.lastSessions[0].result).toBe('lost');
    });
  });
});