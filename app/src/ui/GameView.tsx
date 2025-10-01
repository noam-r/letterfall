import { GameCanvas } from '@game/components/GameCanvas';
import { ConstructionBar } from '@game/components/ConstructionBar';
import { GameHud } from '@game/components/Hud';
import { WordList } from '@game/components/WordList';
import { FeedbackOverlay } from '@ui/FeedbackOverlay';
import { PauseOverlay } from '@ui/PauseOverlay';
import { RoundSummary } from '@ui/RoundSummary';
import { OnboardingOverlay } from '@ui/OnboardingOverlay';

export function GameView() {
  return (
    <div className="game-view">
      <GameHud />
      <div className="game-view__body">
        <div className="game-view__stage">
          <GameCanvas />
        </div>
        <WordList />
      </div>
      <ConstructionBar />
      <FeedbackOverlay />
      <OnboardingOverlay />
      <PauseOverlay />
      <RoundSummary />
    </div>
  );
}
