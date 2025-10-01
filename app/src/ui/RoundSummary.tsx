import { useEffect } from 'react';

import { APP_VIEW } from '@app/routes';
import { useAppStore } from '@app/store';
import { audioBus } from '@shared/audio';

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

  useEffect(() => {
    if (roundPhase === 'won' || roundPhase === 'lost') {
      audioBus.playSummary();
    }
  }, [roundPhase]);

  if (roundPhase !== 'won' && roundPhase !== 'lost') {
    return null;
  }

  const heading = roundPhase === 'won' ? 'Victory!' : 'Out of credits';
  const summaryText = roundPhase === 'won'
    ? 'All five words completed before the credit meter emptied.'
    : 'The credit meter hit zero. Try again with a fresh round.';
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
      <div className="round-summary__panel">
        <header className="round-summary__header">
          <span className="round-summary__badge">{roundPhase === 'won' ? 'Win' : 'Lose'}</span>
          <h2>{heading}</h2>
          <p>{summaryText}</p>
        </header>
        <div className="round-summary__meta">
          <div>
            <span className="label">Topic</span>
            <strong>{topicName ?? 'Random topic'}</strong>
          </div>
          <div>
            <span className="label">Credits remaining</span>
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
            <span className="label">Rounds played</span>
            <strong>{roundsPlayed}</strong>
          </div>
          <div>
            <span className="label">Wins</span>
            <strong>
              {wins}
              {winRate !== null ? <span className="round-summary__stat-meta">{winRate}%</span> : null}
            </strong>
          </div>
          <div>
            <span className="label">Current streak</span>
            <strong>{winStreak}</strong>
          </div>
          <div>
            <span className="label">Best credits remaining</span>
            <strong>{bestCredits}</strong>
          </div>
        </div>
        <div className="round-summary__actions">
          <button type="button" onClick={handleRestart}>
            Restart Round
          </button>
          <button type="button" className="ghost" onClick={handleChangeTopic}>
            Change Topic
          </button>
        </div>
      </div>
    </section>
  );
}
