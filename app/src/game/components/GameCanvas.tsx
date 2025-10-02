import { useEffect, useRef } from 'react';

import { useAppStore } from '@app/store';
import { createGame, disposeGame, type GameContext } from '@game/engine/Game';
import { GameRuntime } from '@game/engine/runtime';

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    let ctx: GameContext | null = null;
    let runtime: GameRuntime | null = null;
    let disposed = false;
    const teardownCallbacks: Array<() => void> = [];

    createGame(canvas)
      .then((gameCtx) => {
        if (disposed) {
          disposeGame(gameCtx);
          return;
        }

        console.log('Game initialized successfully');
        ctx = gameCtx;
        runtime = new GameRuntime(gameCtx, {
          onLetterCollected: (letter) => useAppStore.getState().collectLetter(letter),
          onLetterMissed: () => useAppStore.getState().missLetter(),
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
        disposeGame(ctx);
      }
      ctx = null;
    };
  }, []);

  return <canvas className="game-canvas" ref={canvasRef} />;
}
