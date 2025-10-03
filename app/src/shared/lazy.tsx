import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';

/**
 * Creates a lazy-loaded component with a loading fallback
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <div className="loading-overlay">Loading...</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Loading spinner component for lazy-loaded overlays
 */
export function OverlayLoadingSpinner() {
  return (
    <div className="overlay loading-overlay" role="status" aria-label="Loading">
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    </div>
  );
}