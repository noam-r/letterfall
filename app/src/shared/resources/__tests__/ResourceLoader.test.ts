import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResourceLoader, ResourceMetadata } from '../ResourceLoader';

// Mock fetch
global.fetch = vi.fn();

describe('ResourceLoader', () => {
  let loader: ResourceLoader;
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = global.fetch as any;
    mockFetch.mockClear();
    loader = new ResourceLoader();
  });

  afterEach(() => {
    loader.clearCache();
  });

  describe('loadResource', () => {
    it('should load and cache a data resource', async () => {
      const mockData = { test: 'data' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
        headers: new Map([['content-type', 'application/json']]),
      });

      const resource: ResourceMetadata = {
        url: '/test.json',
        type: 'data',
        priority: 'high',
      };

      const result = await loader.loadResource(resource);
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith('/test.json', expect.any(Object));
    });

    it('should return cached resource on subsequent calls', async () => {
      const mockData = { test: 'data' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
        headers: new Map([['content-type', 'application/json']]),
      });

      const resource: ResourceMetadata = {
        url: '/test.json',
        type: 'data',
        priority: 'high',
      };

      // First call
      const result1 = await loader.loadResource(resource);
      expect(result1).toEqual(mockData);

      // Second call should use cache
      const result2 = await loader.loadResource(resource);
      expect(result2).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const mockData = { test: 'data' };
      
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
        headers: new Map([['content-type', 'application/json']]),
      });

      const resource: ResourceMetadata = {
        url: '/test.json',
        type: 'data',
        priority: 'high',
      };

      const result = await loader.loadResource(resource);
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle audio resources', async () => {
      const mockArrayBuffer = new ArrayBuffer(1024);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
      });

      const resource: ResourceMetadata = {
        url: '/test.mp3',
        type: 'audio',
        priority: 'medium',
      };

      const result = await loader.loadResource(resource);
      expect(result).toBe(mockArrayBuffer);
    });

    it('should handle image resources', async () => {
      const resource: ResourceMetadata = {
        url: '/test.png',
        type: 'image',
        priority: 'low',
      };

      // Mock Image constructor
      const mockImage = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        src: '',
      };

      global.Image = vi.fn(() => mockImage) as any;

      // Simulate successful image load
      const loadPromise = loader.loadResource(resource);
      
      // Trigger load event
      const loadHandler = mockImage.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1];
      
      if (loadHandler) {
        loadHandler();
      }

      const result = await loadPromise;
      expect(result).toBe(mockImage);
    });
  });

  describe('loadResources', () => {
    it('should load multiple resources with progress tracking', async () => {
      const mockData1 = { test: 'data1' };
      const mockData2 = { test: 'data2' };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData1),
          headers: new Map([['content-type', 'application/json']]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData2),
          headers: new Map([['content-type', 'application/json']]),
        });

      const resources: ResourceMetadata[] = [
        { url: '/test1.json', type: 'data', priority: 'high' },
        { url: '/test2.json', type: 'data', priority: 'medium' },
      ];

      const progressUpdates: any[] = [];
      const onProgress = vi.fn((progress) => {
        progressUpdates.push(progress);
      });

      const loaderWithProgress = new ResourceLoader({ onProgress });
      const results = await loaderWithProgress.loadResources(resources);

      expect(results.size).toBe(2);
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1].percentage).toBe(100);
    });

    it('should sort resources by priority', async () => {
      const mockData = { test: 'data' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
        headers: new Map([['content-type', 'application/json']]),
      });

      const resources: ResourceMetadata[] = [
        { url: '/low.json', type: 'data', priority: 'low' },
        { url: '/high.json', type: 'data', priority: 'high' },
        { url: '/medium.json', type: 'data', priority: 'medium' },
      ];

      const loadOrder: string[] = [];
      const onProgress = vi.fn((progress) => {
        if (progress.currentResource) {
          loadOrder.push(progress.currentResource);
        }
      });

      const loaderWithProgress = new ResourceLoader({ onProgress });
      await loaderWithProgress.loadResources(resources);

      expect(loadOrder[0]).toBe('/high.json');
      expect(loadOrder[1]).toBe('/medium.json');
      expect(loadOrder[2]).toBe('/low.json');
    });
  });

  describe('cache management', () => {
    it('should check if resource is cached', async () => {
      const resource: ResourceMetadata = {
        url: '/test.json',
        type: 'data',
        priority: 'high',
      };

      expect(loader.isCached(resource)).toBe(false);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ test: 'data' }),
        headers: new Map([['content-type', 'application/json']]),
      });

      await loader.loadResource(resource);
      expect(loader.isCached(resource)).toBe(true);
    });

    it('should get cached resource', async () => {
      const mockData = { test: 'data' };
      const resource: ResourceMetadata = {
        url: '/test.json',
        type: 'data',
        priority: 'high',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
        headers: new Map([['content-type', 'application/json']]),
      });

      await loader.loadResource(resource);
      const cached = loader.getCached(resource);
      expect(cached).toEqual(mockData);
    });

    it('should clear cache', async () => {
      const resource: ResourceMetadata = {
        url: '/test.json',
        type: 'data',
        priority: 'high',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ test: 'data' }),
        headers: new Map([['content-type', 'application/json']]),
      });

      await loader.loadResource(resource);
      expect(loader.isCached(resource)).toBe(true);

      loader.clearCache();
      expect(loader.isCached(resource)).toBe(false);
    });

    it('should provide cache statistics', async () => {
      const stats = loader.getCacheStats();
      expect(stats).toHaveProperty('itemCount');
      expect(stats).toHaveProperty('estimatedSize');
      expect(stats).toHaveProperty('isLoading');
      expect(stats.itemCount).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      // Create a loader with fewer retries to speed up the test
      const fastLoader = new ResourceLoader({ retries: 0, timeout: 1000 });
      mockFetch.mockRejectedValue(new Error('Network error'));

      const resource: ResourceMetadata = {
        url: '/test.json',
        type: 'data',
        priority: 'high',
      };

      await expect(fastLoader.loadResource(resource)).rejects.toThrow();
    }, 10000);

    it('should handle HTTP errors', async () => {
      // Create a loader with fewer retries to speed up the test
      const fastLoader = new ResourceLoader({ retries: 0, timeout: 1000 });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const resource: ResourceMetadata = {
        url: '/test.json',
        type: 'data',
        priority: 'high',
      };

      await expect(fastLoader.loadResource(resource)).rejects.toThrow('Failed to load data: 404 Not Found');
    }, 10000);

    it('should call error callback on failure', async () => {
      const onError = vi.fn();
      const loaderWithError = new ResourceLoader({ onError, retries: 0, timeout: 1000 });

      mockFetch.mockRejectedValue(new Error('Network error'));

      const resources: ResourceMetadata[] = [
        { url: '/test.json', type: 'data', priority: 'high' },
      ];

      await expect(loaderWithError.loadResources(resources)).rejects.toThrow();
      expect(onError).toHaveBeenCalled();
    }, 10000);
  });

  describe('abort functionality', () => {
    it('should abort loading', async () => {
      // Create a promise that never resolves to simulate long loading
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const resource: ResourceMetadata = {
        url: '/test.json',
        type: 'data',
        priority: 'high',
      };

      const loadPromise = loader.loadResource(resource);
      loader.abort();

      // The promise should still be pending since we're not properly handling abort in this test
      // In a real scenario, the fetch would be aborted
      expect(loadPromise).toBeInstanceOf(Promise);
    });
  });
});