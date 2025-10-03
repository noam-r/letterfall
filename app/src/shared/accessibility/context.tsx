import React, { createContext, useContext, useEffect, useRef } from 'react';
import { AccessibilityManager } from './AccessibilityManager';
import type { AccessibilitySettings, GameEvent, GameState } from './AccessibilityManager';
import { useSettingsStore } from '@stores/SettingsStore';

interface AccessibilityContextValue {
  manager: AccessibilityManager | null;
  announceGameState: (state: GameState) => void;
  provideAudioCues: (event: GameEvent) => void;
  setupKeyboardNavigation: () => void;
  updateFocusableElements: () => void;
  registerKeyboardHandler: (key: string, handler: (event: KeyboardEvent) => void) => void;
  unregisterKeyboardHandler: (key: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const managerRef = useRef<AccessibilityManager | null>(null);
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const muted = useSettingsStore((state) => state.muted);

  useEffect(() => {
    // Initialize accessibility manager
    const settings: AccessibilitySettings = {
      screenReaderEnabled: true, // Always enable for better UX
      keyboardNavigation: true,
      reducedMotion,
      highContrast: false, // Will be detected by system preferences
      audioDescriptions: !muted,
    };

    managerRef.current = new AccessibilityManager(settings);
    managerRef.current.setupKeyboardNavigation();
    managerRef.current.adaptForReducedMotion();

    return () => {
      if (managerRef.current) {
        managerRef.current.cleanup();
      }
    };
  }, []);

  // Update settings when store changes
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.updateSettings({
        reducedMotion,
        audioDescriptions: !muted,
      });
      managerRef.current.adaptForReducedMotion();
    }
  }, [reducedMotion, muted]);

  const contextValue: AccessibilityContextValue = {
    manager: managerRef.current,
    announceGameState: (state: GameState) => {
      managerRef.current?.announceGameState(state);
    },
    provideAudioCues: (event: GameEvent) => {
      managerRef.current?.provideAudioCues(event);
    },
    setupKeyboardNavigation: () => {
      managerRef.current?.setupKeyboardNavigation();
    },
    updateFocusableElements: () => {
      managerRef.current?.updateFocusableElements();
    },
    registerKeyboardHandler: (key: string, handler: (event: KeyboardEvent) => void) => {
      managerRef.current?.registerKeyboardHandler(key, handler);
    },
    unregisterKeyboardHandler: (key: string) => {
      managerRef.current?.unregisterKeyboardHandler(key);
    },
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}