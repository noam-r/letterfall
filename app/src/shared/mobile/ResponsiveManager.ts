export interface ViewportInfo {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'portrait' | 'landscape';
  devicePixelRatio: number;
  isSmallScreen: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface ResponsiveConfig {
  breakpoints: ResponsiveBreakpoints;
  debounceDelay: number;
  enableOrientationLock: boolean;
}

export class ResponsiveManager {
  private config: ResponsiveConfig;
  private listeners: {
    onViewportChange?: (viewport: ViewportInfo) => void;
    onOrientationChange?: (orientation: 'portrait' | 'landscape') => void;
    onBreakpointChange?: (breakpoint: 'mobile' | 'tablet' | 'desktop') => void;
  } = {};
  
  private currentViewport: ViewportInfo;
  private resizeTimeout: number | null = null;
  private orientationTimeout: number | null = null;

  constructor(config: Partial<ResponsiveConfig> = {}) {
    this.config = {
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200,
      },
      debounceDelay: 150,
      enableOrientationLock: false,
      ...config,
    };

    this.currentViewport = this.calculateViewportInfo();
    this.setupEventListeners();
    this.applyInitialStyles();
  }

  /**
   * Set event listeners for responsive changes
   */
  setListeners(listeners: typeof this.listeners): void {
    this.listeners = { ...this.listeners, ...listeners };
  }

  /**
   * Get current viewport information
   */
  getViewportInfo(): ViewportInfo {
    return { ...this.currentViewport };
  }

  /**
   * Check if current viewport matches a breakpoint
   */
  isBreakpoint(breakpoint: 'mobile' | 'tablet' | 'desktop'): boolean {
    const { width } = this.currentViewport;
    
    switch (breakpoint) {
      case 'mobile':
        return width < this.config.breakpoints.mobile;
      case 'tablet':
        return width >= this.config.breakpoints.mobile && width < this.config.breakpoints.desktop;
      case 'desktop':
        return width >= this.config.breakpoints.desktop;
      default:
        return false;
    }
  }

  /**
   * Get current breakpoint
   */
  getCurrentBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
    const { width } = this.currentViewport;
    
    if (width < this.config.breakpoints.mobile) {
      return 'mobile';
    } else if (width < this.config.breakpoints.desktop) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Lock orientation (if supported)
   */
  async lockOrientation(orientation: 'portrait' | 'landscape'): Promise<boolean> {
    if (!this.config.enableOrientationLock || !screen.orientation) {
      return false;
    }

    try {
      if ('lock' in screen.orientation) {
        await (screen.orientation as any).lock(orientation === 'portrait' ? 'portrait-primary' : 'landscape-primary');
      }
      return true;
    } catch (error) {
      console.warn('Failed to lock orientation:', error);
      return false;
    }
  }

  /**
   * Unlock orientation
   */
  unlockOrientation(): void {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  }

  /**
   * Get safe area insets (for devices with notches)
   */
  getSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
    const style = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0', 10),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10),
    };
  }

  /**
   * Apply responsive CSS classes to document
   */
  applyResponsiveClasses(): void {
    const { classList } = document.documentElement;
    const breakpoint = this.getCurrentBreakpoint();
    const { orientation, isMobile, isTablet, isDesktop } = this.currentViewport;

    // Clear existing classes
    classList.remove('mobile', 'tablet', 'desktop', 'portrait', 'landscape');

    // Add current classes
    classList.add(breakpoint);
    classList.add(orientation);
    
    if (isMobile) classList.add('is-mobile');
    if (isTablet) classList.add('is-tablet');
    if (isDesktop) classList.add('is-desktop');
  }

  /**
   * Get optimal font size for current viewport
   */
  getOptimalFontSize(baseFontSize: number = 16): number {
    const { width, isSmallScreen } = this.currentViewport;
    
    if (isSmallScreen) {
      // Scale down for small screens
      return Math.max(14, baseFontSize * 0.875);
    }
    
    // Scale based on viewport width
    const scaleFactor = Math.min(1.2, width / 1200);
    return Math.round(baseFontSize * scaleFactor);
  }

  /**
   * Get optimal spacing for current viewport
   */
  getOptimalSpacing(baseSpacing: number = 16): number {
    const { isSmallScreen } = this.currentViewport;
    
    if (isSmallScreen) {
      return Math.max(8, baseSpacing * 0.75);
    }
    
    return baseSpacing;
  }

  /**
   * Check if viewport height is constrained (landscape mobile)
   */
  isHeightConstrained(): boolean {
    const { height, orientation, isMobile } = this.currentViewport;
    return isMobile && orientation === 'landscape' && height < 500;
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    if (this.orientationTimeout) {
      clearTimeout(this.orientationTimeout);
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleOrientationChange);
  }

  private handleResize = (): void => {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = window.setTimeout(() => {
      // const _previousViewport = { ...this.currentViewport };
      const previousBreakpoint = this.getCurrentBreakpoint();
      
      this.currentViewport = this.calculateViewportInfo();
      this.applyResponsiveClasses();
      
      const currentBreakpoint = this.getCurrentBreakpoint();
      
      if (this.listeners.onViewportChange) {
        this.listeners.onViewportChange(this.currentViewport);
      }
      
      if (previousBreakpoint !== currentBreakpoint && this.listeners.onBreakpointChange) {
        this.listeners.onBreakpointChange(currentBreakpoint);
      }
    }, this.config.debounceDelay);
  };

  private handleOrientationChange = (): void => {
    if (this.orientationTimeout) {
      clearTimeout(this.orientationTimeout);
    }

    // Delay to allow viewport to settle after orientation change
    this.orientationTimeout = window.setTimeout(() => {
      const previousOrientation = this.currentViewport.orientation;
      this.currentViewport = this.calculateViewportInfo();
      this.applyResponsiveClasses();
      
      if (previousOrientation !== this.currentViewport.orientation && this.listeners.onOrientationChange) {
        this.listeners.onOrientationChange(this.currentViewport.orientation);
      }
      
      if (this.listeners.onViewportChange) {
        this.listeners.onViewportChange(this.currentViewport);
      }
    }, 300); // Longer delay for orientation changes
  };

  private calculateViewportInfo(): ViewportInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;
    const orientation = width > height ? 'landscape' : 'portrait';
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    const isMobile = width < this.config.breakpoints.mobile;
    const isTablet = width >= this.config.breakpoints.mobile && width < this.config.breakpoints.desktop;
    const isDesktop = width >= this.config.breakpoints.desktop;
    const isSmallScreen = width < 480 || height < 480;

    return {
      width,
      height,
      aspectRatio,
      orientation,
      devicePixelRatio,
      isSmallScreen,
      isMobile,
      isTablet,
      isDesktop,
    };
  }

  private applyInitialStyles(): void {
    this.applyResponsiveClasses();
    
    // Set CSS custom properties for viewport info
    const root = document.documentElement;
    root.style.setProperty('--viewport-width', `${this.currentViewport.width}px`);
    root.style.setProperty('--viewport-height', `${this.currentViewport.height}px`);
    root.style.setProperty('--device-pixel-ratio', this.currentViewport.devicePixelRatio.toString());
  }
}