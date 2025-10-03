import React from 'react';
import { GameCanvas } from '@game/components/GameCanvas';
import { ConstructionBar } from '@game/components/ConstructionBar';
import { GameHud } from '@game/components/Hud';
import { WordList } from '@game/components/WordList';
import { FeedbackOverlay } from '@ui/FeedbackOverlay';
import { RoundSummary } from '@ui/RoundSummary';
import { LazyPauseOverlay, LazyOnboardingOverlay } from '@ui/lazy';
// Performance monitoring removed for production
import { ErrorBoundary, errorReporter } from '@shared/error';
import { useTranslations } from '@shared/i18n';
import { useGameStateAnnouncements, useFocusManagement, useReducedMotionManager } from '@shared/accessibility';
import { useResponsive, useDevicePerformance, useMobileGameOptimizations } from '@shared/mobile';
import { useAppStore } from '@app/store';

function GameCanvasFallback() {
  const t = useTranslations();

  return (
    <div className="game-canvas-error">
      <h3>{t.gameError?.canvasTitle || 'Game Rendering Error'}</h3>
      <p>{t.gameError?.canvasMessage || 'Unable to initialize the game renderer. Please try refreshing the page or check your browser compatibility.'}</p>
      <button
        onClick={() => window.location.reload()}
        className="game-canvas-error__reload"
      >
        {t.gameError?.reload || 'Reload Game'}
      </button>
    </div>
  );
}

export function GameView() {
  // Get game state for accessibility announcements
  const roundPhase = useAppStore((state) => state.roundPhase);
  const activeWord = useAppStore((state) => state.activeWord);
  const credits = useAppStore((state) => state.credits);
  const words = useAppStore((state) => state.words);

  // Enable accessibility features
  useGameStateAnnouncements({
    roundPhase,
    activeWord,
    credits,
    wordsCompleted: words.filter(w => w.found).length,
    totalWords: words.length,
  });

  useFocusManagement();

  // Mobile and responsive optimizations
  const { viewport: _viewport, isMobile, isHeightConstrained } = useResponsive();
  const { profile: _profile, applyPerformanceOptimizations } = useDevicePerformance();
  const { getOptimalSettings: _getOptimalSettings, isOptimizationReady } = useMobileGameOptimizations();

  // Reduced motion accessibility
  const { isEnabled: isReducedMotionEnabled, gameSettings: reducedMotionSettings } = useReducedMotionManager();

  // Apply mobile optimizations when ready
  React.useEffect(() => {
    if (isOptimizationReady) {
      applyPerformanceOptimizations();

      // Apply mobile-specific CSS class
      if (isMobile) {
        document.documentElement.classList.add('mobile');
      } else {
        document.documentElement.classList.remove('mobile');
      }

      // Apply height-constrained class for landscape mobile
      if (isHeightConstrained) {
        document.documentElement.classList.add('height-constrained');
      } else {
        document.documentElement.classList.remove('height-constrained');
      }

      // Apply reduced motion settings
      if (isReducedMotionEnabled && reducedMotionSettings) {
        document.documentElement.style.setProperty('--letter-fall-speed', reducedMotionSettings.letterFallSpeed.toString());
        document.documentElement.style.setProperty('--particle-count', reducedMotionSettings.particleCount.toString());
        document.documentElement.style.setProperty('--animation-duration', `${reducedMotionSettings.animationDuration}ms`);
      }
    }
  }, [isOptimizationReady, applyPerformanceOptimizations, isMobile, isHeightConstrained, isReducedMotionEnabled, reducedMotionSettings]);

  return (
    <div className="game-view">
      <ErrorBoundary
        fallback={(_error, _errorId, _retry) => <GameCanvasFallback />}
        onError={(error, errorInfo, errorId) => {
          errorReporter.reportError(error, {
            component: 'GameView',
            action: 'game_render',
            additionalData: { errorInfo, errorId }
          });
        }}
      >
        <GameHud />
        <div className="game-view__body">
          <div className="game-view__stage">
            <ErrorBoundary
              fallback={(_error, _errorId, _retry) => <GameCanvasFallback />}
              onError={(error, errorInfo, errorId) => {
                errorReporter.reportError(error, {
                  component: 'GameCanvas',
                  action: 'canvas_render',
                  additionalData: { errorInfo, errorId }
                });
              }}
            >
              <GameCanvas />
            </ErrorBoundary>
          </div>
          <WordList />
        </div>
        <ConstructionBar />
        <FeedbackOverlay />
        <LazyOnboardingOverlay />
        <LazyPauseOverlay />
        <RoundSummary />
      </ErrorBoundary>
    </div>
  );
}
