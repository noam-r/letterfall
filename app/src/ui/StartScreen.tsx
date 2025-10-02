import { useCallback, useMemo } from 'react';

import { APP_VIEW } from '@app/routes';
import { useAppStore } from '@app/store';
import { getTopicById, listTopics } from '@data/topics';
import { useI18n, useTranslations } from '@shared/i18n';

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

  return (
    <div className="start-screen">
      <div className="start-screen__panel" dir={isRTL ? 'rtl' : 'ltr'}>
        <header className="start-screen__header">
          <h1>{t.appTitle}</h1>
          <p>{t.appSubtitle}</p>
        </header>
        <div className="start-screen__actions">
          <button type="button" className="start-screen__primary" onClick={handleStart}>
            {startLabel}
          </button>
          <div className="start-screen__meta" aria-live="polite">
            <span>{t.selectedTopic}: {topicDescription}</span>
          </div>
          <div className="start-screen__secondary">
            <button type="button" onClick={openSettings}>
              {t.settings}
            </button>
            <button type="button" onClick={openHelp}>
              {t.help}
            </button>
            <button type="button" onClick={openAbout}>
              {t.about}
            </button>
          </div>
        </div>
        <div className="start-screen__footer">
          <button type="button" className="start-screen__mute" onClick={toggleMute}>
            {muted ? t.unmute : t.mute}
          </button>
        </div>
        {recentSessions.length > 0 && (
          <section className="start-screen__history" aria-label={t.recentSessions}>
            <h2>{t.recentSessions}</h2>
            <ul className="start-screen__history-list">
              {recentSessions.map((session) => {
                const label = session.topicName ?? t.randomTopic;
                const resultLabel = session.result === 'won' ? t.won : t.lost;
                const timestamp = new Date(session.completedAt).toLocaleString();
                return (
                  <li key={session.id}>
                    <div className={`start-screen__history-pill start-screen__history-pill--${session.result}`}>
                      <div className="start-screen__history-topic">
                        <strong>{label}</strong>
                        <span>{resultLabel}</span>
                      </div>
                      <div className="start-screen__history-meta">
                        <span>{session.creditsRemaining} {t.creditsLeft}</span>
                        <span>{timestamp}</span>
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
