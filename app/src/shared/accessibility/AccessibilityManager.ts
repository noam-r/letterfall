import { audioBus } from '@shared/audio';
import { useSettingsStore } from '@stores/SettingsStore';

export interface AccessibilitySettings {
  announceGameEvents?: boolean;
  screenReaderEnabled?: boolean;
  screenReaderSupport?: boolean;
  keyboardNavigation: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  audioDescriptions: boolean;
}

export interface GameEvent {
  type: 'letter_collected' | 'letter_missed' | 'word_completed' | 'round_started' | 'round_ended' | 'game_paused' | 'game_resumed';
  data?: any;
}

export interface GameState {
  roundPhase: 'idle' | 'playing' | 'paused' | 'won' | 'lost';
  activeWord: string | null;
  credits: number;
  wordsCompleted: number;
  totalWords: number;
}

export class AccessibilityManager {
  public settings: AccessibilitySettings;
  private announceRegion: HTMLElement | null = null;
  private keyboardHandlers: Map<string, (event: KeyboardEvent) => void> = new Map();
  public focusableElements: HTMLElement[] = [];
  private currentFocusIndex = -1;

  constructor(settings?: AccessibilitySettings) {
    this.settings = settings || {
      announceGameEvents: true,
      keyboardNavigation: true,
      screenReaderSupport: true,
      highContrast: false,
      reducedMotion: false,
      audioDescriptions: false,
    };
    this.initializeAnnounceRegion();
    this.detectSystemPreferences();
  }

  private initializeAnnounceRegion(): void {
    // Create or find the ARIA live region for announcements
    this.announceRegion = document.getElementById('accessibility-announcements');
    if (!this.announceRegion) {
      this.announceRegion = document.createElement('div');
      this.announceRegion.id = 'accessibility-announcements';
      this.announceRegion.setAttribute('aria-live', 'polite');
      this.announceRegion.setAttribute('aria-atomic', 'true');
      this.announceRegion.style.position = 'absolute';
      this.announceRegion.style.left = '-10000px';
      this.announceRegion.style.width = '1px';
      this.announceRegion.style.height = '1px';
      this.announceRegion.style.overflow = 'hidden';
      document.body.appendChild(this.announceRegion);
    }
  }

  private detectSystemPreferences(): void {
    // Detect system preferences for reduced motion
    if (window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (prefersReducedMotion.matches) {
        this.settings.reducedMotion = true;
        this.syncWithSettingsStore();
      }

      // Listen for changes
      prefersReducedMotion.addEventListener('change', (e) => {
        this.settings.reducedMotion = e.matches;
        this.syncWithSettingsStore();
        this.announceGameState({
          roundPhase: 'idle',
          activeWord: null,
          credits: 0,
          wordsCompleted: 0,
          totalWords: 0
        });
      });

      // Detect high contrast preference
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
      if (prefersHighContrast.matches) {
        this.settings.highContrast = true;
      }

      prefersHighContrast.addEventListener('change', (e) => {
        this.settings.highContrast = e.matches;
      });
    }
  }

  /**
   * Sync reduced motion setting with the settings store
   */
  private syncWithSettingsStore(): void {
    try {
      const store = useSettingsStore.getState();
      if (store.reducedMotion !== this.settings.reducedMotion) {
        store.setReducedMotion(this.settings.reducedMotion);
      }
    } catch {
      // Store not available, continue without syncing
    }
  }

  public updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  public announceGameState(state: GameState): void {
    if (!this.settings.screenReaderEnabled || !this.announceRegion) {
      return;
    }

    let announcement = '';

    switch (state.roundPhase) {
      case 'playing':
        if (state.activeWord) {
          announcement = `Now building word: ${state.activeWord}. ${state.credits} credits remaining.`;
        } else {
          announcement = `Game in progress. ${state.credits} credits remaining.`;
        }
        break;
      case 'paused':
        announcement = 'Game paused. Press space to resume.';
        break;
      case 'won':
        announcement = `Congratulations! You completed all ${state.totalWords} words with ${state.credits} credits remaining.`;
        break;
      case 'lost':
        announcement = `Game over. You completed ${state.wordsCompleted} out of ${state.totalWords} words.`;
        break;
      case 'idle':
        announcement = 'Game ready. Press space to start or navigate to settings.';
        break;
    }

    this.announce(announcement);
  }

