import { useEffect, useCallback } from 'react';
import { useAccessibility } from './context';
import type { GameEvent, GameState } from './AccessibilityManager';

/**
 * Hook to announce game state changes to screen readers
 */
export function useGameStateAnnouncements(gameState: GameState) {
  const { announceGameState } = useAccessibility();

  useEffect(() => {
    announceGameState(gameState);
  }, [gameState.roundPhase, gameState.activeWord, gameState.credits, announceGameState]);
}

/**
 * Hook to provide audio cues for game events
 */
export function useAudioCues() {
  const { provideAudioCues } = useAccessibility();

  const playAudioCue = useCallback((event: GameEvent) => {
    provideAudioCues(event);
  }, [provideAudioCues]);

  return playAudioCue;
}

/**
 * Hook to register keyboard handlers for specific keys
 */
export function useKeyboardHandler(key: string, handler: (event: KeyboardEvent) => void, deps: any[] = []) {
  const { registerKeyboardHandler, unregisterKeyboardHandler } = useAccessibility();

  useEffect(() => {
    registerKeyboardHandler(key, handler);
    return () => {
      unregisterKeyboardHandler(key);
    };
  }, [key, registerKeyboardHandler, unregisterKeyboardHandler, ...deps]);
}

/**
 * Hook to manage focus for keyboard navigation
 */
export function useFocusManagement() {
  const { updateFocusableElements } = useAccessibility();

  const updateFocus = useCallback(() => {
    updateFocusableElements();
  }, [updateFocusableElements]);

  // Update focusable elements when component mounts or updates
  useEffect(() => {
    updateFocus();
  });

  return { updateFocus };
}

/**
 * Hook for game-specific keyboard controls
 */
export function useGameKeyboardControls(
  onPause?: () => void,
  onResume?: () => void,
  onSelectWord?: (direction: 'next' | 'previous') => void,
  onCollectLetter?: () => void
) {
  const { registerKeyboardHandler, unregisterKeyboardHandler } = useAccessibility();

  useEffect(() => {
    // Space bar for pause/resume
    if (onPause || onResume) {
      registerKeyboardHandler('Space', () => {
        // Determine if we should pause or resume based on game state
        // This will be handled by the component using this hook
        if (onPause) onPause();
        if (onResume) onResume();
      });
    }

    // Arrow keys for word selection
    if (onSelectWord) {
      registerKeyboardHandler('ArrowUp', () => onSelectWord('previous'));
      registerKeyboardHandler('ArrowDown', () => onSelectWord('next'));
    }

    // Enter key for letter collection (alternative to clicking)
    if (onCollectLetter) {
      registerKeyboardHandler('Enter', () => onCollectLetter());
    }

    return () => {
      unregisterKeyboardHandler('Space');
      unregisterKeyboardHandler('ArrowUp');
      unregisterKeyboardHandler('ArrowDown');
      unregisterKeyboardHandler('Enter');
    };
  }, [onPause, onResume, onSelectWord, onCollectLetter, registerKeyboardHandler, unregisterKeyboardHandler]);
}

/**
 * Hook to handle reduced motion preferences
 */
export function useReducedMotion() {
  const { manager } = useAccessibility();

  useEffect(() => {
    if (manager) {
      manager.adaptForReducedMotion();
    }
  }, [manager]);

  return manager?.settings?.reducedMotion ?? false;
}