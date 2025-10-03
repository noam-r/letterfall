import { useState, useEffect, useCallback, useRef } from 'react';
import { TouchManager, type TouchPoint, type TouchGesture } from './TouchManager';
import { ResponsiveManager, type ViewportInfo } from './ResponsiveManager';
import { DevicePerformance, type PerformanceProfile } from './DevicePerformance';

/**
 * Hook for touch gesture handling
 */
export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement>,
  options: {
    onTap?: (point: TouchPoint) => void;
    onDoubleTap?: (point: TouchPoint) => void;
    onLongPress?: (point: TouchPoint) => void;
    onSwipe?: (gesture: TouchGesture) => void;
    enabled?: boolean;
  } = {}
) {
  const touchManagerRef = useRef<TouchManager | null>(null);
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled || !elementRef.current) {
      return;
    }

    const element = elementRef.current;
    touchManagerRef.current = new TouchManager(element);
    
    touchManagerRef.current.setListeners({
      onTap: options.onTap,
      onDoubleTap: options.onDoubleTap,
      onLongPress: options.onLongPress,
      onSwipe: options.onSwipe,
    });

    return () => {
      if (touchManagerRef.current) {
        touchManagerRef.current.destroy();
        touchManagerRef.current = null;
      }
    };
  }, [elementRef, enabled, options.onTap, options.onDoubleTap, options.onLongPress, options.onSwipe]);

  const getActiveTouches = useCallback(() => {
    return touchManagerRef.current?.getActiveTouches() || [];
  }, []);

  return {
    getActiveTouches,
    isTouchDevice: TouchManager.isTouchDevice(),
    optimalTouchTargetSize: TouchManager.getOptimalTouchTargetSize(),
  };
}

/**
 * Hook for responsive design management
 */
export function useResponsive() {
  const [viewport, setViewport] = useState<ViewportInfo | null>(null);
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const managerRef = useRef<ResponsiveManager | null>(null);

  useEffect(() => {
    managerRef.current = new ResponsiveManager();
    
    setViewport(managerRef.current.getViewportInfo());
    setBreakpoint(managerRef.current.getCurrentBreakpoint());

    managerRef.current.setListeners({
      onViewportChange: setViewport,
      onBreakpointChange: setBreakpoint,
    });

    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
      }
    };
  }, []);

  const lockOrientation = useCallback(async (orientation: 'portrait' | 'landscape') => {
    if (managerRef.current) {
      return await managerRef.current.lockOrientation(orientation);
    }
    return false;
  }, []);

  const unlockOrientation = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.unlockOrientation();
    }
  }, []);

  const getSafeAreaInsets = useCallback(() => {
    return managerRef.current?.getSafeAreaInsets() || { top: 0, right: 0, bottom: 0, left: 0 };
  }, []);

  const getOptimalFontSize = useCallback((baseFontSize?: number) => {
    return managerRef.current?.getOptimalFontSize(baseFontSize) || 16;
  }, []);

  const getOptimalSpacing = useCallback((baseSpacing?: number) => {
    return managerRef.current?.getOptimalSpacing(baseSpacing) || 16;
  }, []);

  return {
    viewport,
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isHeightConstrained: managerRef.current?.isHeightConstrained() || false,
    lockOrientation,
    unlockOrientation,
    getSafeAreaInsets,
    getOptimalFontSize,
    getOptimalSpacing,
  };
}

/**
 * Hook for device performance detection and optimization
 */
