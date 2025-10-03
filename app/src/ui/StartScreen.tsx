import { useCallback, useMemo } from 'react';

import { APP_VIEW } from '@app/routes';
import { useAppStore } from '@app/store';
import { getTopicById, listTopics } from '@data/topics';
import { useI18n, useTranslations } from '@shared/i18n';
import { useFocusManagement, useKeyboardHandler } from '@shared/accessibility';

export function StartScreen() {
  const setView = useAppStore((state) => state.setView);
  const muted = useAppStore((state) => state.muted);
  const toggleMute = useAppStore((state) => state.toggleMute);
  const startRound = useAppStore((state) => state.startRound);
  const lastSessions = useAppStore((state) => state.lastSessions);
  const selectedTopicId = useAppStore((state) => state.selectedTopicId);
  const language = useAppStore((state) => state.language);
  const t = useTranslations();
  const { isRTL } = useI18n();

  const topics = useMemo(() => listTopics(language), [language]);
  const selectedTopic = useMemo(
    () => (selectedTopicId ? getTopicById(selectedTopicId, language) : undefined),
    [selectedTopicId, language]
  );
  const recentSessions = useMemo(() => lastSessions.slice(0, 3), [lastSessions]);

  const pickRandomTopic = useCallback(() => {
    if (topics.length === 0) {
      return undefined;
    }
    const index = Math.floor(Math.random() * topics.length);
    return topics[index];
  }, [topics]);

  const handleStart = useCallback(() => {
    const topic = selectedTopic ?? pickRandomTopic();
    if (!topic) {
      return;
    }
    startRound({ id: topic.id, name: topic.name, words: topic.words });
  }, [selectedTopic, pickRandomTopic, startRound]);

  const openSettings = useCallback(() => {
    setView(APP_VIEW.Settings);
  }, [setView]);

  const openHelp = useCallback(() => {
    setView(APP_VIEW.Help);
  }, [setView]);

  const openAbout = useCallback(() => {
    setView(APP_VIEW.About);
  }, [setView]);

  const startLabel = selectedTopic ? t.startWithTopic(selectedTopic.name) : t.start;
  const topicDescription = selectedTopic ? selectedTopic.name : t.random;

  // Enable focus management
  useFocusManagement();

  // Add keyboard shortcut for starting the game
  useKeyboardHandler('Enter', handleStart, [handleStart]);

  return (
    <div className="start-screen">
      <div className="start-screen__panel" dir={isRTL ? 'rtl' : 'ltr'}>
        <header className="start-screen__header">
          <h1>{t.appTitle}</h1>
          <p>{t.appSubtitle}</p>
        </header>
        <main className="start-screen__actions">
          <button 
            type="button" 
            className="start-screen__primary" 
            onClick={handleStart}
            aria-label={`${startLabel} (Enter)`}
            aria-keyshortcuts="Enter"
          >
            {startLabel}
          </button>
          <div className="start-screen__meta" aria-live="polite" role="status">
            <span>{t.selectedTopic}: {topicDescription}</span>
          </div>
          <nav className="start-screen__secondary" aria-label="Main navigation">
            <button type="button" onClick={openSettings} aria-label={`Open ${t.settings}`}>
              {t.settings}
            </button>
            <button type="button" onClick={openHelp} aria-label={`Open ${t.help}`}>
              {t.help}
            </button>
            <button type="button" onClick={openAbout} aria-label={`Open ${t.about}`}>
              {t.about}
            </button>
          </nav>
        </main>
        <div className="start-screen__footer">
          <button 
            type="button" 
            className="start-screen__mute" 
            onClick={toggleMute}
            aria-label={muted ? `${t.unmute} audio` : `${t.mute} audio`}
            aria-pressed={muted}
          >
            {muted ? t.unmute : t.mute}
          </button>
        </div>
        {recentSessions.length > 0 && (
          <section className="start-screen__history" aria-labelledby="recent-sessions-heading">
            <h2 id="recent-sessions-heading">{t.recentSessions}</h2>
            <ul className="start-screen__history-list" role="list">
              {recentSessions.map((session) => {
                const label = session.topicName ?? t.randomTopic;
                const resultLabel = session.result === 'won' ? t.won : t.lost;
                const timestamp = new Date(session.completedAt).toLocaleString();
                const sessionDescription = `${label}, ${resultLabel}, ${session.creditsRemaining} credits remaining, completed ${timestamp}`;
                
                return (
                  <li key={session.id} role="listitem">
                    <div 
                      className={`start-screen__history-pill start-screen__history-pill--${session.result}`}
                      aria-label={sessionDescription}
                      role="article"
                    >
                      <div className="start-screen__history-topic">
                        <strong>{label}</strong>
                        <span aria-label={`Result: ${resultLabel}`}>{resultLabel}</span>
                      </div>
                      <div className="start-screen__history-meta">
                        <span aria-label={`Credits remaining: ${session.creditsRemaining}`}>
                          {session.creditsRemaining} {t.creditsLeft}
                        </span>
                        <span aria-label={`Completed: ${timestamp}`}>{timestamp}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
