import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { StartScreen } from '../StartScreen';
import { I18nProvider } from '@shared/i18n';
import { AccessibilityProvider } from '@shared/accessibility';

const mockTopics = [
  { id: 'topic1', name: 'Test Topic 1', words: ['word1', 'word2'] },
  { id: 'topic2', name: 'Test Topic 2', words: ['word3', 'word4'] },
];

const mockStore = {
  setView: vi.fn(),
  muted: false,
  toggleMute: vi.fn(),
  startRound: vi.fn(),
  lastSessions: [
    {
      id: 'session1',
      topicName: 'Test Topic',
      result: 'won' as const,
      creditsRemaining: 5,
      completedAt: Date.now() - 1000000,
    },
  ],
  selectedTopicId: 'topic1',
  language: 'en' as const,
};

vi.mock('@app/store', () => ({
  useAppStore: (selector: any) => selector(mockStore),
  APP_VIEW: {
    Start: 'start',
    Playing: 'playing',
    Settings: 'settings',
    Help: 'help',
    About: 'about',
  },
}));

vi.mock('@data/topics', () => ({
  listTopics: vi.fn(() => mockTopics),
  getTopicById: vi.fn((id: string) => mockTopics.find(t => t.id === id)),
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

describe('StartScreen', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render main elements', () => {
    render(
      <TestWrapper>
        <StartScreen />
      </TestWrapper>
    );

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /help/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about/i })).toBeInTheDocument();
  });

  it('should show selected topic information', () => {
    render(
      <TestWrapper>
        <StartScreen />
      </TestWrapper>
    );

    expect(screen.getByText(/test topic 1/i)).toBeInTheDocument();
  });

  it('should handle start button click', () => {
    render(
      <TestWrapper>
        <StartScreen />
      </TestWrapper>
    );

    const startButton = screen.getByRole('button', { name: /start/i });
    fireEvent.click(startButton);

    expect(mockStore.startRound).toHaveBeenCalledWith({
      id: 'topic1',
      name: 'Test Topic 1',
      words: ['word1', 'word2'],
    });
  });

  it('should handle settings button click', () => {
    render(
      <TestWrapper>
        <StartScreen />
      </TestWrapper>
    );

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);

    expect(mockStore.setView).toHaveBeenCalledWith('settings');
  });

  it('should handle help button click', () => {
    render(
      <TestWrapper>
        <StartScreen />
      </TestWrapper>
    );

    const helpButton = screen.getByRole('button', { name: /help/i });
    fireEvent.click(helpButton);

    expect(mockStore.setView).toHaveBeenCalledWith('help');
  });

  it('should handle about button click', () => {
    render(
      <TestWrapper>
        <StartScreen />
      </TestWrapper>
    );

    const aboutButton = screen.getByRole('button', { name: /about/i });
    fireEvent.click(aboutButton);

    expect(mockStore.setView).toHaveBeenCalledWith('about');
  });

  it('should handle mute toggle', () => {
    render(
      <TestWrapper>
        <StartScreen />
      </TestWrapper>
    );

    const muteButton = screen.getByRole('button', { name: /mute/i });
    fireEvent.click(muteButton);

    expect(mockStore.toggleMute).toHaveBeenCalled();
  });

  it('should show recent sessions when available', () => {
    render(
      <TestWrapper>
        <StartScreen />
      </TestWrapper>
    );

    expect(screen.getByText(/recent sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/test topic/i)).toBeInTheDocument();
    expect(screen.getByText(/won/i)).toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    render(
      <TestWrapper>
        <StartScreen />
      </TestWrapper>
    );

    const startButton = screen.getByRole('button', { name: /start/i });
    
    // Simulate Enter key press on the document (global keyboard handler)
    fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });
    
    expect(mockStore.startRound).toHaveBeenCalled();
  });

  it('should have proper ARIA labels', () => {
    render(
      <TestWrapper>
        <StartScreen />
      </TestWrapper>
    );

    const startButton = screen.getByRole('button', { name: /start/i });
    expect(startButton).toHaveAttribute('aria-label');
    expect(startButton).toHaveAttribute('aria-keyshortcuts', 'Enter');

    const muteButton = screen.getByRole('button', { name: /mute/i });
    expect(muteButton).toHaveAttribute('aria-pressed');
  });

  it('should show random topic when no topic selected', () => {
    // Temporarily override the mock
    const originalMock = vi.mocked(require('@app/store').useAppStore);
    vi.mocked(require('@app/store').useAppStore).mockImplementation((selector: any) => 
      selector({
        ...mockStore,
        selectedTopicId: null,
      })
    );

    render(
      <TestWrapper>
        <StartScreen />
      </TestWrapper>
    );

    expect(screen.getByText(/random/i)).toBeInTheDocument();
    
    // Restore original mock
    vi.mocked(require('@app/store').useAppStore).mockImplementation(originalMock);
  });

  it('should handle empty topics list gracefully', () => {
    // Temporarily override the topics mock
    const originalTopicsMock = vi.mocked(require('@data/topics').listTopics);
    vi.mocked(require('@data/topics').listTopics).mockReturnValue([]);

    render(
      <TestWrapper>
        <StartScreen />
      </TestWrapper>
    );

    const startButton = screen.getByRole('button', { name: /start/i });
    fireEvent.click(startButton);
    
    // Restore original mock
    vi.mocked(require('@data/topics').listTopics).mockImplementation(originalTopicsMock);

    // Should not crash and not call startRound with invalid data
    expect(mockStore.startRound).not.toHaveBeenCalled();
  });
});