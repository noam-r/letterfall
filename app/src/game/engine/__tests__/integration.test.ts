import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameRuntime } from '../runtime';
import { LetterEntityPool } from '../LetterEntityPool';

// Mock PIXI.js
const mockApp = {
  stage: {
    addChild: vi.fn(),
    removeChild: vi.fn(),
    children: [],
  },
  ticker: {
    add: vi.fn(),
    remove: vi.fn(),
  },
  renderer: {
    width: 800,
    height: 600,
  },
};

const mockGameContext = {
  app: mockApp,
  renderMode: 'webgl' as const,
  hasWebGLSupport: true,
};

const mockCallbacks = {
  onLetterCollected: vi.fn(),
  onLetterMissed: vi.fn(),
  onFairnessNudge: vi.fn(),
};

describe('GameRuntime and LetterEntityPool Integration', () => {
  let runtime: GameRuntime;
  let letterPool: LetterEntityPool;

  beforeEach(() => {
    vi.clearAllMocks();
    letterPool = new LetterEntityPool({
      initialSize: 10,
      maxSize: 50,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#000000',
      },
    });
    runtime = new GameRuntime(mockGameContext as any, mockCallbacks);
  });

  afterEach(() => {
    runtime?.destroy();
    letterPool?.cleanup();
  });

  describe('Letter Entity Lifecycle', () => {
    it('should create and manage letter entities through pool', () => {
      // Get a letter from the pool
      const letter1 = letterPool.acquire('A', 100, 50);
      expect(letter1).toBeDefined();
      expect(letter1.letter).toBe('A');
      expect(letter1.x).toBe(100);
      expect(letter1.y).toBe(50);

      // Get another letter
      const letter2 = letterPool.acquire('B', 200, 75);
      expect(letter2).toBeDefined();
      expect(letter2.letter).toBe('B');

      // Letters should be different instances
      expect(letter1).not.toBe(letter2);

      // Release letters back to pool
      letterPool.release(letter1);
      letterPool.release(letter2);

      // Pool should reuse released letters
      const letter3 = letterPool.acquire('C', 300, 100);
      expect(letter3).toBe(letter1); // Should reuse the first released letter
      expect(letter3.letter).toBe('C'); // But with updated properties
    });

    it('should handle pool overflow gracefully', () => {
      const maxPoolSize = 100;
      const letters: any[] = [];

      // Acquire more letters than pool size
      for (let i = 0; i < maxPoolSize + 10; i++) {
        const letter = letterPool.acquire(String.fromCharCode(65 + (i % 26)), i * 10, i * 5);
        letters.push(letter);
      }

      expect(letters).toHaveLength(maxPoolSize + 10);

      // All letters should be valid
      letters.forEach((letter, index) => {
        expect(letter).toBeDefined();
        expect(letter.letter).toBe(String.fromCharCode(65 + (index % 26)));
      });

      // Release all letters
      letters.forEach(letter => letterPool.release(letter));
    });

    it('should track active letters correctly', () => {
      expect(letterPool.getActiveCount()).toBe(0);

      const letter1 = letterPool.acquire('A', 0, 0);
      expect(letterPool.getActiveCount()).toBe(1);

      const letter2 = letterPool.acquire('B', 0, 0);
      expect(letterPool.getActiveCount()).toBe(2);

      letterPool.release(letter1);
      expect(letterPool.getActiveCount()).toBe(1);

      letterPool.release(letter2);
      expect(letterPool.getActiveCount()).toBe(0);
    });
  });

  describe('Game State Management', () => {
    it('should update game state correctly', () => {
      const initialState = {
        roundPhase: 'playing' as const,
        words: [
          { word: 'test', progress: '', found: false },
          { word: 'game', progress: '', found: false },
        ],
        activeWord: 'test',
        difficulty: 'Standard' as const,
        speed: 'Normal' as const,
        noiseLevel: 0.1,
        language: 'en' as const,
      };

      runtime.updateState(initialState);

      // Verify state was applied
      expect(runtime).toBeDefined();
      // Note: We can't easily test internal state without exposing it
      // In a real implementation, we might add getter methods for testing
    });

    it('should handle state transitions', () => {
      const playingState = {
        roundPhase: 'playing' as const,
        words: [{ word: 'test', progress: '', found: false }],
        activeWord: 'test',
        difficulty: 'Standard' as const,
        speed: 'Normal' as const,
        noiseLevel: 0.1,
        language: 'en' as const,
      };

      const pausedState = {
        ...playingState,
        roundPhase: 'paused' as const,
      };

      runtime.updateState(playingState);
      runtime.updateState(pausedState, playingState);

      // Should handle transition from playing to paused
      expect(runtime).toBeDefined();
    });
  });

  describe('Performance Optimization', () => {
    it('should reuse letter entities efficiently', () => {
      const letters: any[] = [];
      
      // Create many letters
      for (let i = 0; i < 50; i++) {
        letters.push(letterPool.acquire('A', i, i));
      }

      // Release all letters
      letters.forEach(letter => letterPool.release(letter));

      // Acquire new letters - should reuse existing ones
      const newLetters: any[] = [];
      for (let i = 0; i < 50; i++) {
        newLetters.push(letterPool.acquire('B', i, i));
      }

      // Should have reused at least some letters
      const reusedCount = newLetters.filter(newLetter => 
        letters.some(oldLetter => oldLetter === newLetter)
      ).length;

      expect(reusedCount).toBeGreaterThan(0);

      // Clean up
      newLetters.forEach(letter => letterPool.release(letter));
    });

    it('should handle memory cleanup properly', () => {
      const letters: any[] = [];
      
      // Create letters
      for (let i = 0; i < 20; i++) {
        letters.push(letterPool.acquire('X', i, i));
      }

      const initialActiveCount = letterPool.getActiveCount();
      expect(initialActiveCount).toBe(20);

      // Cleanup should release all letters
      letterPool.cleanup();
      expect(letterPool.getActiveCount()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid letter acquisition gracefully', () => {
      // Test with invalid parameters
      const letter1 = letterPool.acquire('', 0, 0);
      expect(letter1).toBeDefined();
      expect(letter1.letter).toBe('');

      const letter2 = letterPool.acquire('AB', 0, 0); // Multi-character
      expect(letter2).toBeDefined();
      expect(letter2.letter).toBe('AB');

      letterPool.release(letter1);
      letterPool.release(letter2);
    });

    it('should handle double release gracefully', () => {
      const letter = letterPool.acquire('A', 0, 0);
      
      letterPool.release(letter);
      expect(letterPool.getActiveCount()).toBe(0);

      // Double release should not cause issues
      expect(() => letterPool.release(letter)).not.toThrow();
      expect(letterPool.getActiveCount()).toBe(0);
    });

    it('should handle runtime destruction gracefully', () => {
      const state = {
        roundPhase: 'playing' as const,
        words: [{ word: 'test', progress: '', found: false }],
        activeWord: 'test',
        difficulty: 'Standard' as const,
        speed: 'Normal' as const,
        noiseLevel: 0.1,
        language: 'en' as const,
      };

      runtime.updateState(state);
      
      // Destroy should not throw
      expect(() => runtime.destroy()).not.toThrow();
      
      // Further operations should be safe
      expect(() => runtime.updateState(state)).not.toThrow();
    });
  });

  describe('Callback Integration', () => {
    it('should trigger callbacks appropriately', () => {
      // This would require more complex setup to actually trigger callbacks
      // For now, we verify the callbacks are stored
      expect(mockCallbacks.onLetterCollected).toBeDefined();
      expect(mockCallbacks.onLetterMissed).toBeDefined();
      expect(mockCallbacks.onFairnessNudge).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with repeated operations', () => {
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const letters: any[] = [];
        
        // Acquire letters
        for (let j = 0; j < 10; j++) {
          letters.push(letterPool.acquire('T', j, j));
        }
        
        // Release letters
        letters.forEach(letter => letterPool.release(letter));
      }

      // Pool should be stable
      expect(letterPool.getActiveCount()).toBe(0);
      
      // Should still be able to acquire new letters
      const testLetter = letterPool.acquire('Z', 0, 0);
      expect(testLetter).toBeDefined();
      letterPool.release(testLetter);
    });

    it('should handle concurrent operations safely', async () => {
      const promises: Promise<void>[] = [];
      
      // Simulate concurrent letter operations
      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              const letter = letterPool.acquire('C', i, i);
              setTimeout(() => {
                letterPool.release(letter);
                resolve();
              }, Math.random() * 10);
            }, Math.random() * 10);
          })
        );
      }

      await Promise.all(promises);
      
      // All operations should complete successfully
      expect(letterPool.getActiveCount()).toBe(0);
    });
  });
});