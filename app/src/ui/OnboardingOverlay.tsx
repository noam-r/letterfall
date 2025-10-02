import { useAppStore } from '@app/store';
import { useI18n, useTranslations } from '@shared/i18n';

export function OnboardingOverlay() {
  const showOnboarding = useAppStore((state) => state.showOnboarding);
  const dismissOnboarding = useAppStore((state) => state.dismissOnboarding);
  const t = useTranslations();
  const { isRTL } = useI18n();

  const steps = [
    {
      title: t.onboardingTitle1,
      body: t.onboardingBody1,
    },
    {
      title: t.onboardingTitle2,
      body: t.onboardingBody2,
    },
    {
      title: t.onboardingTitle3,
      body: t.onboardingBody3,
    },
  ];

  if (!showOnboarding) {
    return null;
  }

  return (
    <section className="overlay onboarding-overlay" role="dialog" aria-modal="true" aria-label={t.howToPlay}>
      <div className="onboarding-overlay__panel" dir={isRTL ? 'rtl' : 'ltr'}>
        <h2>{t.welcomeTo} {t.appTitle}</h2>
        <p>{t.tenSecondTour}</p>
        <ol>
          {steps.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
        <button type="button" onClick={dismissOnboarding}>
          {t.letsPlay}
        </button>
      </div>
    </section>
  );
}
