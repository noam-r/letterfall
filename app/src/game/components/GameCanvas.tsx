import { useEffect, useRef } from 'react';

import { useAppStore } from '@app/store';
import { createLazyGame, disposeLazyGame } from '@game/engine/LazyGame';
import type { GameContext } from '@game/engine/Game';
import { GameRuntime } from '@game/engine/runtime';
import { useAudioCues } from '@shared/accessibility';
import { useTouchGestures, useHapticFeedback } from '@shared/mobile';

function selectRuntimeState() {
  const state = useAppStore.getState();
  return {
    roundPhase: state.roundPhase,
    words: state.words,
    activeWord: state.activeWord,
    difficulty: state.difficulty,
    speed: state.speed,
    noiseLevel: state.noiseLevel,
    language: state.language,
  };
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playAudioCue = useAudioCues();
  const roundPhase = useAppStore((state) => state.roundPhase);
  const { lightTap, success, error } = useHapticFeedback();

  // Touch gesture handling
  useTouchGestures(canvasRef as any, {
    onTap: (_point) => {
      if (roundPhase === 'playing') {
        // Handle letter collection at touch point
        lightTap(); // Provide haptic feedback
        // The actual letter collection logic would be handled by the game engine
      }
    },
    onDoubleTap: (_point) => {
      if (roundPhase === 'playing') {
        // Could be used for special actions
        lightTap();
      }
    },
    enabled: roundPhase === 'playing',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    let ctx: GameContext | null = null;
    let runtime: GameRuntime | null = null;
    let disposed = false;
    const teardownCallbacks: Array<() => void> = [];

    createLazyGame(canvas)
      .then((gameCtx) => {
        if (disposed) {
          disposeLazyGame(gameCtx);
          return;
        }

        console.log('Game initialized successfully');
        ctx = gameCtx;
        runtime = new GameRuntime(gameCtx, {
          onLetterCollected: (letter) => {
            const result = useAppStore.getState().collectLetter(letter);
            playAudioCue({ type: 'letter_collected', data: { letter } });
            success(); // Haptic feedback for successful collection
            return result || { matched: false, completedWord: false, roundWon: false };
          },
          onLetterMissed: () => {
            useAppStore.getState().missLetter();
            playAudioCue({ type: 'letter_missed' });
            error(); // Haptic feedback for missed letter
          },
          onFairnessNudge: () => {
            const api = useAppStore.getState();
            const now = Date.now();
            api.setFairnessPulse(now);
            api.setFeedbackFlash({ type: 'fairness', timestamp: now });
          },
        });

        runtime.updateState(selectRuntimeState());

        const unsubscribe = useAppStore.subscribe((state, previousState) => {
          if (!runtime) {
            return;
          }
          const current = {
            roundPhase: state.roundPhase,
            words: state.words,
            activeWord: state.activeWord,
            difficulty: state.difficulty,
            speed: state.speed,
            noiseLevel: state.noiseLevel,
            language: state.language,
          };
          const previous = {
            roundPhase: previousState.roundPhase,
            words: previousState.words,
            activeWord: previousState.activeWord,
            difficulty: previousState.difficulty,
            speed: previousState.speed,
            noiseLevel: previousState.noiseLevel,
            language: previousState.language,
          };
          runtime.updateState(current, previous);
        });

        teardownCallbacks.push(unsubscribe);
      })
      .catch((error) => {
        console.error('Failed to initialise game:', error);
        console.error('This might be a graphics/WebGL issue. The game cannot start.');
        
        // Show error in the canvas
        const ctx2d = canvas.getContext('2d');
        if (ctx2d) {
          ctx2d.fillStyle = '#0b0b0f';
          ctx2d.fillRect(0, 0, canvas.width, canvas.height);
          ctx2d.fillStyle = '#ffffff';
          ctx2d.font = '16px monospace';
          ctx2d.textAlign = 'center';
          ctx2d.fillText('Graphics Error: Game cannot start', canvas.width / 2, canvas.height / 2);
          ctx2d.fillText('Check browser console for details', canvas.width / 2, canvas.height / 2 + 20);
        }
      });

    return () => {
      disposed = true;
      teardownCallbacks.forEach((fn) => fn());
      runtime?.destroy();
      runtime = null;
      if (ctx) {
        disposeLazyGame(ctx);
      }
      ctx = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only initialize once

  return (
    <canvas 
      className="game-canvas" 
      ref={canvasRef}
      role="application"
      aria-label="Letter falling game area. Letters will fall from the top. Click or tap letters to collect them."
      aria-live="polite"
      tabIndex={roundPhase === 'playing' ? 0 : -1}
    />
  );
}
