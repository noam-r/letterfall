import { APP_VIEW } from '@app/routes';
import { LOW_CREDIT_THRESHOLD, useAppStore } from '@app/store';
import { useTranslations } from '@shared/i18n';

export function GameHud() {
  const topicName = useAppStore((state) => state.topicName);
  const credits = useAppStore((state) => state.credits);
  const difficulty = useAppStore((state) => state.difficulty);
  const roundPhase = useAppStore((state) => state.roundPhase);
  const resetRoundState = useAppStore((state) => state.resetRoundState);
  const fairnessPulse = useAppStore((state) => state.fairnessPulse);
  const pauseRound = useAppStore((state) => state.pauseRound);
  const resumeRound = useAppStore((state) => state.resumeRound);
  const setView = useAppStore((state) => state.setView);
  const t = useTranslations();

  const handleBack = () => {
    resetRoundState();
    setView(APP_VIEW.Start);
  };

  const lowCredit = roundPhase === 'playing' && credits <= LOW_CREDIT_THRESHOLD;
  const canPause = roundPhase === 'playing';
  const canResume = roundPhase === 'paused';

  const difficultyLabel =
    difficulty === 'Easy' ? t.easy : difficulty === 'Standard' ? t.standard : t.hard;

  return (
    <header className={`game-hud${lowCredit ? ' game-hud--danger' : ''}`}>
      <div className="game-hud__left">
        <button type="button" className="ghost" onClick={handleBack}>
          {t.back}
        </button>
        <div className="game-hud__topic">
          <span className="label">{t.topic}</span>
          <strong>{topicName ?? t.pickTopic}</strong>
        </div>
      </div>
      <div className="game-hud__center">
        <div>
          <span className="label">{t.credits}</span>
          <strong>{credits}</strong>
          {lowCredit ? <span className="badge badge--warning">{t.low}</span> : null}
        </div>
        {fairnessPulse && Date.now() - fairnessPulse < 3000 ? (
          <div className="game-hud__fairness">{t.nudgingNeededLetter}</div>
        ) : null}
        <div>
          <span className="label">{t.difficulty}</span>
          <strong>{difficultyLabel}</strong>
        </div>
        {roundPhase !== 'playing' && roundPhase !== 'idle' ? (
          <div>
            <span className="label">{t.status}</span>
            <strong>{roundPhase === 'won' ? t.victory : t.creditsDepleted}</strong>
          </div>
        ) : null}
      </div>
      <div className="game-hud__right">
        <button
          type="button"
          className="ghost"
          onClick={canPause ? pauseRound : canResume ? resumeRound : undefined}
          disabled={!canPause && !canResume}
        >
          {canResume ? t.resume : t.pause}
        </button>
      </div>
    </header>
  );
}
