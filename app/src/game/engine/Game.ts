import { Application } from 'pixi.js';

export type GameContext = {
  app: Application;
};

export async function createGame(canvas: HTMLCanvasElement): Promise<GameContext> {
  const app = new Application();

  await app.init({
    view: canvas,
    resizeTo: canvas.parentElement ?? window,
    antialias: true,
    backgroundColor: 0x0b0b0f,
  });

  return { app };
}

export function disposeGame(ctx: GameContext) {
  ctx.app.destroy(true);
}
