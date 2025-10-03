import { Application } from 'pixi.js';
import { errorReporter } from '@shared/error/ErrorReporter';

export type GameContext = {
  app: Application;
  renderMode: 'webgl' | 'canvas';
  hasWebGLSupport: boolean;
};

export interface GameInitError extends Error {
  code: 'WEBGL_INIT_FAILED' | 'CANVAS_INIT_FAILED' | 'PIXI_INIT_FAILED';
  fallbackAvailable: boolean;
}

type ManagedCanvas = HTMLCanvasElement & {
  __pixiApp?: Application;
  __pixiDestroyTimer?: number;
};

function createGameInitError(message: string, code: GameInitError['code'], fallbackAvailable = false): GameInitError {
  const error = new Error(message) as GameInitError;
  error.code = code;
  error.fallbackAvailable = fallbackAvailable;
  return error;
}

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

async function initializePixiApp(canvas: HTMLCanvasElement, preferWebGL = true): Promise<{ app: Application; renderMode: 'webgl' | 'canvas' }> {
  const app = new Application();
  let renderMode: 'webgl' | 'canvas' = 'webgl';

  // First attempt: Try WebGL if preferred and supported
  if (preferWebGL && checkWebGLSupport()) {
    try {
      await app.init({
        canvas,
        resizeTo: canvas.parentElement ?? window,
        antialias: true,
        backgroundColor: 0x0b0b0f,
        preference: 'webgl',
        hello: false,
      });

      console.log('PixiJS initialized with WebGL renderer');
      return { app, renderMode: 'webgl' };
    } catch (webglError) {
      console.warn('WebGL initialization failed, attempting Canvas 2D fallback:', webglError);
      
      errorReporter.reportError(webglError as Error, {
        component: 'Game',
        action: 'webgl_init',
        additionalData: { 
          webglSupported: checkWebGLSupport(),
          userAgent: navigator.userAgent 
        }
      });

      // Destroy the failed app before trying fallback
      try {
        app.destroy();
      } catch (destroyError) {
        console.warn('Failed to destroy WebGL app:', destroyError);
      }
    }
  }

  // Second attempt: Canvas 2D fallback
  try {
    const fallbackApp = new Application();
    await fallbackApp.init({
      canvas,
      resizeTo: canvas.parentElement ?? window,
      antialias: false, // Disable antialiasing for better Canvas 2D performance
      backgroundColor: 0x0b0b0f,
      preference: 'webgpu', // This will fallback to canvas if webgpu is not available
      hello: false,
    });

    renderMode = 'canvas';
    console.log('PixiJS initialized with Canvas 2D renderer (fallback mode)');
    return { app: fallbackApp, renderMode };
  } catch (canvasError) {
    console.error('Canvas 2D initialization also failed:', canvasError);
    
    errorReporter.reportError(canvasError as Error, {
      component: 'Game',
      action: 'canvas_init',
      additionalData: { 
        webglSupported: checkWebGLSupport(),
        userAgent: navigator.userAgent 
      }
    });

    throw createGameInitError(
      'Failed to initialize both WebGL and Canvas 2D renderers',
      'PIXI_INIT_FAILED',
      false
    );
  }
}

export async function createGame(canvas: HTMLCanvasElement): Promise<GameContext> {
  const managedCanvas = canvas as ManagedCanvas;

  if (managedCanvas.__pixiDestroyTimer) {
    const ownerWindow = managedCanvas.ownerDocument?.defaultView ?? window;
    ownerWindow.clearTimeout(managedCanvas.__pixiDestroyTimer);
    managedCanvas.__pixiDestroyTimer = undefined;
  }

  if (managedCanvas.__pixiApp) {
    return { 
      app: managedCanvas.__pixiApp,
      renderMode: (managedCanvas.__pixiApp.renderer.type as any) === 'webgl' ? 'webgl' : 'canvas',
      hasWebGLSupport: checkWebGLSupport()
    };
  }

  try {
    const hasWebGLSupport = checkWebGLSupport();
    const { app, renderMode } = await initializePixiApp(canvas, hasWebGLSupport);
    
    managedCanvas.__pixiApp = app;

    // Add error handling for runtime rendering errors
    (app.renderer as any).on('error', (error: Error) => {
      console.error('PixiJS renderer error:', error);
      errorReporter.reportError(error, {
        component: 'Game',
        action: 'render_error',
        additionalData: { renderMode }
      });
    });

    return { app, renderMode, hasWebGLSupport };
  } catch (error) {
    const gameError = error as GameInitError;
    
    errorReporter.reportError(gameError, {
      component: 'Game',
      action: 'game_init',
      additionalData: {
        code: gameError.code,
        fallbackAvailable: gameError.fallbackAvailable,
        webglSupported: checkWebGLSupport()
      }
    });

    throw gameError;
  }
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
