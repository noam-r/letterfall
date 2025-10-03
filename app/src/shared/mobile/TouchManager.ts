export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

export interface TouchGesture {
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe';
  startPoint: TouchPoint;
  endPoint?: TouchPoint;
  duration: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export interface TouchManagerConfig {
  doubleTapThreshold: number; // ms
  longPressThreshold: number; // ms
  swipeThreshold: number; // pixels
  tapThreshold: number; // pixels for tap tolerance
  preventDefaultOnTouch: boolean;
}

export class TouchManager {
  private config: TouchManagerConfig;
  private activeTouches = new Map<number, TouchPoint>();
  private lastTap: TouchPoint | null = null;
  private longPressTimer: number | null = null;
  private element: HTMLElement;
  private listeners: {
    onTap?: (point: TouchPoint) => void;
    onDoubleTap?: (point: TouchPoint) => void;
    onLongPress?: (point: TouchPoint) => void;
    onSwipe?: (gesture: TouchGesture) => void;
    onTouchStart?: (touches: TouchPoint[]) => void;
    onTouchMove?: (touches: TouchPoint[]) => void;
    onTouchEnd?: (touches: TouchPoint[]) => void;
  } = {};

  constructor(element: HTMLElement, config: Partial<TouchManagerConfig> = {}) {
    this.element = element;
    this.config = {
      doubleTapThreshold: 300,
      longPressThreshold: 500,
      swipeThreshold: 50,
      tapThreshold: 10,
      preventDefaultOnTouch: true,
      ...config,
    };

    this.setupEventListeners();
  }

  /**
   * Set event listeners for touch gestures
   */
  setListeners(listeners: typeof this.listeners): void {
    this.listeners = { ...this.listeners, ...listeners };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TouchManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current active touches
   */
  getActiveTouches(): TouchPoint[] {
    return Array.from(this.activeTouches.values());
  }

  /**
   * Check if device supports touch
   */
  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get optimal touch target size for current device
   */
  static getOptimalTouchTargetSize(): number {
    // Minimum 44px as per accessibility guidelines
    const minSize = 44;
    
    // Adjust based on device pixel ratio
    const devicePixelRatio = window.devicePixelRatio || 1;
    const adjustedSize = minSize * devicePixelRatio;
    
    return Math.max(minSize, Math.min(adjustedSize, 60));
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
  }

  private setupEventListeners(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: !this.config.preventDefaultOnTouch });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: !this.config.preventDefaultOnTouch });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: !this.config.preventDefaultOnTouch });
    this.element.addEventListener('touchcancel', this.handleTouchCancel, { passive: !this.config.preventDefaultOnTouch });
  }

  private handleTouchStart = (event: TouchEvent): void => {
    if (this.config.preventDefaultOnTouch) {
      event.preventDefault();
    }

    const touches = this.extractTouchPoints(event.touches);
    
    // Store active touches
    touches.forEach(touch => {
      this.activeTouches.set(touch.id, touch);
    });

    // Handle single touch for gestures
    if (touches.length === 1) {
      const touch = touches[0];
      
      // Set up long press timer
      this.longPressTimer = window.setTimeout(() => {
        if (this.activeTouches.has(touch.id)) {
          this.handleLongPress(touch);
        }
      }, this.config.longPressThreshold);
    }

    if (this.listeners.onTouchStart) {
      this.listeners.onTouchStart(touches);
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    if (this.config.preventDefaultOnTouch) {
      event.preventDefault();
    }

    const touches = this.extractTouchPoints(event.touches);
    
    // Update active touches
    touches.forEach(touch => {
      const existingTouch = this.activeTouches.get(touch.id);
      if (existingTouch) {
        // Check if movement exceeds tap threshold
        const distance = this.calculateDistance(existingTouch, touch);
        if (distance > this.config.tapThreshold) {
          // Cancel long press if touch moved too much
          if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
          }
        }
        
        this.activeTouches.set(touch.id, touch);
      }
    });

    if (this.listeners.onTouchMove) {
      this.listeners.onTouchMove(touches);
    }
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    if (this.config.preventDefaultOnTouch) {
      event.preventDefault();
    }

    const remainingTouches = this.extractTouchPoints(event.touches);
    const changedTouches = this.extractTouchPoints(event.changedTouches);

    // Process ended touches
    changedTouches.forEach(touch => {
      const startTouch = this.activeTouches.get(touch.id);
      if (startTouch) {
        this.processTouchGesture(startTouch, touch);
        this.activeTouches.delete(touch.id);
      }
    });

    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (this.listeners.onTouchEnd) {
      this.listeners.onTouchEnd(remainingTouches);
    }
  };

  private handleTouchCancel = (event: TouchEvent): void => {
    const cancelledTouches = this.extractTouchPoints(event.changedTouches);
    
    cancelledTouches.forEach(touch => {
      this.activeTouches.delete(touch.id);
    });

    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  };

  private extractTouchPoints(touches: TouchList): TouchPoint[] {
    const points: TouchPoint[] = [];
    
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const rect = this.element.getBoundingClientRect();
      
      points.push({
        id: touch.identifier,
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        timestamp: Date.now(),
      });
    }
    
    return points;
  }

  private processTouchGesture(startTouch: TouchPoint, endTouch: TouchPoint): void {
    const duration = endTouch.timestamp - startTouch.timestamp;
    const distance = this.calculateDistance(startTouch, endTouch);

    // Check for swipe
    if (distance > this.config.swipeThreshold) {
      const direction = this.getSwipeDirection(startTouch, endTouch);
      const gesture: TouchGesture = {
        type: 'swipe',
        startPoint: startTouch,
        endPoint: endTouch,
        duration,
        direction,
      };
      
      if (this.listeners.onSwipe) {
        this.listeners.onSwipe(gesture);
      }
      return;
    }

    // Check for tap (within threshold and not too long)
    if (distance <= this.config.tapThreshold && duration < this.config.longPressThreshold) {
      this.handleTap(endTouch);
    }
  }

  private handleTap(touch: TouchPoint): void {
    // Check for double tap
    if (this.lastTap && 
        touch.timestamp - this.lastTap.timestamp < this.config.doubleTapThreshold &&
        this.calculateDistance(this.lastTap, touch) <= this.config.tapThreshold) {
      
      if (this.listeners.onDoubleTap) {
        this.listeners.onDoubleTap(touch);
      }
      this.lastTap = null; // Reset to prevent triple tap
    } else {
      // Single tap
      if (this.listeners.onTap) {
        this.listeners.onTap(touch);
      }
      this.lastTap = touch;
    }
  }

  private handleLongPress(touch: TouchPoint): void {
    if (this.listeners.onLongPress) {
      this.listeners.onLongPress(touch);
    }
  }

  private calculateDistance(point1: TouchPoint, point2: TouchPoint): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getSwipeDirection(start: TouchPoint, end: TouchPoint): 'up' | 'down' | 'left' | 'right' {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }
}