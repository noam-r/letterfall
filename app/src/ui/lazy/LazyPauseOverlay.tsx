import { createLazyComponent, OverlayLoadingSpinner } from '@shared/lazy';

export const LazyPauseOverlay = createLazyComponent(
  () => import('../PauseOverlay').then(module => ({ default: module.PauseOverlay })),
  <OverlayLoadingSpinner />
);