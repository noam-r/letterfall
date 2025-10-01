import { APP_VIEW } from '@app/routes';
import { LOW_CREDIT_THRESHOLD, useAppStore } from '@app/store';

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

  const handleBack = () => {
    resetRoundState();
    setView(APP_VIEW.Start);
  };

  const lowCredit = roundPhase === 'playing' && credits <= LOW_CREDIT_THRESHOLD;
  const canPause = roundPhase === 'playing';
  const canResume = roundPhase === 'paused';

  return (
    <header className={`game-hud${lowCredit ? ' game-hud--danger' : ''}`}>
      <div className="game-hud__left">
        <button type="button" className="ghost" onClick={handleBack}>
          Back
        </button>
        <div className="game-hud__topic">
          <span className="label">Topic</span>
          <strong>{topicName ?? 'Pick a topic'}</strong>
        </div>
      </div>
      <div className="game-hud__center">
        <div>
          <span className="label">Credits</span>
          <strong>{credits}</strong>
          {lowCredit ? <span className="badge badge--warning">Low</span> : null}
        </div>
        {fairnessPulse && Date.now() - fairnessPulse < 3000 ? (
          <div className="game-hud__fairness">Nudging needed letter…</div>
        ) : null}
        <div>
          <span className="label">Difficulty</span>
          <strong>{difficulty}</strong>
        </div>
        {roundPhase !== 'playing' && roundPhase !== 'idle' ? (
          <div>
            <span className="label">Status</span>
            <strong>{roundPhase === 'won' ? 'Victory' : 'Credits depleted'}</strong>
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
          {canResume ? 'Resume' : 'Pause'}
        </button>
      </div>
    </header>
  );
}
