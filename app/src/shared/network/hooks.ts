import { useState, useEffect, useCallback } from 'react';
import { OfflineManager, type NetworkStatus } from './OfflineManager';
import { CacheManager } from './CacheManager';

/**
 * Hook for network status monitoring
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [offlineQueueStatus, setOfflineQueueStatus] = useState({ count: 0 });

  useEffect(() => {
    const offlineManager = OfflineManager.getInstance();
    
    // Get initial status
    setNetworkStatus(offlineManager.getNetworkStatus());
    setOfflineQueueStatus(offlineManager.getOfflineQueueStatus());

    // Listen for changes
    const handleStatusChange = (status: NetworkStatus) => {
      setNetworkStatus(status);
      setOfflineQueueStatus(offlineManager.getOfflineQueueStatus());
    };

    offlineManager.addListener(handleStatusChange);

    // Update queue status periodically
    const interval = setInterval(() => {
      setOfflineQueueStatus(offlineManager.getOfflineQueueStatus());
    }, 5000);

    return () => {
      offlineManager.removeListener(handleStatusChange);
      clearInterval(interval);
    };
  }, []);

  const processOfflineQueue = useCallback(async () => {
    const offlineManager = OfflineManager.getInstance();
    await offlineManager.processOfflineQueue();
    setOfflineQueueStatus(offlineManager.getOfflineQueueStatus());
  }, []);

  const clearOfflineQueue = useCallback(() => {
    const offlineManager = OfflineManager.getInstance();
    offlineManager.clearOfflineQueue();
    setOfflineQueueStatus(offlineManager.getOfflineQueueStatus());
  }, []);

  return {
    networkStatus,
    isOnline: networkStatus?.isOnline ?? true,
    isSlowConnection: networkStatus ? OfflineManager.getInstance().isSlowConnection() : false,
    offlineQueueStatus,
    processOfflineQueue,
    clearOfflineQueue,
  };
}

/**
 * Hook for resilient data fetching
 */
export function useResilientFetch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async <T = any>(
    url: string, 
    options: RequestInit = {},
    useCache = true
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const offlineManager = OfflineManager.getInstance();
      
      if (useCache) {
        const cacheManager = CacheManager.getInstance();
        return await cacheManager.fetchWithCache<T>(url, options);
      } else {
        const response = await offlineManager.fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetch,
    isLoading,
    error,
  };
}

/**
 * Hook for cache management
 */
