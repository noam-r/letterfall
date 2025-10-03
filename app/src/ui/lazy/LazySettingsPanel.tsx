import { createLazyComponent, OverlayLoadingSpinner } from '@shared/lazy';

export const LazySettingsPanel = createLazyComponent(
  () => import('../SettingsPanel').then(module => ({ default: module.SettingsPanel })),
  <OverlayLoadingSpinner />
);