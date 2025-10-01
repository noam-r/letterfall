import { APP_VIEW } from '@app/routes';
import { useAppStore } from '@app/store';

export function HelpView() {
  const requestOnboarding = useAppStore((state) => state.requestOnboarding);
  const setView = useAppStore((state) => state.setView);

  return (
    <div className="help-view">
      <h2>How to Play</h2>
      <ol>
        <li>Tap Start to jump into a random topic.</li>
        <li>Choose a word in the sidebar to target it.</li>
        <li>Catch matching letters in order; missed letters drain credits.</li>
        <li>Finish five words before credits reach zero to win.</li>
      </ol>
      <p>Need a refresher?</p>
      <button type="button" className="ghost" onClick={() => { requestOnboarding(); setView(APP_VIEW.Playing); }}>
        Replay onboarding
      </button>
      <p>
        This milestone focuses on the UI shell and layout. Gameplay systems, fairness guard, audio, and
        onboarding overlays will ship in later phases described in the spec.
      </p>
      <button type="button" className="ghost" onClick={() => setView(APP_VIEW.About)}>
        Read About LetterFall
      </button>
    </div>
  );
}
