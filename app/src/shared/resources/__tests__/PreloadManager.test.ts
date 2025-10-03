import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PreloadManager, UserBehaviorData, PreloadStrategy } from '../PreloadManager';
import { ResourceLoader } from '../ResourceLoader';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock navigator properties
Object.defineProperty(navigator, 'deviceMemory', {
  writable: true,
  value: 4,
});

Object.defineProperty(navigator, 'hardwareConcurrency', {
  writable: true,
  value: 4,
});

describe('PreloadManager', () => {
  let preloadManager: PreloadManager;
  let mockResourceLoader: ResourceLoader;

  beforeEach(() => {
    mockResourceLoader = {
      preloadResources: vi.fn().mockResolvedValue(undefined),
      clearCache: vi.fn(),
      getCacheStats: vi.fn().mockReturnValue({
        itemCount: 0,
        estimatedSize: 0,
        isLoading: false,
      }),
    } as any;

    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();

    preloadManager = new PreloadManager(mockResourceLoader);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default user behavior', () => {
      const stats = preloadManager.getPreloadStats();
      expect(stats.userBehavior).toEqual({
        topicsPlayed: [],
        averageSessionLength: 0,
        preferredDifficulty: 'Standard',
        lastPlayedTopics: [],
        devicePerformance: 'medium', // Based on mocked navigator values
      });
    });

    it('should load user behavior from localStorage', () => {
      const storedBehavior: UserBehaviorData = {
        topicsPlayed: ['topic1', 'topic2'],
        averageSessionLength: 300,
        preferredDifficulty: 'Hard',
        lastPlayedTopics: ['topic1'],
        devicePerformance: 'high',
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedBehavior));

      const newManager = new PreloadManager(mockResourceLoader);
      const stats = newManager.getPreloadStats();
      expect(stats.userBehavior).toEqual(storedBehavior);
    });

    it('should detect device performance correctly', () => {
      // Test high performance
      (navigator as any).deviceMemory = 8;
      (navigator as any).hardwareConcurrency = 8;
      
      const highPerfManager = new PreloadManager(mockResourceLoader);
      expect(highPerfManager.getPreloadStats().userBehavior.devicePerformance).toBe('high');

      // Test low performance
      (navigator as any).deviceMemory = 2;
      (navigator as any).hardwareConcurrency = 1;
      
      const lowPerfManager = new PreloadManager(mockResourceLoader);
      expect(lowPerfManager.getPreloadStats().userBehavior.devicePerformance).toBe('low');
    });
  });

  describe('strategy management', () => {
    it('should add and prioritize strategies', () => {
      const strategy1: PreloadStrategy = {
        name: 'test-strategy-1',
        priority: 50,
        condition: () => true,
        resources: [],
      };

      const strategy2: PreloadStrategy = {
        name: 'test-strategy-2',
        priority: 100,
        condition: () => true,
        resources: [],
      };

      preloadManager.addStrategy(strategy1);
      preloadManager.addStrategy(strategy2);

      const stats = preloadManager.getPreloadStats();
      expect(stats.strategiesCount).toBe(6); // 4 default + 2 added
    });

    it('should evaluate strategies based on conditions', async () => {
      const mockResources = [
        { url: '/test.mp3', type: 'audio' as const, priority: 'high' as const },
      ];

      const strategy: PreloadStrategy = {
        name: 'test-strategy',
        priority: 100,
        condition: (behavior) => behavior.topicsPlayed.length > 0,
        resources: mockResources,
      };

      preloadManager.addStrategy(strategy);

      // Should not preload the strategy resources initially (no topics played)
      await preloadManager.preloadBasedOnBehavior();
      
      // The essential assets might be preloaded, but not the strategy resources
      const calls = mockResourceLoader.preloadResources.mock.calls;
      if (calls.length > 0) {
        // If there were calls, they should not include the strategy resources
        const calledResources = calls.flat();
        expect(calledResources).not.toEqual(expect.arrayContaining(mockResources));
      }

      // Update behavior to trigger strategy
      preloadManager.updateUserBehavior({ topicsPlayed: ['topic1'] });
      
      // Wait for async evaluation
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(mockResourceLoader.preloadResources).toHaveBeenCalledWith(mockResources);
    });
  });

  describe('user behavior tracking', () => {
    it('should update and save user behavior', () => {
      const behaviorUpdate = {
        topicsPlayed: ['topic1', 'topic2'],
        averageSessionLength: 450,
      };

      preloadManager.updateUserBehavior(behaviorUpdate);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'letterfall-user-behavior',
        expect.stringContaining('topic1')
      );

      const stats = preloadManager.getPreloadStats();
      expect(stats.userBehavior.topicsPlayed).toEqual(['topic1', 'topic2']);
      expect(stats.userBehavior.averageSessionLength).toBe(450);
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      expect(() => {
        preloadManager.updateUserBehavior({ topicsPlayed: ['topic1'] });
      }).not.toThrow();
    });
  });

  describe('preloading functionality', () => {
    it('should preload topic resources', async () => {
      const topicId = 'test-topic';
      
      await preloadManager.preloadTopic(topicId);
      
      // Since getTopicResources returns empty array in our implementation,
      // preloadResources should not be called (no resources to preload)
      expect(mockResourceLoader.preloadResources).not.toHaveBeenCalled();
    });

    it('should get preload recommendations', () => {
      preloadManager.updateUserBehavior({
        lastPlayedTopics: ['topic1', 'topic2'],
        devicePerformance: 'high',
      });

      const recommendations = preloadManager.getPreloadRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should clear preload cache', () => {
      preloadManager.clearPreloadCache();
      expect(mockResourceLoader.clearCache).toHaveBeenCalled();
    });
  });

  describe('default strategies', () => {
    it('should have frequent topics strategy', async () => {
      preloadManager.updateUserBehavior({
        topicsPlayed: ['topic1', 'topic2', 'topic3'],
      });

      await preloadManager.preloadBasedOnBehavior();
      
      // Should attempt to preload (even if resources are empty)
      expect(mockResourceLoader.preloadResources).toHaveBeenCalled();
    });

    it('should have long session strategy', async () => {
      preloadManager.updateUserBehavior({
        averageSessionLength: 400, // > 300 seconds
      });

      await preloadManager.preloadBasedOnBehavior();
      expect(mockResourceLoader.preloadResources).toHaveBeenCalled();
    });

    it('should have device performance strategies', async () => {
      // Test high performance strategy
      preloadManager.updateUserBehavior({
        devicePerformance: 'high',
      });

      await preloadManager.preloadBasedOnBehavior();
      expect(mockResourceLoader.preloadResources).toHaveBeenCalled();

      vi.clearAllMocks();

      // Test low performance strategy
      preloadManager.updateUserBehavior({
        devicePerformance: 'low',
      });

      await preloadManager.preloadBasedOnBehavior();
      expect(mockResourceLoader.preloadResources).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle preload failures gracefully', async () => {
      mockResourceLoader.preloadResources.mockRejectedValue(new Error('Preload failed'));

      const strategy: PreloadStrategy = {
        name: 'failing-strategy',
        priority: 100,
        condition: () => true,
        resources: [{ url: '/test.mp3', type: 'audio', priority: 'high' }],
      };

      preloadManager.addStrategy(strategy);

      // Should not throw
      await expect(preloadManager.preloadBasedOnBehavior()).resolves.toBeUndefined();
    });
  });

  describe('statistics', () => {
    it('should provide comprehensive statistics', () => {
      const stats = preloadManager.getPreloadStats();

      expect(stats).toHaveProperty('preloadedCount');
      expect(stats).toHaveProperty('strategiesCount');
      expect(stats).toHaveProperty('cacheStats');
      expect(stats).toHaveProperty('userBehavior');

      expect(typeof stats.preloadedCount).toBe('number');
      expect(typeof stats.strategiesCount).toBe('number');
      expect(typeof stats.cacheStats).toBe('object');
      expect(typeof stats.userBehavior).toBe('object');
    });
  });
});