import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AccessibilityProvider } from '../context';
import { GameHud } from '@game/components/Hud';
import { WordList } from '@game/components/WordList';
import { ConstructionBar } from '@game/components/ConstructionBar';
import { I18nProvider } from '@shared/i18n';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the app store
const mockStore = {
  topicName: 'Test Topic',
  credits: 10,
  difficulty: 'Standard' as const,
  roundPhase: 'playing' as const,
  fairnessPulse: null,
  words: [
    { word: 'test', progress: 'te', found: false },
    { word: 'word', progress: 'word', found: true },
    { word: 'game', progress: '', found: false },
  ],
  activeWord: 'test',
  construction: 'te',
  resetRoundState: () => {},
  pauseRound: () => {},
  resumeRound: () => {},
  setView: () => {},
  selectWord: () => {},
  language: 'en' as const,
};

vi.mock('@app/store', () => ({
  useAppStore: (selector: any) => selector(mockStore),
  APP_VIEW: { Start: 'start' },
  LOW_CREDIT_THRESHOLD: 20,
}));

vi.mock('@shared/audio', () => ({
  audioBus: {
    play: vi.fn(),
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

describe('Accessibility Tests', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
  });

  describe('GameHud accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <GameHud />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <GameHud />
        </TestWrapper>
      );

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByLabelText(/back to main menu/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/pause game \(space\)/i)).toBeInTheDocument();
    });

    it('should have live regions for dynamic content', () => {
      render(
        <TestWrapper>
          <GameHud />
        </TestWrapper>
      );

      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
      
      statusElements.forEach(element => {
        expect(element).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('WordList accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <WordList />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper list structure', () => {
      render(
        <TestWrapper>
          <WordList />
        </TestWrapper>
      );

      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('should have proper button labels', () => {
      render(
        <TestWrapper>
          <WordList />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should have progress bars with proper attributes', () => {
      render(
        <TestWrapper>
          <WordList />
        </TestWrapper>
      );

      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(progressBar => {
        expect(progressBar).toHaveAttribute('aria-valuenow');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it('should indicate active word state', () => {
      render(
        <TestWrapper>
          <WordList />
        </TestWrapper>
      );

      const activeButton = screen.getByLabelText(/test.*currently selected/i);
      expect(activeButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('ConstructionBar accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <ConstructionBar />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper contentinfo role', () => {
      render(
        <TestWrapper>
          <ConstructionBar />
        </TestWrapper>
      );

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should have live regions for dynamic content', () => {
      render(
        <TestWrapper>
          <ConstructionBar />
        </TestWrapper>
      );

      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
      
      statusElements.forEach(element => {
        expect(element).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have descriptive labels for construction elements', () => {
      render(
        <TestWrapper>
          <ConstructionBar />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/built:/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/letter tray:/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard navigation', () => {
    it('should have focusable elements with proper tab order', () => {
      render(
        <TestWrapper>
          <div>
            <GameHud />
            <WordList />
            <ConstructionBar />
          </div>
        </TestWrapper>
      );

      const focusableElements = screen.getAllByRole('button');
      focusableElements.forEach(element => {
        expect(element).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should have keyboard shortcuts indicated', () => {
      render(
        <TestWrapper>
          <GameHud />
        </TestWrapper>
      );

      const pauseButton = screen.getByLabelText(/pause game \(space\)/i);
      expect(pauseButton).toHaveAttribute('aria-keyshortcuts', 'Space');
    });
  });

  describe('Screen reader support', () => {
    it('should have screen reader instructions', () => {
      render(
        <TestWrapper>
          <WordList />
        </TestWrapper>
      );

      expect(screen.getByText(/use arrow keys to navigate/i)).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(
        <TestWrapper>
          <WordList />
        </TestWrapper>
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveAttribute('id');
    });
  });

  describe('Reduced motion support', () => {
    it('should respect reduced motion preferences', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <TestWrapper>
          <WordList />
        </TestWrapper>
      );

      // Check if reduced motion class is applied
      expect(document.documentElement.classList.contains('reduced-motion')).toBe(true);
    });
  });
});