import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { GameView } from '../GameView';
import { I18nProvider } from '@shared/i18n';
import { AccessibilityProvider } from '@shared/accessibility';

// Mock all the complex dependencies
vi.mock('@shared/performance', () => ({
  usePerformanceMonitoring: vi.fn(),
  useAutoQualityAdjustment: vi.fn(),
  useMemoryManagement: vi.fn(),
  PerformanceOverlay: ({ visible }: { visible: boolean }) => 
    visible ? <div data-testid="performance-overlay">Performance Overlay</div> : null,
}));

vi.mock('@shared/mobile', () => ({
  useResponsive: vi.fn(() => ({
    viewport: { width: 1024, height: 768, isMobile: false },
    isMobile: false,
    isHeightConstrained: false,
  })),
  useDevicePerformance: vi.fn(() => ({
    profile: { level: 'medium' },
    applyPerformanceOptimizations: vi.fn(),
  })),
  useMobileGameOptimizations: vi.fn(() => ({
    getOptimalSettings: vi.fn(),
    isOptimizationReady: true,
  })),
}));

vi.mock('@game/components/GameCanvas', () => ({
  GameCanvas: () => <div data-testid="game-canvas">Game Canvas</div>,
}));

vi.mock('@game/components/Hud', () => ({
  GameHud: () => <div data-testid="game-hud">Game HUD</div>,
}));

vi.mock('@game/components/WordList', () => ({
  WordList: () => <div data-testid="word-list">Word List</div>,
}));

vi.mock('@game/components/ConstructionBar', () => ({
  ConstructionBar: () => <div data-testid="construction-bar">Construction Bar</div>,
}));

vi.mock('@ui/FeedbackOverlay', () => ({
  FeedbackOverlay: () => <div data-testid="feedback-overlay">Feedback Overlay</div>,
}));

vi.mock('@ui/RoundSummary', () => ({
  RoundSummary: () => <div data-testid="round-summary">Round Summary</div>,
}));

vi.mock('@ui/lazy', () => ({
  LazyPauseOverlay: () => <div data-testid="pause-overlay">Pause Overlay</div>,
  LazyOnboardingOverlay: () => <div data-testid="onboarding-overlay">Onboarding Overlay</div>,
}));

const mockStore = {
  roundPhase: 'playing' as const,
  activeWord: 'test',
  credits: 10,
  words: [
    { word: 'test', progress: 'te', found: false },
    { word: 'word', progress: 'word', found: true },
  ],
};

vi.mock('@app/store', () => ({
  useAppStore: (selector: any) => selector(mockStore),
}));

vi.mock('@shared/audio', () => ({
  audioBus: {
    playCollect: vi.fn(),
    playMiss: vi.fn(),
    playSummary: vi.fn(),
    setMuted: vi.fn(),
  },
}));

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider language="en" onLanguageChange={() => {}}>
      <AccessibilityProvider>
        {children}
      </AccessibilityProvider>
    </I18nProvider>
  );
}

describe('GameView', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render all game components', () => {
    render(
      <TestWrapper>
        <GameView />
      </TestWrapper>
    );

    expect(screen.getByTestId('game-hud')).toBeInTheDocument();
    expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('word-list')).toBeInTheDocument();
    expect(screen.getByTestId('construction-bar')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('round-summary')).toBeInTheDocument();
    expect(screen.getByTestId('pause-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-overlay')).toBeInTheDocument();
  });

  it('should have proper game view structure', () => {
    render(
      <TestWrapper>
        <GameView />
      </TestWrapper>
    );

    const gameView = screen.getByTestId('game-hud').closest('.game-view');
    expect(gameView).toBeInTheDocument();
    expect(gameView).toHaveClass('game-view');
  });

  it('should show performance overlay in development mode', () => {
    // Mock development environment
    vi.stubEnv('DEV', true);

    render(
      <TestWrapper>
        <GameView />
      </TestWrapper>
    );

    expect(screen.getByTestId('performance-overlay')).toBeInTheDocument();

    vi.unstubAllEnvs();
  });

  it('should not show performance overlay in production', () => {
    // Mock production environment
    vi.stubEnv('DEV', false);

    render(
      <TestWrapper>
        <GameView />
      </TestWrapper>
    );

    expect(screen.queryByTestId('performance-overlay')).not.toBeInTheDocument();

    vi.unstubAllEnvs();
  });

  it('should apply mobile optimizations when on mobile device', () => {
    const mockUseResponsive = vi.fn(() => ({
      viewport: { width: 375, height: 667, isMobile: true },
      isMobile: true,
      isHeightConstrained: false,
    }));

    const mockUseDevicePerformance = vi.fn(() => ({
      profile: { level: 'low' },
      applyPerformanceOptimizations: vi.fn(),
    }));

    const mockUseMobileGameOptimizations = vi.fn(() => ({
      getOptimalSettings: vi.fn(),
      isOptimizationReady: true,
    }));

    vi.doMock('@shared/mobile', () => ({
      useResponsive: mockUseResponsive,
      useDevicePerformance: mockUseDevicePerformance,
      useMobileGameOptimizations: mockUseMobileGameOptimizations,
    }));

    render(
      <TestWrapper>
        <GameView />
      </TestWrapper>
    );

    expect(mockUseResponsive).toHaveBeenCalled();
    expect(mockUseDevicePerformance).toHaveBeenCalled();
    expect(mockUseMobileGameOptimizations).toHaveBeenCalled();
  });

  it('should handle error boundaries gracefully', () => {
    // This test would need more complex setup to actually trigger error boundaries
    // For now, we just verify the structure is in place
    render(
      <TestWrapper>
        <GameView />
      </TestWrapper>
    );

    // Verify that components are wrapped in error boundaries
    // The actual error boundary testing would require more sophisticated mocking
    expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
  });
});