export interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

export interface OfflineConfig {
  enableOfflineMode: boolean;
  syncOnReconnect: boolean;
  showOfflineIndicator: boolean;
  cacheStrategy: 'aggressive' | 'conservative' | 'minimal';
}

export class OfflineManager {
  private static instance: OfflineManager | null = null;
  private config: OfflineConfig;
  private networkStatus: NetworkStatus;
  private listeners: ((status: NetworkStatus) => void)[] = [];
  private offlineQueue: Array<{ url: string; options: RequestInit; timestamp: number }> = [];

  constructor(config: Partial<OfflineConfig> = {}) {
    this.config = {
      enableOfflineMode: true,
      syncOnReconnect: true,
      showOfflineIndicator: true,
      cacheStrategy: 'conservative',
      ...config,
    };

    this.networkStatus = this.getCurrentNetworkStatus();
    this.setupEventListeners();
    this.loadOfflineQueue();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.networkStatus.isOnline;
  }

  /**
   * Check if connection is slow
   */
  isSlowConnection(): boolean {
    const { effectiveType, downlink } = this.networkStatus;
    // Only flag as slow for very poor connections (< 0.15 Mbps or 2g)
    // This prevents false positives on local development
    return effectiveType === 'slow-2g' || effectiveType === '2g' || (downlink > 0 && downlink < 0.15);
  }

  /**
   * Add network status listener
   */
  addListener(listener: (status: NetworkStatus) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove network status listener
   */
  removeListener(listener: (status: NetworkStatus) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Enhanced fetch with offline support and retry logic
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Check if online
    if (!this.isOnline()) {
      // Try to get from cache first
      const cachedResponse = await this.getCachedResponse(url);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Queue for later if offline mode is enabled
      if (this.config.enableOfflineMode) {
        this.queueRequest(url, options);
        throw new Error('Offline: Request queued for when connection is restored');
      }

      throw new Error('No internet connection and no cached response available');
    }

    // Online - attempt fetch with retry logic
    return this.fetchWithRetry(url, options);
  }

  /**
   * Fetch with automatic retry logic
   */
  async fetchWithRetry(
    url: string, 
    options: RequestInit = {}, 
    maxRetries: number = 3
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          // Cache successful responses
          this.cacheResponse(url, response.clone());
          return response;
        }

        // Handle HTTP errors
        if (response.status >= 500 && attempt < maxRetries) {
          // Server error - retry
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
          continue;
        }

        return response; // Return non-500 errors immediately
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Network error - retry with exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Process offline queue when connection is restored
   */
  async processOfflineQueue(): Promise<void> {
    if (!this.isOnline() || this.offlineQueue.length === 0) {
      return;
    }

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const request of queue) {
      try {
        await this.fetchWithRetry(request.url, request.options, 1);
      } catch (error) {
        console.warn('Failed to process queued request:', request.url, error);
        // Re-queue failed requests
        this.offlineQueue.push(request);
      }
    }

    this.saveOfflineQueue();
  }

  /**
   * Clear offline queue
   */
  clearOfflineQueue(): void {
    this.offlineQueue = [];
    this.saveOfflineQueue();
  }

  /**
   * Get offline queue status
   */
  getOfflineQueueStatus(): { count: number; oldestTimestamp?: number } {
    return {
      count: this.offlineQueue.length,
      oldestTimestamp: this.offlineQueue.length > 0 
        ? Math.min(...this.offlineQueue.map(r => r.timestamp))
        : undefined,
    };
  }

  private getCurrentNetworkStatus(): NetworkStatus {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
    };
  }

  private setupEventListeners(): void {
    // Online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Connection change events
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', this.handleConnectionChange);
    }
  }

  private handleOnline = (): void => {
    this.updateNetworkStatus();
    
    if (this.config.syncOnReconnect) {
      this.processOfflineQueue();
    }
  };

  private handleOffline = (): void => {
    this.updateNetworkStatus();
  };

  private handleConnectionChange = (): void => {
    this.updateNetworkStatus();
  };

  private updateNetworkStatus(): void {
    const newStatus = this.getCurrentNetworkStatus();
    const wasOnline = this.networkStatus.isOnline;
    
    this.networkStatus = newStatus;

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(newStatus);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });

    // Log status changes
    if (wasOnline !== newStatus.isOnline) {
      console.log(`Network status changed: ${newStatus.isOnline ? 'Online' : 'Offline'}`);
    }
  }

  private queueRequest(url: string, options: RequestInit): void {
    this.offlineQueue.push({
      url,
      options,
      timestamp: Date.now(),
    });

    // Limit queue size
    if (this.offlineQueue.length > 100) {
      this.offlineQueue = this.offlineQueue.slice(-100);
    }

    this.saveOfflineQueue();
  }

  private async getCachedResponse(url: string): Promise<Response | null> {
    try {
      const cache = await caches.open('letterfall-network-cache');
      return (await cache.match(url)) || null;
    } catch (error) {
      console.warn('Failed to get cached response:', error);
      return null;
    }
  }

  private async cacheResponse(url: string, response: Response): Promise<void> {
    try {
      const cache = await caches.open('letterfall-network-cache');
      
      // Only cache successful responses
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn('Failed to cache response:', error);
    }
  }

  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('letterfall-offline-queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.warn('Failed to save offline queue:', error);
    }
  }

  private loadOfflineQueue(): void {
    try {
      const stored = localStorage.getItem('letterfall-offline-queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
        
        // Remove old requests (older than 24 hours)
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.offlineQueue = this.offlineQueue.filter(r => r.timestamp > dayAgo);
      }
    } catch (error) {
      console.warn('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.removeEventListener('change', this.handleConnectionChange);
    }

    this.listeners = [];
  }
}