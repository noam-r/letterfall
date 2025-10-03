export interface CacheConfig {
  maxAge: number; // milliseconds
  maxSize: number; // bytes
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  size: number;
  url: string;
  etag?: string;
}

export class CacheManager {
  private static instance: CacheManager | null = null;
  private config: CacheConfig;
  private memoryCache = new Map<string, CacheEntry>();
  private currentSize = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 50 * 1024 * 1024, // 50MB
      strategy: 'stale-while-revalidate',
      ...config,
    };

    this.loadFromStorage();
    this.setupCleanupInterval();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get cached data
   */
  async get<T = any>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data;
    }

    // Check persistent cache
    try {
      const cache = await caches.open('letterfall-data-cache');
      const response = await cache.match(key);
      
      if (response) {
        const data = await response.json();
        const timestamp = parseInt(response.headers.get('x-cache-timestamp') || '0');
        
        if (!this.isExpiredTimestamp(timestamp)) {
          // Update memory cache
          this.setMemoryCache(key, data, response.url, response.headers.get('etag') || undefined);
          return data;
        }
      }
    } catch (error) {
      console.warn('Failed to get from persistent cache:', error);
    }

    return null;
  }

  /**
   * Set cached data
   */
  async set(key: string, data: any, url?: string, etag?: string): Promise<void> {
    // Set in memory cache
    this.setMemoryCache(key, data, url || key, etag);

    // Set in persistent cache
    try {
      const cache = await caches.open('letterfall-data-cache');
      const response = new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'x-cache-timestamp': Date.now().toString(),
          ...(etag && { 'etag': etag }),
        },
      });
      
      await cache.put(key, response);
    } catch (error) {
      console.warn('Failed to set persistent cache:', error);
    }
  }

  /**
   * Check if data exists in cache
   */
  async has(key: string): Promise<boolean> {
    // Check memory cache
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return true;
    }

    // Check persistent cache
    try {
      const cache = await caches.open('letterfall-data-cache');
      const response = await cache.match(key);
      
      if (response) {
        const timestamp = parseInt(response.headers.get('x-cache-timestamp') || '0');
        return !this.isExpiredTimestamp(timestamp);
      }
    } catch (error) {
      console.warn('Failed to check persistent cache:', error);
    }

    return false;
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    // Remove from memory cache
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.memoryCache.delete(key);
    }

    // Remove from persistent cache
    try {
      const cache = await caches.open('letterfall-data-cache');
      await cache.delete(key);
    } catch (error) {
      console.warn('Failed to delete from persistent cache:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    this.currentSize = 0;

    // Clear persistent cache
    try {
      const cache = await caches.open('letterfall-data-cache');
      const keys = await cache.keys();
      await Promise.all(keys.map(key => cache.delete(key)));
    } catch (error) {
      console.warn('Failed to clear persistent cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memoryEntries: number;
    memorySize: number;
    persistentEntries: number;
    oldestEntry?: number;
    newestEntry?: number;
  }> {
    const stats = {
      memoryEntries: this.memoryCache.size,
      memorySize: this.currentSize,
      persistentEntries: 0,
      oldestEntry: undefined as number | undefined,
      newestEntry: undefined as number | undefined,
    };

    // Get memory cache timestamps
    const memoryTimestamps = Array.from(this.memoryCache.values()).map(e => e.timestamp);
    if (memoryTimestamps.length > 0) {
      stats.oldestEntry = Math.min(...memoryTimestamps);
      stats.newestEntry = Math.max(...memoryTimestamps);
    }

    // Count persistent cache entries
    try {
      const cache = await caches.open('letterfall-data-cache');
      const keys = await cache.keys();
      stats.persistentEntries = keys.length;
    } catch (error) {
      console.warn('Failed to get persistent cache stats:', error);
    }

    return stats;
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<void> {
    // Cleanup memory cache
    // const _now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.currentSize -= entry.size;
        this.memoryCache.delete(key);
      }
    }

    // Cleanup persistent cache
    try {
      const cache = await caches.open('letterfall-data-cache');
      const keys = await cache.keys();
      
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const timestamp = parseInt(response.headers.get('x-cache-timestamp') || '0');
          if (this.isExpiredTimestamp(timestamp)) {
            await cache.delete(request);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup persistent cache:', error);
    }
  }

  /**
   * Fetch with caching strategy
   */
  async fetchWithCache<T = any>(
    url: string, 
    options: RequestInit = {},
    cacheKey?: string
  ): Promise<T> {
    const key = cacheKey || url;

    switch (this.config.strategy) {
      case 'cache-first':
        return this.cacheFirstStrategy(key, url, options);
      case 'network-first':
        return this.networkFirstStrategy(key, url, options);
      case 'stale-while-revalidate':
        return this.staleWhileRevalidateStrategy(key, url, options);
      default:
        throw new Error(`Unknown cache strategy: ${this.config.strategy}`);
    }
  }

  private async cacheFirstStrategy<T>(key: string, url: string, options: RequestInit): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }

    // Fallback to network
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    await this.set(key, data, url, response.headers.get('etag') || undefined);
    return data;
  }

  private async networkFirstStrategy<T>(key: string, url: string, options: RequestInit): Promise<T> {
    try {
      // Try network first
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      await this.set(key, data, url, response.headers.get('etag') || undefined);
      return data;
    } catch (error) {
      // Fallback to cache
      const cached = await this.get<T>(key);
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  private async staleWhileRevalidateStrategy<T>(key: string, url: string, options: RequestInit): Promise<T> {
    // Get cached data immediately
    const cached = await this.get<T>(key);

    // Start network request in background
    const networkPromise = fetch(url, options)
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          await this.set(key, data, url, response.headers.get('etag') || undefined);
          return data;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      })
      .catch((error) => {
        console.warn('Background revalidation failed:', error);
      });

    // Return cached data if available, otherwise wait for network
    if (cached) {
      return cached;
    }

    return networkPromise;
  }

  private setMemoryCache(key: string, data: any, url: string, etag?: string): void {
    const size = this.estimateSize(data);
    
    // Check if we need to make space
    while (this.currentSize + size > this.config.maxSize && this.memoryCache.size > 0) {
      this.evictOldestEntry();
    }

    // Add new entry
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      size,
      url,
      etag,
    };

    this.memoryCache.set(key, entry);
    this.currentSize += size;
  }

  private evictOldestEntry(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.memoryCache.get(oldestKey)!;
      this.currentSize -= entry.size;
      this.memoryCache.delete(oldestKey);
    }
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate for UTF-16
    } catch {
      return 1024; // Fallback size
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return this.isExpiredTimestamp(entry.timestamp);
  }

  private isExpiredTimestamp(timestamp: number): boolean {
    return Date.now() - timestamp > this.config.maxAge;
  }

  private setupCleanupInterval(): void {
    // Cleanup every hour
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  private loadFromStorage(): void {
    // Memory cache is not persisted, only persistent cache is loaded on demand
  }
}