import { APP_VIEW } from '@app/routes';
import { useAppStore } from '@app/store';
import { useI18n, useTranslations } from '@shared/i18n';

export function PauseOverlay() {
  const roundPhase = useAppStore((state) => state.roundPhase);
  const resumeRound = useAppStore((state) => state.resumeRound);
  const restartRound = useAppStore((state) => state.restartRound);
  const resetRoundState = useAppStore((state) => state.resetRoundState);
  const setView = useAppStore((state) => state.setView);
  const winStreak = useAppStore((state) => state.winStreak);
  const wins = useAppStore((state) => state.wins);
  const roundsPlayed = useAppStore((state) => state.roundsPlayed);
  const t = useTranslations();
  const { isRTL } = useI18n();

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
    <section
      className="overlay pause-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t.gamePaused}
    >
      <div className="pause-overlay__panel" dir={isRTL ? 'rtl' : 'ltr'}>
        <h2>{t.gamePaused}</h2>
        <p>{t.pauseMessage}</p>
        <div className="pause-overlay__stats">
          <div>
            <span className="label">{t.currentStreak}</span>
            <strong>{winStreak}</strong>
          </div>
          <div>
            <span className="label">{t.lifetimeWins}</span>
            <strong>{wins}</strong>
          </div>
          <div>
            <span className="label">{t.roundsPlayed}</span>
            <strong>{roundsPlayed}</strong>
          </div>
        </div>
        <div className="pause-overlay__actions">
          <button type="button" onClick={handleResume}>
            {t.resume}
          </button>
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
