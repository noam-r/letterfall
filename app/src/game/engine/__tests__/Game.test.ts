import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createGame, disposeGame } from '../Game';
import { errorReporter } from '@shared/error/ErrorReporter';

// Mock PixiJS Application
const mockApp = {
  init: vi.fn(),
  destroy: vi.fn(),
  renderer: {
    type: 'webgl',
    on: vi.fn(),
  },
  canvas: document.createElement('canvas'),
};

vi.mock('pixi.js', () => ({
  Application: vi.fn(() => mockApp),
}));

// Mock error reporter
vi.mock('@shared/error/ErrorReporter', () => ({
  errorReporter: {
    reportError: vi.fn(),
  },
}));

describe('Game', () => {
  let canvas: HTMLCanvasElement;
  let mockReportError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    mockReportError = vi.mocked(errorReporter.reportError);
    mockReportError.mockClear();
    mockApp.init.mockClear();
    mockApp.destroy.mockClear();
    mockApp.renderer.on.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createGame', () => {
    it('successfully creates game with WebGL', async () => {
      mockApp.init.mockResolvedValue(undefined);
      mockApp.renderer.type = 'webgl';

      // Mock WebGL support detection
      const mockGetContext = vi.fn().mockReturnValue({}); // Mock WebGL context
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'canvas') {
          const mockCanvas = originalCreateElement.call(document, 'canvas');
          mockCanvas.getContext = mockGetContext;
          return mockCanvas;
        }
        return originalCreateElement.call(document, tagName);
      });

      const context = await createGame(canvas);

      expect(context.app).toBe(mockApp);
      expect(context.renderMode).toBe('webgl');
      expect(context.hasWebGLSupport).toBe(true);
      expect(mockApp.init).toHaveBeenCalledWith({
        canvas,
        resizeTo: window,
        antialias: true,
        backgroundColor: 0x0b0b0f,
        preference: 'webgl',
        hello: false,
      });

      document.createElement = originalCreateElement;
    });

    it('falls back to Canvas 2D when WebGL fails', async () => {
      // Mock WebGL support but make init fail
      const mockGetContext = vi.fn().mockReturnValue({}); // Mock WebGL context
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'canvas') {
          const mockCanvas = originalCreateElement.call(document, 'canvas');
          mockCanvas.getContext = mockGetContext;
          return mockCanvas;
        }
        return originalCreateElement.call(document, tagName);
      });

      // First call (WebGL) fails, second call (Canvas) succeeds
      mockApp.init
        .mockRejectedValueOnce(new Error('WebGL not supported'))
        .mockResolvedValueOnce(undefined);
      mockApp.renderer.type = 'canvas';

      const context = await createGame(canvas);

      expect(context.renderMode).toBe('canvas');
      expect(mockReportError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'Game',
          action: 'webgl_init',
        })
      );

      document.createElement = originalCreateElement;
    });

    it('throws error when both WebGL and Canvas fail', async () => {
      // Mock WebGL support
      const mockGetContext = vi.fn().mockReturnValue({}); // Mock WebGL context
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'canvas') {
          const mockCanvas = originalCreateElement.call(document, 'canvas');
          mockCanvas.getContext = mockGetContext;
          return mockCanvas;
        }
        return originalCreateElement.call(document, tagName);
      });

      // Both WebGL and Canvas attempts fail
      mockApp.init.mockRejectedValue(new Error('Initialization failed'));

      await expect(createGame(canvas)).rejects.toThrow('Failed to initialize both WebGL and Canvas 2D renderers');
      
      expect(mockReportError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'Game',
          action: 'webgl_init',
        })
      );
      expect(mockReportError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'Game',
          action: 'canvas_init',
        })
      );

      document.createElement = originalCreateElement;
    });

    it('reuses existing PixiJS app if available', async () => {
      const managedCanvas = canvas as any;
      managedCanvas.__pixiApp = mockApp;

      const context = await createGame(canvas);

      expect(context.app).toBe(mockApp);
      expect(mockApp.init).not.toHaveBeenCalled();
    });

    it('clears existing destroy timer', async () => {
      const managedCanvas = canvas as any;
      const mockClearTimeout = vi.fn();
      const mockTimeout = 123;
      
      managedCanvas.__pixiDestroyTimer = mockTimeout;
      
      // Mock window with clearTimeout
      Object.defineProperty(canvas, 'ownerDocument', {
        value: {
          defaultView: {
            clearTimeout: mockClearTimeout,
          },
        },
      });

      mockApp.init.mockResolvedValue(undefined);

      await createGame(canvas);

      expect(mockClearTimeout).toHaveBeenCalledWith(mockTimeout);
      expect(managedCanvas.__pixiDestroyTimer).toBeUndefined();
    });

    it('sets up renderer error handling', async () => {
      mockApp.init.mockResolvedValue(undefined);

      await createGame(canvas);

      expect(mockApp.renderer.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('reports renderer errors when they occur', async () => {
      mockApp.init.mockResolvedValue(undefined);
      let errorHandler: (error: Error) => void;
      
      mockApp.renderer.on.mockImplementation((event: string, handler: any) => {
        if (event === 'error') {
          errorHandler = handler;
        }
      });

      await createGame(canvas);

      const renderError = new Error('Render failed');
      errorHandler!(renderError);

      expect(mockReportError).toHaveBeenCalledWith(
        renderError,
        expect.objectContaining({
          component: 'Game',
          action: 'render_error',
        })
      );
    });

    it('detects WebGL support correctly', async () => {
      // Mock WebGL context creation
      const mockGetContext = vi.fn();
      const originalCreateElement = document.createElement;
      
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'canvas') {
          const mockCanvas = originalCreateElement.call(document, 'canvas');
          mockCanvas.getContext = mockGetContext;
          return mockCanvas;
        }
        return originalCreateElement.call(document, tagName);
      });

      // Test with WebGL support
      mockGetContext.mockReturnValue({}); // Mock WebGL context
      mockApp.init.mockResolvedValue(undefined);

      const context = await createGame(canvas);
      expect(context.hasWebGLSupport).toBe(true);

      // Test without WebGL support
      mockGetContext.mockReturnValue(null);
      const context2 = await createGame(document.createElement('canvas'));
      expect(context2.hasWebGLSupport).toBe(false);

      document.createElement = originalCreateElement;
    });
  });

  describe('disposeGame', () => {
    it('destroys app immediately if not managed', () => {
      const context = { app: mockApp, renderMode: 'webgl' as const, hasWebGLSupport: true };
      
      disposeGame(context);

      expect(mockApp.destroy).toHaveBeenCalled();
    });

    it('schedules destruction for managed canvas', () => {
      const managedCanvas = canvas as any;
      managedCanvas.__pixiApp = mockApp;
      mockApp.canvas = managedCanvas;

      const mockSetTimeout = vi.fn().mockReturnValue(456);
      Object.defineProperty(canvas, 'ownerDocument', {
        value: {
          defaultView: {
            setTimeout: mockSetTimeout,
          },
        },
      });

      const context = { app: mockApp, renderMode: 'webgl' as const, hasWebGLSupport: true };
      disposeGame(context);

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
      expect(managedCanvas.__pixiDestroyTimer).toBe(456);
      expect(mockApp.destroy).not.toHaveBeenCalled(); // Should be scheduled, not immediate
    });

    it('executes scheduled destruction', () => {
      const managedCanvas = canvas as any;
      managedCanvas.__pixiApp = mockApp;
      mockApp.canvas = managedCanvas;

      let destructionCallback: () => void;
      const mockSetTimeout = vi.fn().mockImplementation((callback: () => void) => {
        destructionCallback = callback;
        return 789;
      });

      Object.defineProperty(canvas, 'ownerDocument', {
        value: {
          defaultView: {
            setTimeout: mockSetTimeout,
          },
        },
      });

      const context = { app: mockApp, renderMode: 'webgl' as const, hasWebGLSupport: true };
      disposeGame(context);

      // Execute the scheduled destruction
      destructionCallback!();

      expect(mockApp.destroy).toHaveBeenCalled();
      expect(managedCanvas.__pixiApp).toBeUndefined();
      expect(managedCanvas.__pixiDestroyTimer).toBeUndefined();
    });
  });
});