import { useEffect } from 'react';

import { APP_VIEW } from '@app/routes';
import { useAppStore } from '@app/store';
import { audioBus } from '@shared/audio';
import { useI18n, useTranslations } from '@shared/i18n';

export function RoundSummary() {
  const roundPhase = useAppStore((state) => state.roundPhase);
  const topicName = useAppStore((state) => state.topicName);
  const credits = useAppStore((state) => state.credits);
  const words = useAppStore((state) => state.words);
  const roundsPlayed = useAppStore((state) => state.roundsPlayed);
  const wins = useAppStore((state) => state.wins);
  const winStreak = useAppStore((state) => state.winStreak);
  const bestCredits = useAppStore((state) => state.bestCredits);
  const restartRound = useAppStore((state) => state.restartRound);
  const resetRoundState = useAppStore((state) => state.resetRoundState);
  const setView = useAppStore((state) => state.setView);
  const t = useTranslations();
  const { isRTL } = useI18n();

  useEffect(() => {
    if (roundPhase === 'won' || roundPhase === 'lost') {
      audioBus.playSummary();
    }
  }, [roundPhase]);

  if (roundPhase !== 'won' && roundPhase !== 'lost') {
    return null;
  }

  const heading = roundPhase === 'won' ? `${t.victory}!` : t.outOfCredits;
  const summaryText = roundPhase === 'won' ? t.victoryMessage : t.lossMessage;
  const badgeLabel = roundPhase === 'won' ? t.victory : t.outOfCredits;
  const winRate = roundsPlayed > 0 ? Math.round((wins / roundsPlayed) * 100) : null;

  const handleRestart = () => {
    restartRound();
  };

  const handleChangeTopic = () => {
    resetRoundState();
    setView(APP_VIEW.Start);
  };

  return (
    <section className="overlay round-summary">
      <div className="round-summary__panel" dir={isRTL ? 'rtl' : 'ltr'}>
        <header className="round-summary__header">
          <span className="round-summary__badge">{badgeLabel}</span>
          <h2>{heading}</h2>
          <p>{summaryText}</p>
        </header>
        <div className="round-summary__meta">
          <div>
            <span className="label">{t.topic}</span>
            <strong>{topicName ?? t.randomTopic}</strong>
          </div>
          <div>
            <span className="label">{t.credits}</span>
            <strong>{credits}</strong>
          </div>
        </div>
        <div className="round-summary__words">
          {words.map((entry) => (
            <div
              key={entry.word}
              className={`round-summary__word ${entry.found ? 'round-summary__word--found' : ''}`}
            >
              <span>{entry.word}</span>
              <span className="round-summary__word-status">{entry.found ? '✓' : entry.progress || '—'}</span>
            </div>
          ))}
        </div>
        <div className="round-summary__stats">
          <div>
            <span className="label">{t.roundsPlayed}</span>
            <strong>{roundsPlayed}</strong>
          </div>
          <div>
            <span className="label">{t.wins}</span>
            <strong>
              {wins}
              {winRate !== null ? <span className="round-summary__stat-meta">{winRate}%</span> : null}
            </strong>
          </div>
          <div>
            <span className="label">{t.currentStreak}</span>
            <strong>{winStreak}</strong>
          </div>
          <div>
            <span className="label">{t.bestCreditsRemaining}</span>
            <strong>{bestCredits}</strong>
          </div>
        </div>
        <div className="round-summary__actions">
          <button type="button" onClick={handleRestart}>
            {t.restartRound}
          </button>
          <button type="button" className="ghost" onClick={handleChangeTopic}>
            {t.changeTopic}
          </button>
        </div>
      </div>
    </section>
  );
}