export function useCache() {
  const [cacheStats, setCacheStats] = useState<any>(null);

  const updateStats = useCallback(async () => {
    const cacheManager = CacheManager.getInstance();
    const stats = await cacheManager.getStats();
    setCacheStats(stats);
  }, []);

  useEffect(() => {
    updateStats();
    
    // Update stats periodically
    const interval = setInterval(updateStats, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [updateStats]);

  const clearCache = useCallback(async () => {
    const cacheManager = CacheManager.getInstance();
    await cacheManager.clear();
    await updateStats();
  }, [updateStats]);

  const cleanupCache = useCallback(async () => {
    const cacheManager = CacheManager.getInstance();
    await cacheManager.cleanup();
    await updateStats();
  }, [updateStats]);

  const getCachedData = useCallback(async <T = any>(key: string): Promise<T | null> => {
    const cacheManager = CacheManager.getInstance();
    return await cacheManager.get<T>(key);
  }, []);

  const setCachedData = useCallback(async (key: string, data: any): Promise<void> => {
    const cacheManager = CacheManager.getInstance();
    await cacheManager.set(key, data);
    await updateStats();
  }, [updateStats]);

  return {
    cacheStats,
    clearCache,
    cleanupCache,
    getCachedData,
    setCachedData,
    updateStats,
  };
}

/**
 * Hook for offline-first data management
 */
export function useOfflineData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    refreshInterval?: number;
    staleTime?: number;
    retryOnReconnect?: boolean;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  const { isOnline } = useNetworkStatus();
  const { getCachedData, setCachedData } = useCache();

  const {
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    staleTime = 10 * 60 * 1000, // 10 minutes
    retryOnReconnect = true,
  } = options;

  const fetchData = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = await getCachedData<{ data: T; timestamp: number }>(key);
        if (cached && Date.now() - cached.timestamp < staleTime) {
          setData(cached.data);
          setLastUpdated(cached.timestamp);
          setIsLoading(false);
          return cached.data;
        }
      }

      // Fetch fresh data if online
      if (isOnline) {
        const freshData = await fetcher();
        const timestamp = Date.now();
        
        await setCachedData(key, { data: freshData, timestamp });
        setData(freshData);
        setLastUpdated(timestamp);
        setIsLoading(false);
        return freshData;
      } else {
        // Use cached data if offline
        const cached = await getCachedData<{ data: T; timestamp: number }>(key);
        if (cached) {
          setData(cached.data);
          setLastUpdated(cached.timestamp);
          setIsLoading(false);
          return cached.data;
        } else {
          throw new Error('No cached data available and device is offline');
        }
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);
      
      // Try to use stale cached data as fallback
      const cached = await getCachedData<{ data: T; timestamp: number }>(key);
      if (cached) {
        setData(cached.data);
        setLastUpdated(cached.timestamp);
        return cached.data;
      }
      
      throw error;
    }
  }, [key, fetcher, isOnline, staleTime, getCachedData, setCachedData]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Retry on reconnect
  useEffect(() => {
    if (isOnline && retryOnReconnect && error) {
      fetchData();
    }
  }, [isOnline, retryOnReconnect, error, fetchData]);

  // Periodic refresh
  useEffect(() => {
    if (!refreshInterval || !isOnline) return;

    const interval = setInterval(() => {
      if (lastUpdated && Date.now() - lastUpdated > refreshInterval) {
        fetchData();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, isOnline, lastUpdated, fetchData]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const isStale = lastUpdated ? Date.now() - lastUpdated > staleTime : false;

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    isStale,
    refresh,
  };
}

/**
 * Hook for connection quality monitoring
 */
export function useConnectionQuality() {
  const { networkStatus } = useNetworkStatus();
  
  const getQualityLevel = useCallback((): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (!networkStatus) return 'good';
    
    const { effectiveType, downlink, rtt } = networkStatus;
    
    if (effectiveType === '4g' && downlink > 10 && rtt < 100) {
      return 'excellent';
    } else if (effectiveType === '4g' || (downlink > 1.5 && rtt < 300)) {
      return 'good';
    } else if (effectiveType === '3g' || (downlink > 0.5 && rtt < 1000)) {
      return 'fair';
    } else {
      return 'poor';
    }
  }, [networkStatus]);

  const getRecommendations = useCallback(() => {
    const quality = getQualityLevel();
    
    switch (quality) {
      case 'excellent':
        return {
          enableHighQualityAssets: true,
          enableRealTimeSync: true,
          prefetchContent: true,
          maxConcurrentRequests: 6,
        };
      case 'good':
        return {
          enableHighQualityAssets: true,
          enableRealTimeSync: true,
          prefetchContent: false,
          maxConcurrentRequests: 4,
        };
      case 'fair':
        return {
          enableHighQualityAssets: false,
          enableRealTimeSync: false,
          prefetchContent: false,
          maxConcurrentRequests: 2,
        };
      case 'poor':
        return {
          enableHighQualityAssets: false,
          enableRealTimeSync: false,
          prefetchContent: false,
          maxConcurrentRequests: 1,
        };
      default:
        return {
          enableHighQualityAssets: false,
          enableRealTimeSync: false,
          prefetchContent: false,
          maxConcurrentRequests: 2,
        };
    }
  }, [getQualityLevel]);

  return {
    networkStatus,
    qualityLevel: getQualityLevel(),
    recommendations: getRecommendations(),
  };
}