  public provideAudioCues(event: GameEvent): void {
    if (!this.settings.audioDescriptions) {
      return;
    }

    switch (event.type) {
      case 'letter_collected':
        // Play a positive audio cue
        audioBus.playCollect();
        if (this.settings.screenReaderEnabled) {
          this.announce(`Letter ${event.data?.letter} collected`);
        }
        break;
      case 'letter_missed':
        // Play a negative audio cue
        audioBus.playMiss();
        if (this.settings.screenReaderEnabled) {
          this.announce('Letter missed');
        }
        break;
      case 'word_completed':
        // Play a success audio cue
        audioBus.playSummary();
        if (this.settings.screenReaderEnabled) {
          this.announce(`Word completed: ${event.data?.word}`);
        }
        break;
      case 'round_started':
        if (this.settings.screenReaderEnabled) {
          this.announce('Round started. Letters will begin falling.');
        }
        break;
      case 'round_ended':
        if (this.settings.screenReaderEnabled) {
          this.announce('Round ended.');
        }
        break;
      case 'game_paused':
        if (this.settings.screenReaderEnabled) {
          this.announce('Game paused.');
        }
        break;
      case 'game_resumed':
        if (this.settings.screenReaderEnabled) {
          this.announce('Game resumed.');
        }
        break;
    }
  }

  public setupKeyboardNavigation(): void {
    if (!this.settings.keyboardNavigation) {
      return;
    }

    // Clear existing handlers
    this.keyboardHandlers.clear();

    // Set up global keyboard handlers
    const handleKeyDown = (event: KeyboardEvent) => {
      const handler = this.keyboardHandlers.get(event.code);
      if (handler) {
        event.preventDefault();
        handler(event);
      } else {
        // Handle general navigation
        this.handleGeneralNavigation(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Store cleanup function
    this.keyboardHandlers.set('cleanup', () => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  }

  private handleGeneralNavigation(event: KeyboardEvent): void {
    switch (event.code) {
      case 'Tab':
        if (!event.shiftKey) {
          this.focusNext();
        } else {
          this.focusPrevious();
        }
        event.preventDefault();
        break;
      case 'Enter':
      case 'Space':
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && (activeElement.tagName === 'BUTTON' || activeElement.getAttribute('role') === 'button')) {
          activeElement.click();
          event.preventDefault();
        }
        break;
      case 'Escape':
        // Handle escape key for closing modals, pausing game, etc.
        this.handleEscape();
        event.preventDefault();
        break;
    }
  }

  private handleEscape(): void {
    // This will be implemented based on current game state
    // For now, just announce that escape was pressed
    this.announce('Escape pressed');
  }

  public registerKeyboardHandler(key: string, handler: (event: KeyboardEvent) => void): void {
    this.keyboardHandlers.set(key, handler);
  }

  public unregisterKeyboardHandler(key: string): void {
    this.keyboardHandlers.delete(key);
  }

  public updateFocusableElements(): void {
    // Find all focusable elements in the current view
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])'
    ].join(', ');

    this.focusableElements = Array.from(document.querySelectorAll(focusableSelectors)) as HTMLElement[];
    this.currentFocusIndex = -1;

    // Find currently focused element
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      this.currentFocusIndex = this.focusableElements.indexOf(activeElement);
    }
  }

  private focusNext(): void {
    if (this.focusableElements.length === 0) {
      this.updateFocusableElements();
    }

    if (this.focusableElements.length > 0) {
      this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
      this.focusableElements[this.currentFocusIndex].focus();
    }
  }

  private focusPrevious(): void {
    if (this.focusableElements.length === 0) {
      this.updateFocusableElements();
    }

    if (this.focusableElements.length > 0) {
      this.currentFocusIndex = this.currentFocusIndex <= 0 
        ? this.focusableElements.length - 1 
        : this.currentFocusIndex - 1;
      this.focusableElements[this.currentFocusIndex].focus();
    }
  }

  public adaptForReducedMotion(): void {
    if (this.settings.reducedMotion) {
      // Add CSS class to body to enable reduced motion styles
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  }

  public announce(message: string): void {
    if (!this.announceRegion || !message.trim()) {
      return;
    }

    // Clear previous announcement
    this.announceRegion.textContent = '';
    
    // Add new announcement after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      if (this.announceRegion) {
        this.announceRegion.textContent = message;
      }
    }, 100);
  }

  /**
   * Set focus to a specific element
   */
  public setFocusToElement(element: HTMLElement): void {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }

  /**
   * Get current accessibility configuration
   */
  public getConfig(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Destroy the accessibility manager
   */
  public destroy(): void {
    this.cleanup();
  }

  public cleanup(): void {
    // Clean up keyboard handlers
    const cleanupHandler = this.keyboardHandlers.get('cleanup');
    if (cleanupHandler) {
      cleanupHandler(new KeyboardEvent('keydown'));
    }

    // Remove announce region
    if (this.announceRegion && this.announceRegion.parentNode) {
      this.announceRegion.parentNode.removeChild(this.announceRegion);
    }

    // Clear arrays and maps
    this.keyboardHandlers.clear();
    this.focusableElements = [];
  }
}