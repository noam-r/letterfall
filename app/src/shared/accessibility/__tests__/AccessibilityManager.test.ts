import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AccessibilityManager } from '../AccessibilityManager';
import type { AccessibilitySettings, GameState } from '../AccessibilityManager';

// Mock audio bus
vi.mock('@shared/audio', () => ({
  audioBus: {
    playCollect: vi.fn(),
    playMiss: vi.fn(),
    playSummary: vi.fn(),
  },
}));

describe('AccessibilityManager', () => {
  let manager: AccessibilityManager;
  let mockSettings: AccessibilitySettings;

  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
    
    mockSettings = {
      screenReaderEnabled: true,
      keyboardNavigation: true,
      reducedMotion: false,
      highContrast: false,
      audioDescriptions: true,
    };

    manager = new AccessibilityManager(mockSettings);
  });

  afterEach(() => {
    manager.cleanup();
    document.body.innerHTML = '';
  });

  describe('initialization', () => {
    it('should create announcement region', () => {
      const announceRegion = document.getElementById('accessibility-announcements');
      expect(announceRegion).toBeTruthy();
      expect(announceRegion?.getAttribute('aria-live')).toBe('polite');
      expect(announceRegion?.getAttribute('aria-atomic')).toBe('true');
    });

    it('should detect system preferences', () => {
      // Mock matchMedia for reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const newManager = new AccessibilityManager(mockSettings);
      expect(newManager.settings.reducedMotion).toBe(true);
      newManager.cleanup();
    });
  });

  describe('game state announcements', () => {
    it('should announce playing state', () => {
      const gameState: GameState = {
        roundPhase: 'playing',
        activeWord: 'test',
        credits: 10,
        wordsCompleted: 2,
        totalWords: 5,
      };

      manager.announceGameState(gameState);

      const announceRegion = document.getElementById('accessibility-announcements');
      setTimeout(() => {
        expect(announceRegion?.textContent).toContain('Now building word: test');
        expect(announceRegion?.textContent).toContain('10 credits remaining');
      }, 150);
    });

    it('should announce paused state', () => {
      const gameState: GameState = {
        roundPhase: 'paused',
        activeWord: null,
        credits: 5,
        wordsCompleted: 1,
        totalWords: 3,
      };

      manager.announceGameState(gameState);

      const announceRegion = document.getElementById('accessibility-announcements');
      setTimeout(() => {
        expect(announceRegion?.textContent).toContain('Game paused');
        expect(announceRegion?.textContent).toContain('Press space to resume');
      }, 150);
    });

    it('should announce won state', () => {
      const gameState: GameState = {
        roundPhase: 'won',
        activeWord: null,
        credits: 8,
        wordsCompleted: 5,
        totalWords: 5,
      };

      manager.announceGameState(gameState);

      const announceRegion = document.getElementById('accessibility-announcements');
      setTimeout(() => {
        expect(announceRegion?.textContent).toContain('Congratulations');
        expect(announceRegion?.textContent).toContain('completed all 5 words');
        expect(announceRegion?.textContent).toContain('8 credits remaining');
      }, 150);
    });

    it('should not announce when screen reader is disabled', () => {
      manager.updateSettings({ screenReaderEnabled: false });
      
      const gameState: GameState = {
        roundPhase: 'playing',
        activeWord: 'test',
        credits: 10,
        wordsCompleted: 0,
        totalWords: 3,
      };

      manager.announceGameState(gameState);

      const announceRegion = document.getElementById('accessibility-announcements');
      setTimeout(() => {
        expect(announceRegion?.textContent).toBe('');
      }, 150);
    });
  });

  describe('audio cues', () => {
    it('should provide audio cues for letter collection', async () => {
      const { audioBus } = await import('@shared/audio');
      
      manager.provideAudioCues({
        type: 'letter_collected',
        data: { letter: 'A' }
      });

      expect(audioBus.playCollect).toHaveBeenCalled();
    });

    it('should provide audio cues for letter missed', async () => {
      const { audioBus } = await import('@shared/audio');
      
      manager.provideAudioCues({
        type: 'letter_missed'
      });

      expect(audioBus.playMiss).toHaveBeenCalled();
    });

    it('should not provide audio cues when disabled', async () => {
      const { audioBus } = await import('@shared/audio');
      // Clear previous calls
      vi.clearAllMocks();
      
      manager.updateSettings({ audioDescriptions: false });
      
      manager.provideAudioCues({
        type: 'letter_collected',
        data: { letter: 'A' }
      });

      expect(audioBus.playCollect).not.toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('should register keyboard handlers', () => {
      manager.setupKeyboardNavigation(); // Need to set up navigation first
      const handler = vi.fn();
      manager.registerKeyboardHandler('Space', handler);

      // Simulate keydown event
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should unregister keyboard handlers', () => {
      const handler = vi.fn();
      manager.registerKeyboardHandler('Space', handler);
      manager.unregisterKeyboardHandler('Space');

      // Simulate keydown event
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      document.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should update focusable elements', () => {
      // Add some focusable elements to DOM
      document.body.innerHTML = `
        <button>Button 1</button>
        <button>Button 2</button>
        <input type="text" />
        <button disabled>Disabled Button</button>
      `;

      manager.updateFocusableElements();

      // Should find 3 focusable elements (disabled button should be excluded)
      expect(manager.focusableElements).toHaveLength(3);
    });
  });

  describe('reduced motion', () => {
    it('should add reduced motion class to body', () => {
      manager.updateSettings({ reducedMotion: true });
      manager.adaptForReducedMotion();

      expect(document.body.classList.contains('reduced-motion')).toBe(true);
    });

    it('should remove reduced motion class when disabled', () => {
      document.body.classList.add('reduced-motion');
      
      manager.updateSettings({ reducedMotion: false });
      manager.adaptForReducedMotion();

      expect(document.body.classList.contains('reduced-motion')).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove announcement region on cleanup', () => {
      expect(document.getElementById('accessibility-announcements')).toBeTruthy();
      
      manager.cleanup();
      
      expect(document.getElementById('accessibility-announcements')).toBeFalsy();
    });

    it('should clear keyboard handlers on cleanup', () => {
      const handler = vi.fn();
      manager.registerKeyboardHandler('Space', handler);
      
      manager.cleanup();
      
      // Simulate keydown event after cleanup
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      document.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });
  });
});