import { Application } from 'pixi.js';

export type GameContext = {
  app: Application;
};

type ManagedCanvas = HTMLCanvasElement & {
  __pixiApp?: Application;
  __pixiDestroyTimer?: number;
};

export async function createGame(canvas: HTMLCanvasElement): Promise<GameContext> {
  const managedCanvas = canvas as ManagedCanvas;

  if (managedCanvas.__pixiDestroyTimer) {
    const ownerWindow = managedCanvas.ownerDocument?.defaultView ?? window;
    ownerWindow.clearTimeout(managedCanvas.__pixiDestroyTimer);
    managedCanvas.__pixiDestroyTimer = undefined;
  }

  if (managedCanvas.__pixiApp) {
    return { app: managedCanvas.__pixiApp };
  }

  const app = new Application();

  try {
    await app.init({
      canvas,
      resizeTo: canvas.parentElement ?? window,
      antialias: true,
      backgroundColor: 0x0b0b0f,
      preference: 'webgl',
      hello: false,
    });

    console.log('PixiJS initialized, renderer type:', app.renderer.type);
  } catch (error) {
    console.error('PixiJS initialization failed:', error);
    throw error;
  }

  managedCanvas.__pixiApp = app;

  return { app };
}

export function disposeGame(ctx: GameContext) {
  const canvas = ctx.app.canvas as ManagedCanvas | undefined;
  if (!canvas || canvas.__pixiApp !== ctx.app) {
    ctx.app.destroy();
    return;
  }

  const ownerWindow = canvas.ownerDocument?.defaultView ?? window;
  canvas.__pixiDestroyTimer = ownerWindow.setTimeout(() => {
    ctx.app.destroy();
    canvas.__pixiApp = undefined;
    canvas.__pixiDestroyTimer = undefined;
  }, 0);
}
