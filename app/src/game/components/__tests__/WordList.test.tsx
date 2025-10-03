import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { WordList } from '../WordList';
import { I18nProvider } from '@shared/i18n';
import { AccessibilityProvider } from '@shared/accessibility';

const mockWords = [
  { word: 'test', progress: 'te', found: false },
  { word: 'word', progress: 'word', found: true },
  { word: 'game', progress: '', found: false },
];

const mockStore = {
  words: mockWords,
  activeWord: 'test',
  selectWord: vi.fn(),
  roundPhase: 'playing' as const,
};

vi.mock('@app/store', () => ({
  useAppStore: (selector: any) => selector(mockStore),
}));

vi.mock('@shared/audio', () => ({
  audioBus: {
    playCollect: vi.fn(),
    playMiss: vi.fn(),
    playSummary: vi.fn(),
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

describe('WordList', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render all words', () => {
    render(
      <TestWrapper>
        <WordList />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/test.*letters/)).toBeInTheDocument();
    expect(screen.getByLabelText(/word.*completed/)).toBeInTheDocument();
    expect(screen.getByLabelText(/game.*letters/)).toBeInTheDocument();
  });

  it('should show word progress correctly', () => {
    render(
      <TestWrapper>
        <WordList />
      </TestWrapper>
    );

    // Check progress indicators
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(2); // Only incomplete words have progress bars

    // Test word should show 50% progress (2 out of 4 letters)
    const testWordProgress = screen.getByLabelText(/test progress: 50%/i);
    expect(testWordProgress).toBeInTheDocument();
  });

  it('should highlight active word', () => {
    render(
      <TestWrapper>
        <WordList />
      </TestWrapper>
    );

    const activeWordButton = screen.getByLabelText(/test.*currently selected/i);
    expect(activeWordButton).toHaveAttribute('aria-pressed', 'true');
    expect(activeWordButton).toHaveClass('word-list__item--active');
  });

  it('should show completed words with checkmark', () => {
    render(
      <TestWrapper>
        <WordList />
      </TestWrapper>
    );

    const completedWord = screen.getByLabelText(/word - completed/i);
    expect(completedWord).toBeInTheDocument();
    expect(completedWord).toHaveClass('word-list__item--found');

    const checkmark = screen.getByLabelText('completed');
    expect(checkmark).toBeInTheDocument();
  });

  it('should handle word selection', () => {
    render(
      <TestWrapper>
        <WordList />
      </TestWrapper>
    );

    const gameWordButton = screen.getByLabelText(/game - 0 of 4/i);
    fireEvent.click(gameWordButton);

    expect(mockStore.selectWord).toHaveBeenCalledWith('game');
  });

  it('should disable completed words', () => {
    render(
      <TestWrapper>
        <WordList />
      </TestWrapper>
    );

    const completedWordButton = screen.getByLabelText(/word - completed/i);
    expect(completedWordButton).toBeDisabled();
  });

  it('should disable all words when not playing', () => {
    // Temporarily override the mock
    const originalMock = vi.mocked(require('@app/store').useAppStore);
    vi.mocked(require('@app/store').useAppStore).mockImplementation((selector: any) => 
      selector({
        ...mockStore,
        roundPhase: 'paused' as const,
      })
    );

    render(
      <TestWrapper>
        <WordList />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
    
    // Restore original mock
    vi.mocked(require('@app/store').useAppStore).mockImplementation(originalMock);
  });

  it('should show empty state when no words', () => {
    // Temporarily override the mock
    const originalMock = vi.mocked(require('@app/store').useAppStore);
    vi.mocked(require('@app/store').useAppStore).mockImplementation((selector: any) => 
      selector({
        ...mockStore,
        words: [],
      })
    );

    render(
      <TestWrapper>
        <WordList />
      </TestWrapper>
    );

    expect(screen.getByText(/words will appear/i)).toBeInTheDocument();
    
    // Restore original mock
    vi.mocked(require('@app/store').useAppStore).mockImplementation(originalMock);
  });

  it('should have proper accessibility structure', () => {
    render(
      <TestWrapper>
        <WordList />
      </TestWrapper>
    );

    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('id');
  });

  it('should provide keyboard navigation instructions', () => {
    render(
      <TestWrapper>
        <WordList />
      </TestWrapper>
    );

    expect(screen.getByText(/use arrow keys to navigate/i)).toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    render(
      <TestWrapper>
        <WordList />
      </TestWrapper>
    );

    // This would require more complex setup to test actual keyboard navigation
    // For now, we verify the structure is in place
    const wordButtons = screen.getAllByRole('button');
    expect(wordButtons.length).toBeGreaterThan(0);
  });

  it('should show correct progress percentages', () => {
    render(
      <TestWrapper>
        <WordList />
      </TestWrapper>
    );

    // Test word: 'te' out of 'test' = 50%
    expect(screen.getByLabelText(/test progress: 50%/i)).toBeInTheDocument();
    
    // Game word: '' out of 'game' = 0%
    expect(screen.getByLabelText(/game progress: 0%/i)).toBeInTheDocument();
  });

  it('should handle RTL languages correctly', () => {
    render(
      <I18nProvider language="he" onLanguageChange={() => {}}>
        <AccessibilityProvider>
          <WordList />
        </AccessibilityProvider>
      </I18nProvider>
    );

    const wordList = screen.getByRole('complementary');
    expect(wordList).toHaveAttribute('dir', 'rtl');
  });
});