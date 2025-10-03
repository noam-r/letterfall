import { useState, useEffect, useCallback, useRef } from 'react';
import { ResourceLoader, type ResourceMetadata, type LoadingProgress } from './ResourceLoader';
import { PreloadManager } from './PreloadManager';

// Global instances
let globalResourceLoader: ResourceLoader | null = null;
let globalPreloadManager: PreloadManager | null = null;

function getResourceLoader(): ResourceLoader {
  if (!globalResourceLoader) {
    globalResourceLoader = new ResourceLoader();
  }
  return globalResourceLoader;
}

function getPreloadManager(): PreloadManager {
  if (!globalPreloadManager) {
    globalPreloadManager = new PreloadManager(getResourceLoader());
  }
  return globalPreloadManager;
}

export interface UseResourceLoaderResult {
  loadResource: <T = any>(resource: ResourceMetadata) => Promise<T>;
  loadResources: (resources: ResourceMetadata[]) => Promise<Map<string, any>>;
  isLoading: boolean;
  progress: LoadingProgress | null;
  error: Error | null;
  abort: () => void;
  clearCache: () => void;
}

/**
 * Hook for loading resources with progress tracking
 */
export function useResourceLoader(): UseResourceLoaderResult {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<LoadingProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const loaderRef = useRef<ResourceLoader | null>(null);

  useEffect(() => {
    loaderRef.current = getResourceLoader();
  }, []);

  const loadResource = useCallback(async <T = any>(resource: ResourceMetadata): Promise<T> => {
    if (!loaderRef.current) {
      throw new Error('ResourceLoader not initialized');
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await loaderRef.current.loadResource<T>(resource);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadResources = useCallback(async (resources: ResourceMetadata[]): Promise<Map<string, any>> => {
    if (!loaderRef.current) {
      throw new Error('ResourceLoader not initialized');
    }

    setError(null);
    setIsLoading(true);
    setProgress({ loaded: 0, total: resources.length, percentage: 0 });

    try {
      const result = await loaderRef.current.loadResources(resources);
      setProgress({ loaded: resources.length, total: resources.length, percentage: 100 });
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(null), 1000); // Clear progress after delay
    }
  }, []);

  const abort = useCallback(() => {
    if (loaderRef.current) {
      loaderRef.current.abort();
      setIsLoading(false);
      setProgress(null);
    }
  }, []);

  const clearCache = useCallback(() => {
    if (loaderRef.current) {
      loaderRef.current.clearCache();
    }
  }, []);

  return {
    loadResource,
    loadResources,
    isLoading,
    progress,
    error,
    abort,
    clearCache,
  };
}

export interface UsePreloadManagerResult {
  preloadTopic: (topicId: string) => Promise<void>;
  preloadBasedOnBehavior: () => Promise<void>;
  updateUserBehavior: (data: any) => void;
  getPreloadStats: () => any;
  clearPreloadCache: () => void;
}

/**
 * Hook for intelligent preloading based on user behavior
 */
export function usePreloadManager(): UsePreloadManagerResult {
  const managerRef = useRef<PreloadManager | null>(null);

  useEffect(() => {
    managerRef.current = getPreloadManager();
  }, []);

  const preloadTopic = useCallback(async (topicId: string): Promise<void> => {
    if (!managerRef.current) {
      throw new Error('PreloadManager not initialized');
    }
    return managerRef.current.preloadTopic(topicId);
  }, []);

  const preloadBasedOnBehavior = useCallback(async (): Promise<void> => {
    if (!managerRef.current) {
      throw new Error('PreloadManager not initialized');
    }
    return managerRef.current.preloadBasedOnBehavior();
  }, []);

  const updateUserBehavior = useCallback((data: any): void => {
    if (!managerRef.current) {
      return;
    }
    managerRef.current.updateUserBehavior(data);
  }, []);

  const getPreloadStats = useCallback(() => {
    if (!managerRef.current) {
      return null;
    }
    return managerRef.current.getPreloadStats();
  }, []);

  const clearPreloadCache = useCallback((): void => {
    if (!managerRef.current) {
      return;
    }
    managerRef.current.clearPreloadCache();
  }, []);

  return {
    preloadTopic,
    preloadBasedOnBehavior,
    updateUserBehavior,
    getPreloadStats,
    clearPreloadCache,
  };
}

/**
 * Hook for managing loading states across the application
 */
export function useLoadingState() {
  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingProgress>>(new Map());

  const setLoadingProgress = useCallback((key: string, progress: LoadingProgress) => {
    setLoadingStates(prev => new Map(prev).set(key, progress));
  }, []);

  const clearLoadingProgress = useCallback((key: string) => {
    setLoadingStates(prev => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const getLoadingProgress = useCallback((key: string): LoadingProgress | undefined => {
    return loadingStates.get(key);
  }, [loadingStates]);

  const isAnyLoading = loadingStates.size > 0;
  const totalProgress = Array.from(loadingStates.values()).reduce(
    (acc, progress) => ({
      loaded: acc.loaded + progress.loaded,
      total: acc.total + progress.total,
      percentage: 0, // Will be calculated below
    }),
    { loaded: 0, total: 0, percentage: 0 }
  );

  if (totalProgress.total > 0) {
    totalProgress.percentage = Math.round((totalProgress.loaded / totalProgress.total) * 100);
  }

  return {
    setLoadingProgress,
    clearLoadingProgress,
    getLoadingProgress,
    isAnyLoading,
    totalProgress: totalProgress.total > 0 ? totalProgress : null,
    activeLoadingCount: loadingStates.size,
  };
}

/**
 * Hook for preloading resources when component mounts
 */
export function usePreloadResources(resources: ResourceMetadata[], enabled = true) {
  const { loadResources, isLoading, error } = useResourceLoader();
  const [preloaded, setPreloaded] = useState(false);

  useEffect(() => {
    if (!enabled || preloaded || resources.length === 0) {
      return;
    }

    loadResources(resources)
      .then(() => {
        setPreloaded(true);
      })
      .catch((err) => {
        console.warn('Failed to preload resources:', err);
      });
  }, [enabled, preloaded, resources, loadResources]);

  return {
    isPreloading: isLoading,
    preloaded,
    error,
  };
}