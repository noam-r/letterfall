import { useCallback, useMemo } from 'react';

import { APP_VIEW } from '@app/routes';
import { useAppStore } from '@app/store';
import { BUILT_IN_TOPICS, getTopicById } from '@data/topics';

function sampleRandomTopic(excludeId?: string) {
  const pool = excludeId ? BUILT_IN_TOPICS.filter((topic) => topic.id !== excludeId) : BUILT_IN_TOPICS;
  const source = pool.length > 0 ? pool : BUILT_IN_TOPICS;
  return source[Math.floor(Math.random() * source.length)];
}

export function StartScreen() {
  const setView = useAppStore((state) => state.setView);
  const muted = useAppStore((state) => state.muted);
  const toggleMute = useAppStore((state) => state.toggleMute);
  const startRound = useAppStore((state) => state.startRound);
  const lastSessions = useAppStore((state) => state.lastSessions);
  const selectedTopicId = useAppStore((state) => state.selectedTopicId);

  const selectedTopic = selectedTopicId ? getTopicById(selectedTopicId) : undefined;
  const recentSessions = useMemo(() => lastSessions.slice(0, 3), [lastSessions]);

  const handleStart = useCallback(() => {
    const topic = selectedTopic ?? sampleRandomTopic(selectedTopicId ?? undefined);
    startRound({ id: topic.id, name: topic.name, words: topic.words });
  }, [selectedTopic, selectedTopicId, startRound]);

  const openSettings = useCallback(() => {
    setView(APP_VIEW.Settings);
  }, [setView]);

  const openHelp = useCallback(() => {
    setView(APP_VIEW.Help);
  }, [setView]);

  const openAbout = useCallback(() => {
    setView(APP_VIEW.About);
  }, [setView]);

  const startLabel = selectedTopic ? `Start — ${selectedTopic.name}` : 'Start';
  const topicDescription = selectedTopic ? selectedTopic.name : 'Random (surprise me)';

  return (
    <div className="start-screen">
      <div className="start-screen__panel">
        <header className="start-screen__header">
          <h1>LetterFall</h1>
          <p>Catch falling letters, finish five topic words, and keep credits above zero.</p>
        </header>
        <div className="start-screen__actions">
          <button type="button" className="start-screen__primary" onClick={handleStart}>
            {startLabel}
          </button>
          <div className="start-screen__meta" aria-live="polite">
            <span>Selected topic: {topicDescription}</span>
          </div>
          <div className="start-screen__secondary">
            <button type="button" onClick={openSettings}>
              Settings
            </button>
            <button type="button" onClick={openHelp}>
              Help
            </button>
            <button type="button" onClick={openAbout}>
              About
            </button>
          </div>
        </div>
        <div className="start-screen__footer">
          <button type="button" className="start-screen__mute" onClick={toggleMute}>
            {muted ? 'Unmute' : 'Mute'}
          </button>
        </div>
        {recentSessions.length > 0 && (
          <section className="start-screen__history" aria-label="Recent sessions">
            <h2>Recent Sessions</h2>
            <ul className="start-screen__history-list">
              {recentSessions.map((session) => {
                const label = session.topicName ?? 'Random topic';
                const resultLabel = session.result === 'won' ? 'Won' : 'Lost';
                const timestamp = new Date(session.completedAt).toLocaleString();
                return (
                  <li key={session.id}>
                    <div className={`start-screen__history-pill start-screen__history-pill--${session.result}`}>
                      <div className="start-screen__history-topic">
                        <strong>{label}</strong>
                        <span>{resultLabel}</span>
                      </div>
                      <div className="start-screen__history-meta">
                        <span>{session.creditsRemaining} credits left</span>
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
