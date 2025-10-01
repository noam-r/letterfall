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
          };
          const previous = {
            roundPhase: previousState.roundPhase,
            words: previousState.words,
            activeWord: previousState.activeWord,
            difficulty: previousState.difficulty,
            speed: previousState.speed,
            noiseLevel: previousState.noiseLevel,
          };
          runtime.updateState(current, previous);
        });

        teardownCallbacks.push(unsubscribe);
      })
      .catch((error) => {
        console.error('Failed to initialise game', error);
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
