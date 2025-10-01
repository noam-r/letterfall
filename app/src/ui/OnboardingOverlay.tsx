import { useAppStore } from '@app/store';

const steps = [
  {
    title: 'Falling Letters',
    body: 'Catch letters in the main arena. Missed letters drain credits, so move fast!',
  },
  {
    title: 'Word List',
    body: 'Tap a word on the right to target it. Progress bars show how close you are.',
  },
  {
    title: 'Construction Tray',
    body: 'The tray at the bottom shows your in-order progress and the next required letter.',
  },
];

export function OnboardingOverlay() {
  const showOnboarding = useAppStore((state) => state.showOnboarding);
  const dismissOnboarding = useAppStore((state) => state.dismissOnboarding);

  if (!showOnboarding) {
    return null;
  }

  return (
    <section className="overlay onboarding-overlay" role="dialog" aria-modal="true" aria-label="How LetterFall works">
      <div className="onboarding-overlay__panel">
        <h2>Welcome to LetterFall</h2>
        <p>Here’s a 10-second tour of the three key areas.</p>
        <ol>
          {steps.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
        <button type="button" onClick={dismissOnboarding}>
          Let’s Play
        </button>
      </div>
    </section>
  );
}