export function useDevicePerformance() {
  const [profile, setProfile] = useState<PerformanceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const devicePerformance = DevicePerformance.getInstance();
    
    // Check for cached profile first
    const cached = devicePerformance.getCachedProfile();
    if (cached) {
      setProfile(cached);
      setIsLoading(false);
      return;
    }

    // Run performance detection
    devicePerformance.getPerformanceProfile()
      .then((detectedProfile) => {
        setProfile(detectedProfile);
        setIsLoading(false);
      })
      .catch((error) => {
        console.warn('Failed to detect device performance:', error);
        // Fallback to medium performance
        setProfile({
          level: 'medium',
          score: 50,
          capabilities: {
            memory: 4,
            cores: 2,
            gpu: 'unknown',
            maxTouchPoints: 0,
            connectionType: 'unknown',
          },
          recommendations: {
            maxParticles: 100,
            targetFPS: 45,
            enableShadows: false,
            enableBloom: true,
            textureQuality: 'medium',
            audioQuality: 'standard',
          },
        });
        setIsLoading(false);
      });
  }, []);

  const applyPerformanceOptimizations = useCallback(() => {
    if (!profile) return;

    const { level, recommendations } = profile;
    const root = document.documentElement;

    // Apply CSS classes for performance level
    root.classList.remove('low-performance', 'medium-performance', 'high-performance');
    root.classList.add(`${level}-performance`);

    // Set CSS custom properties for dynamic adjustments
    root.style.setProperty('--max-particles', recommendations.maxParticles.toString());
    root.style.setProperty('--target-fps', recommendations.targetFPS.toString());
    root.style.setProperty('--enable-shadows', recommendations.enableShadows ? '1' : '0');
    root.style.setProperty('--enable-bloom', recommendations.enableBloom ? '1' : '0');

    // Apply battery saving mode if needed
    if (profile.capabilities.batteryLevel !== undefined && 
        profile.capabilities.batteryLevel < 0.2 && 
        !profile.capabilities.isCharging) {
      root.classList.add('battery-saver');
    } else {
      root.classList.remove('battery-saver');
    }

    // Apply network-aware optimizations
    const connectionType = profile.capabilities.connectionType;
    if (connectionType === 'slow-2g' || connectionType === '2g') {
      root.classList.add('slow-connection');
    } else {
      root.classList.remove('slow-connection');
    }
  }, [profile]);

  useEffect(() => {
    applyPerformanceOptimizations();
  }, [applyPerformanceOptimizations]);

  return {
    profile,
    isLoading,
    isLowPerformance: profile?.level === 'low',
    isMediumPerformance: profile?.level === 'medium',
    isHighPerformance: profile?.level === 'high',
    recommendations: profile?.recommendations,
    applyPerformanceOptimizations,
  };
}

/**
 * Hook for haptic feedback (if supported)
 */
export function useHapticFeedback() {
  const isSupported = 'vibrate' in navigator;

  const vibrate = useCallback((pattern: number | number[]) => {
    if (isSupported && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [isSupported]);

  const lightTap = useCallback(() => {
    vibrate(10);
  }, [vibrate]);

  const mediumTap = useCallback(() => {
    vibrate(25);
  }, [vibrate]);

  const heavyTap = useCallback(() => {
    vibrate(50);
  }, [vibrate]);

  const success = useCallback(() => {
    vibrate([10, 50, 10]);
  }, [vibrate]);

  const error = useCallback(() => {
    vibrate([50, 100, 50]);
  }, [vibrate]);

  return {
    isSupported,
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    success,
    error,
  };
}

/**
 * Hook for orientation management
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  const lockOrientation = useCallback(async (targetOrientation: 'portrait' | 'landscape') => {
    if (!screen.orientation) {
      return false;
    }

    try {
      if ('lock' in screen.orientation) {
        await (screen.orientation as any).lock(
          targetOrientation === 'portrait' ? 'portrait-primary' : 'landscape-primary'
        );
      }
      setIsLocked(true);
      return true;
    } catch (error) {
      console.warn('Failed to lock orientation:', error);
      return false;
    }
  }, []);

  const unlockOrientation = useCallback(() => {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
      setIsLocked(false);
    }
  }, []);

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isLocked,
    lockOrientation,
    unlockOrientation,
    canLock: !!screen.orientation,
  };
}

/**
 * Hook for mobile-specific game optimizations
 */
export function useMobileGameOptimizations() {
  const { profile } = useDevicePerformance();
  const { viewport } = useResponsive();
  const { vibrate } = useHapticFeedback();

  const getOptimalSettings = useCallback(() => {
    if (!profile || !viewport) {
      return null;
    }

    const { recommendations } = profile;
    const { isMobile, isSmallScreen } = viewport;

    return {
      // Visual settings
      particleCount: isMobile ? Math.floor(recommendations.maxParticles * 0.7) : recommendations.maxParticles,
      targetFPS: isMobile ? Math.min(recommendations.targetFPS, 45) : recommendations.targetFPS,
      enableEffects: !isSmallScreen && recommendations.enableBloom,
      
      // Audio settings
      audioQuality: recommendations.audioQuality,
      
      // UI settings
      fontSize: isSmallScreen ? 14 : 16,
      touchTargetSize: isSmallScreen ? 48 : 44,
      
      // Performance settings
      enableHaptics: isMobile,
      reduceAnimations: profile.level === 'low' || isSmallScreen,
    };
  }, [profile, viewport]);

  const provideFeedback = useCallback((type: 'success' | 'error' | 'tap') => {
    switch (type) {
      case 'success':
        vibrate([10, 50, 10]);
        break;
      case 'error':
        vibrate([50, 100, 50]);
        break;
      case 'tap':
        vibrate(10);
        break;
    }
  }, [vibrate]);

  return {
    getOptimalSettings,
    provideFeedback,
    isOptimizationReady: !!profile && !!viewport,
  };
}