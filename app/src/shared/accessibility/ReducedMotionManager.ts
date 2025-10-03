import React from 'react';
import { useSettingsStore } from '@stores/SettingsStore';

export interface ReducedMotionConfig {
  disableParticles: boolean;
  reduceAnimationSpeed: boolean;
  simplifyTransitions: boolean;
  disableAutoScroll: boolean;
  useStaticBackgrounds: boolean;
  reduceLetterFallSpeed: boolean;
  disableScreenShake: boolean;
  simplifyVisualEffects: boolean;
}

export class ReducedMotionManager {
  private static instance: ReducedMotionManager | null = null;
  private config: ReducedMotionConfig;
  private isEnabled = false;
  private listeners: ((enabled: boolean, config: ReducedMotionConfig) => void)[] = [];

  constructor() {
    this.config = this.getDefaultConfig();
    this.detectSystemPreference();
    this.setupStoreSync();
  }

  static getInstance(): ReducedMotionManager {
    if (!ReducedMotionManager.instance) {
      ReducedMotionManager.instance = new ReducedMotionManager();
    }
    return ReducedMotionManager.instance;
  }

  /**
   * Check if reduced motion is enabled
   */
  isReducedMotionEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Check if reduced motion is enabled (alternative method name for compatibility)
   */
  getIsEnabled(): boolean {
    return this.isReducedMotionEnabled();
  }

  /**
   * Get current reduced motion configuration
   */
  getConfig(): ReducedMotionConfig {
    return { ...this.config };
  }

  /**
   * Update reduced motion configuration
   */
  updateConfig(newConfig: Partial<ReducedMotionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.notifyListeners();
  }

  /**
   * Enable or disable reduced motion
   */
  setEnabled(enabled: boolean): void {
    if (this.isEnabled !== enabled) {
      this.isEnabled = enabled;
      this.applyReducedMotionStyles();
      this.notifyListeners();
    }
  }

  /**
   * Add a listener for reduced motion changes
   */
  addListener(listener: (enabled: boolean, config: ReducedMotionConfig) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listener: (enabled: boolean, config: ReducedMotionConfig) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get alternative visual feedback for reduced motion users
   */
  getAlternativeFeedback(): {
    letterCollected: () => void;
    letterMissed: () => void;
    wordCompleted: () => void;
    roundWon: () => void;
    roundLost: () => void;
  } {
    return {
      letterCollected: () => this.showStaticFeedback('✓', '#10b981'),
      letterMissed: () => this.showStaticFeedback('✗', '#ef4444'),
      wordCompleted: () => this.showStaticFeedback('Word Complete!', '#3b82f6'),
      roundWon: () => this.showStaticFeedback('Victory!', '#10b981'),
      roundLost: () => this.showStaticFeedback('Game Over', '#ef4444'),
    };
  }

  /**
   * Get reduced motion game settings
   */
  getGameSettings(): {
    letterFallSpeed: number;
    particleCount: number;
    animationDuration: number;
    transitionDuration: number;
    enableScreenShake: boolean;
    enableParticleEffects: boolean;
  } {
    if (!this.isEnabled) {
      return {
        letterFallSpeed: 1.0,
        particleCount: 100,
        animationDuration: 300,
        transitionDuration: 200,
        enableScreenShake: true,
        enableParticleEffects: true,
      };
    }

    return {
      letterFallSpeed: this.config.reduceLetterFallSpeed ? 0.7 : 1.0,
      particleCount: this.config.disableParticles ? 0 : 20,
      animationDuration: this.config.reduceAnimationSpeed ? 100 : 300,
      transitionDuration: this.config.simplifyTransitions ? 50 : 200,
      enableScreenShake: !this.config.disableScreenShake,
      enableParticleEffects: !this.config.disableParticles,
    };
  }

  private getDefaultConfig(): ReducedMotionConfig {
    return {
      disableParticles: true,
      reduceAnimationSpeed: true,
      simplifyTransitions: true,
      disableAutoScroll: true,
      useStaticBackgrounds: true,
      reduceLetterFallSpeed: true,
      disableScreenShake: true,
      simplifyVisualEffects: true,
    };
  }

  private detectSystemPreference(): void {
    if (window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.setEnabled(prefersReducedMotion.matches);

      prefersReducedMotion.addEventListener('change', (e) => {
        this.setEnabled(e.matches);
      });
    }
  }

  private setupStoreSync(): void {
    // Sync with settings store
    try {
      const store = useSettingsStore.getState();
      if (store.reducedMotion !== this.isEnabled) {
        this.setEnabled(store.reducedMotion);
      }

      // Subscribe to store changes
      useSettingsStore.subscribe((state) => {
        if (state.reducedMotion !== this.isEnabled) {
          this.setEnabled(state.reducedMotion);
        }
      });
    } catch (error) {
      // Store not available, continue without syncing
      console.warn('Could not sync with settings store:', error);
    }
  }

  private applyReducedMotionStyles(): void {
    const root = document.documentElement;
    
    if (this.isEnabled) {
      root.classList.add('reduced-motion');
      
      // Set CSS custom properties for reduced motion
      root.style.setProperty('--animation-duration', this.config.reduceAnimationSpeed ? '0.1s' : '0.3s');
      root.style.setProperty('--transition-duration', this.config.simplifyTransitions ? '0.05s' : '0.2s');
      root.style.setProperty('--particle-count', this.config.disableParticles ? '0' : '20');
      root.style.setProperty('--letter-fall-speed', this.config.reduceLetterFallSpeed ? '0.7' : '1.0');
    } else {
      root.classList.remove('reduced-motion');
      
      // Reset to default values
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
      root.style.removeProperty('--particle-count');
      root.style.removeProperty('--letter-fall-speed');
    }
  }

  private showStaticFeedback(message: string, color: string): void {
    // Create a simple, non-animated feedback element
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${color};
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      font-weight: bold;
      font-size: 1.25rem;
      z-index: 10000;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    document.body.appendChild(feedback);

    // Remove after a delay without animation
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 2000);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.isEnabled, this.config);
      } catch (error) {
        console.error('Error in reduced motion listener:', error);
      }
    });
  }
}

// Create hooks for React components
export function useReducedMotion() {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [config, setConfig] = React.useState<ReducedMotionConfig | null>(null);

  React.useEffect(() => {
    const manager = ReducedMotionManager.getInstance();
    
    setIsEnabled(manager.isReducedMotionEnabled());
    setConfig(manager.getConfig());

    const listener = (enabled: boolean, newConfig: ReducedMotionConfig) => {
      setIsEnabled(enabled);
      setConfig(newConfig);
    };

    manager.addListener(listener);

    return () => {
      manager.removeListener(listener);
    };
  }, []);

  return {
    isEnabled,
    config,
    gameSettings: config ? ReducedMotionManager.getInstance().getGameSettings() : null,
    alternativeFeedback: ReducedMotionManager.getInstance().getAlternativeFeedback(),
  };
}

// Export singleton instance
export const reducedMotionManager = ReducedMotionManager.getInstance();