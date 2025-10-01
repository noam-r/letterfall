import { APP_VIEW } from '@app/routes';
import { useAppStore } from '@app/store';

export function PauseOverlay() {
  const roundPhase = useAppStore((state) => state.roundPhase);
  const resumeRound = useAppStore((state) => state.resumeRound);
  const restartRound = useAppStore((state) => state.restartRound);
  const resetRoundState = useAppStore((state) => state.resetRoundState);
  const setView = useAppStore((state) => state.setView);
  const winStreak = useAppStore((state) => state.winStreak);
  const wins = useAppStore((state) => state.wins);
  const roundsPlayed = useAppStore((state) => state.roundsPlayed);

  if (roundPhase !== 'paused') {
    return null;
  }

  const handleResume = () => {
    resumeRound();
  };

  const handleRestart = () => {
    restartRound();
  };

  const handleChangeTopic = () => {
    resetRoundState();
    setView(APP_VIEW.Start);
  };

  return (
    <section className="overlay pause-overlay" role="dialog" aria-modal="true" aria-label="Pause menu">
      <div className="pause-overlay__panel">
        <h2>Game Paused</h2>
        <p>Take a breather. Credits stay frozen while you’re paused.</p>
        <div className="pause-overlay__stats">
          <div>
            <span className="label">Current streak</span>
            <strong>{winStreak}</strong>
          </div>
          <div>
            <span className="label">Lifetime wins</span>
            <strong>{wins}</strong>
          </div>
          <div>
            <span className="label">Rounds played</span>
            <strong>{roundsPlayed}</strong>
          </div>
        </div>
        <div className="pause-overlay__actions">
          <button type="button" onClick={handleResume}>
            Resume
          </button>
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
