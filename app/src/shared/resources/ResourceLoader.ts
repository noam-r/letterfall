export interface LoadingProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentResource?: string;
}

export interface ResourceMetadata {
  url: string;
  type: 'audio' | 'image' | 'data' | 'font';
  priority: 'high' | 'medium' | 'low';
  size?: number;
  preload?: boolean;
}

export interface LoadingOptions {
  timeout?: number;
  retries?: number;
  onProgress?: (progress: LoadingProgress) => void;
  onError?: (error: Error, resource: ResourceMetadata) => void;
}

export class ResourceLoader {
  private cache = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();
  // private _loadingQueue: ResourceMetadata[] = [];
  private isLoading = false;
  private abortController?: AbortController;

  private options: LoadingOptions;

  constructor(options: LoadingOptions = {}) {
    this.options = {
      timeout: 30000,
      retries: 3,
      ...options,
    };
  }

  /**
   * Load a single resource
   */
  async loadResource<T = any>(resource: ResourceMetadata): Promise<T> {
    const cacheKey = this.getCacheKey(resource);
    
    // Return cached resource if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // Start loading
    const loadingPromise = this.performLoad<T>(resource);
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const result = await loadingPromise;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Load multiple resources with progress tracking
   */
  async loadResources(resources: ResourceMetadata[]): Promise<Map<string, any>> {
    if (this.isLoading) {
      throw new Error('ResourceLoader is already loading resources');
    }

    this.isLoading = true;
    this.abortController = new AbortController();
    
    try {
      // Sort by priority
      const sortedResources = this.sortByPriority(resources);
      const results = new Map<string, any>();
      let loaded = 0;

      for (const resource of sortedResources) {
        if (this.abortController.signal.aborted) {
          throw new Error('Loading aborted');
        }

        try {
          const result = await this.loadResource(resource);
          results.set(this.getCacheKey(resource), result);
          loaded++;

          // Report progress
          if (this.options.onProgress) {
            this.options.onProgress({
              loaded,
              total: sortedResources.length,
              percentage: Math.round((loaded / sortedResources.length) * 100),
              currentResource: resource.url,
            });
          }
        } catch (error) {
          if (this.options.onError) {
            this.options.onError(error as Error, resource);
          }
          // Continue loading other resources even if one fails
        }
      }

      return results;
    } finally {
      this.isLoading = false;
      this.abortController = undefined;
    }
  }

  /**
   * Preload resources in the background
   */
  async preloadResources(resources: ResourceMetadata[]): Promise<void> {
    const preloadResources = resources.filter(r => r.preload !== false);
    
    // Load high priority resources first
    const highPriority = preloadResources.filter(r => r.priority === 'high');
    if (highPriority.length > 0) {
      await this.loadResources(highPriority);
    }

    // Load medium and low priority resources in background
    const backgroundResources = preloadResources.filter(r => r.priority !== 'high');
    if (backgroundResources.length > 0) {
      // Don't await - load in background
      this.loadResources(backgroundResources).catch(error => {
        console.warn('Background preloading failed:', error);
      });
    }
  }

  /**
   * Check if a resource is cached
   */
  isCached(resource: ResourceMetadata): boolean {
    return this.cache.has(this.getCacheKey(resource));
  }

  /**
   * Get cached resource
   */
  getCached<T = any>(resource: ResourceMetadata): T | undefined {
    return this.cache.get(this.getCacheKey(resource));
  }

  /**
   * Get cached resource (alternative method name for compatibility)
   */
  getCachedResource<T = any>(resource: ResourceMetadata): T | undefined {
    return this.getCached<T>(resource);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Abort current loading operation
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const totalSize = Array.from(this.cache.values()).reduce((size, item) => {
      if (item instanceof ArrayBuffer) {
        return size + item.byteLength;
      }
      if (typeof item === 'string') {
        return size + item.length * 2; // Rough estimate for UTF-16
      }
      return size + 1; // Fallback for other types
    }, 0);

    return {
      itemCount: this.cache.size,
      estimatedSize: totalSize,
      isLoading: this.isLoading,
      size: this.cache.size,
    };
  }

  private async performLoad<T>(resource: ResourceMetadata): Promise<T> {
    let lastError: Error | null = null;
    const maxRetries = this.options.retries || 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.loadByType<T>(resource);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`Failed to load resource: ${resource.url}`);
  }

  private async loadByType<T>(resource: ResourceMetadata): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    try {
      switch (resource.type) {
        case 'audio':
          return await this.loadAudio(resource, controller.signal) as T;
        case 'image':
          return await this.loadImage(resource, controller.signal) as T;
        case 'data':
          return await this.loadData(resource, controller.signal) as T;
        case 'font':
          return await this.loadFont(resource, controller.signal) as T;
        default:
          throw new Error(`Unsupported resource type: ${resource.type}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async loadAudio(resource: ResourceMetadata, signal: AbortSignal): Promise<ArrayBuffer> {
    const response = await fetch(resource.url, { signal });
    if (!response.ok) {
      throw new Error(`Failed to load audio: ${response.status} ${response.statusText}`);
    }
    return await response.arrayBuffer();
  }

  private async loadImage(resource: ResourceMetadata, signal: AbortSignal): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      const cleanup = () => {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
        signal.removeEventListener('abort', onAbort);
      };

      const onLoad = () => {
        cleanup();
        resolve(img);
      };

      const onError = () => {
        cleanup();
        reject(new Error(`Failed to load image: ${resource.url}`));
      };

      const onAbort = () => {
        cleanup();
        reject(new Error('Image loading aborted'));
      };

      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);
      signal.addEventListener('abort', onAbort);

      img.src = resource.url;
    });
  }

  private async loadData(resource: ResourceMetadata, signal: AbortSignal): Promise<any> {
    const response = await fetch(resource.url, { signal });
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  }

  private async loadFont(resource: ResourceMetadata, signal: AbortSignal): Promise<FontFace> {
    if (!('FontFace' in window)) {
      throw new Error('FontFace API not supported');
    }

    const response = await fetch(resource.url, { signal });
    if (!response.ok) {
      throw new Error(`Failed to load font: ${response.status} ${response.statusText}`);
    }

    const fontData = await response.arrayBuffer();
    const fontName = this.extractFontName(resource.url);
    const fontFace = new FontFace(fontName, fontData);
    
    await fontFace.load();
    document.fonts.add(fontFace);
    
    return fontFace;
  }

  private extractFontName(url: string): string {
    const filename = url.split('/').pop() || 'unknown';
    return filename.split('.')[0];
  }

  private sortByPriority(resources: ResourceMetadata[]): ResourceMetadata[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...resources].sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private getCacheKey(resource: ResourceMetadata): string {
    return `${resource.type}:${resource.url}`;
  }
}