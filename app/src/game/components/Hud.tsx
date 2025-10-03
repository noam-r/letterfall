import { APP_VIEW } from '@app/routes';
import { LOW_CREDIT_THRESHOLD, useAppStore } from '@app/store';
import { useTranslations } from '@shared/i18n';
import { useGameKeyboardControls, useAudioCues } from '@shared/accessibility';

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
  const playAudioCue = useAudioCues();

  const handleBack = () => {
    resetRoundState();
    setView(APP_VIEW.Start);
  };

  const lowCredit = roundPhase === 'playing' && credits <= LOW_CREDIT_THRESHOLD;
  const canPause = roundPhase === 'playing';
  const canResume = roundPhase === 'paused';

  const handlePause = () => {
    pauseRound();
    playAudioCue({ type: 'game_paused' });
  };

  const handleResume = () => {
    resumeRound();
    playAudioCue({ type: 'game_resumed' });
  };

  // Set up keyboard controls for pause/resume
  useGameKeyboardControls(
    canPause ? handlePause : undefined,
    canResume ? handleResume : undefined
  );

  const difficultyLabel =
    difficulty === 'Easy' ? t.easy : difficulty === 'Standard' ? t.standard : t.hard;

  return (
    <header className={`game-hud${lowCredit ? ' game-hud--danger' : ''}`} role="banner">
      <div className="game-hud__left">
        <button 
          type="button" 
          className="ghost" 
          onClick={handleBack}
          aria-label={`${t.back} to main menu`}
        >
          {t.back}
        </button>
        <div className="game-hud__topic" role="status" aria-live="polite">
          <span className="label" id="topic-label">{t.topic}</span>
          <strong aria-labelledby="topic-label">{topicName ?? t.pickTopic}</strong>
        </div>
      </div>
      <div className="game-hud__center">
        <div role="status" aria-live="polite">
          <span className="label" id="credits-label">{t.credits}</span>
          <strong aria-labelledby="credits-label">{credits}</strong>
          {lowCredit ? (
            <span className="badge badge--warning" role="alert" aria-label="Low credits warning">
              {t.low}
            </span>
          ) : null}
        </div>
        {fairnessPulse && Date.now() - fairnessPulse < 3000 ? (
          <div className="game-hud__fairness" role="alert" aria-live="assertive">
            {t.nudgingNeededLetter}
          </div>
        ) : null}
        <div>
          <span className="label" id="difficulty-label">{t.difficulty}</span>
          <strong aria-labelledby="difficulty-label">{difficultyLabel}</strong>
        </div>
        {roundPhase !== 'playing' && roundPhase !== 'idle' ? (
          <div role="status" aria-live="polite">
            <span className="label" id="status-label">{t.status}</span>
            <strong aria-labelledby="status-label">
              {roundPhase === 'won' ? t.victory : t.creditsDepleted}
            </strong>
          </div>
        ) : null}
      </div>
      <div className="game-hud__right">
        <button
          type="button"
          className="ghost"
          onClick={canPause ? handlePause : canResume ? handleResume : undefined}
          disabled={!canPause && !canResume}
          aria-label={canResume ? `${t.resume} game (Space)` : `${t.pause} game (Space)`}
          aria-keyshortcuts="Space"
        >
          {canResume ? t.resume : t.pause}
        </button>
      </div>
    </header>
  );
}
