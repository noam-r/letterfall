import type { GameContext } from './Game';

/**
 * Lazy-loaded Game engine to reduce initial bundle size
 */
export async function createLazyGame(canvas: HTMLCanvasElement): Promise<GameContext> {
  // Dynamically import the Game module only when needed
  const { createGame } = await import('./Game');
  return createGame(canvas);
}

export async function disposeLazyGame(ctx: GameContext): Promise<void> {
  // Dynamically import the Game module only when needed
  const { disposeGame } = await import('./Game');
  return disposeGame(ctx);
}