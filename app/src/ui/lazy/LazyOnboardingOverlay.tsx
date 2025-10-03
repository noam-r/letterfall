import { createLazyComponent, OverlayLoadingSpinner } from '@shared/lazy';

export const LazyOnboardingOverlay = createLazyComponent(
  () => import('../OnboardingOverlay').then(module => ({ default: module.OnboardingOverlay })),
  <OverlayLoadingSpinner />
);