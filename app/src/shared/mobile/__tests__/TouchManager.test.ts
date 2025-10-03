import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TouchManager, TouchPoint } from '../TouchManager';

// Mock DOM methods
const mockElement = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 300, height: 300 })),
} as any;

describe('TouchManager', () => {
  let touchManager: TouchManager;

  beforeEach(() => {
    vi.clearAllMocks();
    touchManager = new TouchManager(mockElement);
  });

  afterEach(() => {
    touchManager.destroy();
  });

  describe('initialization', () => {
    it('should set up event listeners on element', () => {
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), expect.any(Object));
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), expect.any(Object));
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), expect.any(Object));
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function), expect.any(Object));
    });

    it('should use default configuration', () => {
      const config = (touchManager as any).config;
      expect(config.doubleTapThreshold).toBe(300);
      expect(config.longPressThreshold).toBe(500);
      expect(config.swipeThreshold).toBe(50);
      expect(config.tapThreshold).toBe(10);
      expect(config.preventDefaultOnTouch).toBe(true);
    });

    it('should accept custom configuration', () => {
      const customManager = new TouchManager(mockElement, {
        doubleTapThreshold: 200,
        longPressThreshold: 1000,
      });

      const config = (customManager as any).config;
      expect(config.doubleTapThreshold).toBe(200);
      expect(config.longPressThreshold).toBe(1000);
      expect(config.swipeThreshold).toBe(50); // Default value

      customManager.destroy();
    });
  });

  describe('static methods', () => {
    it('should detect touch device capability', () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        value: {},
        writable: true,
      });

      expect(TouchManager.isTouchDevice()).toBe(true);

      // Clean up
      delete (window as any).ontouchstart;
    });

    it('should calculate optimal touch target size', () => {
      const size = TouchManager.getOptimalTouchTargetSize();
      expect(size).toBeGreaterThanOrEqual(44); // Minimum accessibility requirement
      expect(size).toBeLessThanOrEqual(60); // Maximum reasonable size
    });
  });

  describe('touch event handling', () => {
    it('should track active touches', () => {
      const mockTouch = {
        identifier: 1,
        clientX: 100,
        clientY: 100,
      };

      const mockTouchEvent = {
        touches: [mockTouch],
        preventDefault: vi.fn(),
      } as any;

      // Simulate touchstart
      const touchStartHandler = mockElement.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      
      if (touchStartHandler) {
        touchStartHandler(mockTouchEvent);
      }

      const activeTouches = touchManager.getActiveTouches();
      expect(activeTouches).toHaveLength(1);
      expect(activeTouches[0].id).toBe(1);
      expect(activeTouches[0].x).toBe(100);
      expect(activeTouches[0].y).toBe(100);
    });

    it('should call tap listener on tap gesture', () => {
      const onTap = vi.fn();
      touchManager.setListeners({ onTap });

      const mockTouch = {
        identifier: 1,
        clientX: 100,
        clientY: 100,
      };

      // Simulate touchstart
      const touchStartHandler = mockElement.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      
      const touchEndHandler = mockElement.addEventListener.mock.calls
        .find(call => call[0] === 'touchend')?.[1];

      if (touchStartHandler && touchEndHandler) {
        // Start touch
        touchStartHandler({
          touches: [mockTouch],
          preventDefault: vi.fn(),
        });

        // End touch quickly (tap)
        setTimeout(() => {
          touchEndHandler({
            touches: [],
            changedTouches: [mockTouch],
            preventDefault: vi.fn(),
          });

          expect(onTap).toHaveBeenCalledWith(expect.objectContaining({
            id: 1,
            x: 100,
            y: 100,
          }));
        }, 10);
      }
    });

    it('should detect swipe gestures', () => {
      const onSwipe = vi.fn();
      touchManager.setListeners({ onSwipe });

      const startTouch = {
        identifier: 1,
        clientX: 50,
        clientY: 100,
      };

      const endTouch = {
        identifier: 1,
        clientX: 150, // Moved 100px to the right
        clientY: 100,
      };

      const touchStartHandler = mockElement.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      
      const touchEndHandler = mockElement.addEventListener.mock.calls
        .find(call => call[0] === 'touchend')?.[1];

      if (touchStartHandler && touchEndHandler) {
        // Start touch
        touchStartHandler({
          touches: [startTouch],
          preventDefault: vi.fn(),
        });

        // End touch with significant movement
        touchEndHandler({
          touches: [],
          changedTouches: [endTouch],
          preventDefault: vi.fn(),
        });

        expect(onSwipe).toHaveBeenCalledWith(expect.objectContaining({
          type: 'swipe',
          direction: 'right',
        }));
      }
    });
  });

  describe('gesture recognition', () => {
    it('should recognize double tap', (done) => {
      const onDoubleTap = vi.fn();
      touchManager.setListeners({ onDoubleTap });

      const mockTouch = {
        identifier: 1,
        clientX: 100,
        clientY: 100,
      };

      const touchStartHandler = mockElement.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];
      
      const touchEndHandler = mockElement.addEventListener.mock.calls
        .find(call => call[0] === 'touchend')?.[1];

      if (touchStartHandler && touchEndHandler) {
        // First tap
        touchStartHandler({
          touches: [mockTouch],
          preventDefault: vi.fn(),
        });

        touchEndHandler({
          touches: [],
          changedTouches: [mockTouch],
          preventDefault: vi.fn(),
        });

        // Second tap within threshold
        setTimeout(() => {
          touchStartHandler({
            touches: [mockTouch],
            preventDefault: vi.fn(),
          });

          touchEndHandler({
            touches: [],
            changedTouches: [mockTouch],
            preventDefault: vi.fn(),
          });

          expect(onDoubleTap).toHaveBeenCalled();
          done();
        }, 100); // Within double tap threshold
      }
    });

    it('should recognize long press', (done) => {
      const onLongPress = vi.fn();
      const customManager = new TouchManager(mockElement, {
        longPressThreshold: 100, // Short threshold for testing
      });
      
      customManager.setListeners({ onLongPress });

      const mockTouch = {
        identifier: 1,
        clientX: 100,
        clientY: 100,
      };

      const touchStartHandler = mockElement.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1];

      if (touchStartHandler) {
        touchStartHandler({
          touches: [mockTouch],
          preventDefault: vi.fn(),
        });

        // Wait for long press threshold
        setTimeout(() => {
          expect(onLongPress).toHaveBeenCalled();
          customManager.destroy();
          done();
        }, 150);
      }
    });
  });

  describe('configuration updates', () => {
    it('should update configuration', () => {
      touchManager.updateConfig({
        doubleTapThreshold: 400,
        swipeThreshold: 75,
      });

      const config = (touchManager as any).config;
      expect(config.doubleTapThreshold).toBe(400);
      expect(config.swipeThreshold).toBe(75);
      expect(config.longPressThreshold).toBe(500); // Unchanged
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on destroy', () => {
      touchManager.destroy();

      expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function));
    });
  });
});