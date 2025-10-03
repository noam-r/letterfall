import { ResourceLoader, type ResourceMetadata } from './ResourceLoader';

export interface UserBehaviorData {
  topicsPlayed: string[];
  averageSessionLength: number;
  preferredDifficulty: string;
  lastPlayedTopics: string[];
  devicePerformance: 'high' | 'medium' | 'low';
}

export interface PreloadStrategy {
  name: string;
  priority: number;
  condition: (behavior: UserBehaviorData) => boolean;
  resources: ResourceMetadata[];
}

export class PreloadManager {
  private resourceLoader: ResourceLoader;
  private strategies: PreloadStrategy[] = [];
  private userBehavior: UserBehaviorData;
  private preloadedResources = new Set<string>();

  constructor(resourceLoader: ResourceLoader) {
    this.resourceLoader = resourceLoader;
    this.userBehavior = this.loadUserBehavior();
    this.initializeStrategies();
  }

  /**
   * Add a preload strategy
   */
  addStrategy(strategy: PreloadStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Update user behavior data
   */
  updateUserBehavior(data: Partial<UserBehaviorData>): void {
    this.userBehavior = { ...this.userBehavior, ...data };
    this.saveUserBehavior();
    this.evaluatePreloadStrategies();
  }

  /**
   * Preload resources based on current strategies
   */
  async preloadBasedOnBehavior(): Promise<void> {
    const applicableStrategies = this.strategies.filter(strategy => 
      strategy.condition(this.userBehavior)
    );

    for (const strategy of applicableStrategies) {
      const unloadedResources = strategy.resources.filter(resource => 
        !this.preloadedResources.has(this.getResourceKey(resource))
      );

      if (unloadedResources.length > 0) {
        console.log(`Preloading resources for strategy: ${strategy.name}`);
        
        try {
          await this.resourceLoader.preloadResources(unloadedResources);
          
          // Mark resources as preloaded
          unloadedResources.forEach(resource => {
            this.preloadedResources.add(this.getResourceKey(resource));
          });
        } catch (error) {
          console.warn(`Failed to preload resources for strategy ${strategy.name}:`, error);
        }
      }
    }
  }

  /**
   * Preload resources for a specific topic
   */
  async preloadTopic(topicId: string): Promise<void> {
    const topicResources = this.getTopicResources(topicId);
    
    if (topicResources.length > 0) {
      console.log(`Preloading resources for topic: ${topicId}`);
      await this.resourceLoader.preloadResources(topicResources);
      
      topicResources.forEach(resource => {
        this.preloadedResources.add(this.getResourceKey(resource));
      });
    }
  }

  /**
   * Get preload recommendations based on current context
   */
  getPreloadRecommendations(): ResourceMetadata[] {
    const recommendations: ResourceMetadata[] = [];
    
    // Recommend recently played topics
    this.userBehavior.lastPlayedTopics.slice(0, 3).forEach(topicId => {
      recommendations.push(...this.getTopicResources(topicId));
    });

    // Recommend based on device performance
    if (this.userBehavior.devicePerformance === 'high') {
      recommendations.push(...this.getHighQualityAssets());
    } else {
      recommendations.push(...this.getLowQualityAssets());
    }

    // Remove duplicates
    const uniqueRecommendations = recommendations.filter((resource, index, array) => 
      array.findIndex(r => this.getResourceKey(r) === this.getResourceKey(resource)) === index
    );

    return uniqueRecommendations;
  }

  /**
   * Clear preload cache
   */
  clearPreloadCache(): void {
    this.preloadedResources.clear();
    this.resourceLoader.clearCache();
  }

  /**
   * Get preload statistics
   */
  getPreloadStats() {
    return {
      preloadedCount: this.preloadedResources.size,
      strategiesCount: this.strategies.length,
      cacheStats: this.resourceLoader.getCacheStats(),
      userBehavior: this.userBehavior,
    };
  }

  private initializeStrategies(): void {
    // Strategy 1: Preload frequently played topics
    this.addStrategy({
      name: 'frequent-topics',
      priority: 100,
      condition: (behavior) => behavior.topicsPlayed.length > 0,
      resources: this.getFrequentTopicResources(),
    });

    // Strategy 2: Preload based on session length
    this.addStrategy({
      name: 'long-session-user',
      priority: 80,
      condition: (behavior) => behavior.averageSessionLength > 300, // 5 minutes
      resources: this.getExtendedGameplayResources(),
    });

    // Strategy 3: Preload for high-performance devices
    this.addStrategy({
      name: 'high-performance',
      priority: 60,
      condition: (behavior) => behavior.devicePerformance === 'high',
      resources: this.getHighQualityAssets(),
    });

    // Strategy 4: Preload essential assets for low-performance devices
    this.addStrategy({
      name: 'low-performance',
      priority: 90,
      condition: (behavior) => behavior.devicePerformance === 'low',
      resources: this.getEssentialAssets(),
    });
  }

  private evaluatePreloadStrategies(): void {
    // Re-evaluate strategies when user behavior changes
    setTimeout(() => {
      this.preloadBasedOnBehavior().catch(error => {
        console.warn('Failed to preload based on updated behavior:', error);
      });
    }, 1000); // Delay to avoid blocking UI
  }

  private loadUserBehavior(): UserBehaviorData {
    try {
      const stored = localStorage.getItem('letterfall-user-behavior');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load user behavior data:', error);
    }

    // Default behavior data
    return {
      topicsPlayed: [],
      averageSessionLength: 0,
      preferredDifficulty: 'Standard',
      lastPlayedTopics: [],
      devicePerformance: this.detectDevicePerformance(),
    };
  }

  private saveUserBehavior(): void {
    try {
      localStorage.setItem('letterfall-user-behavior', JSON.stringify(this.userBehavior));
    } catch (error) {
      console.warn('Failed to save user behavior data:', error);
    }
  }

  private detectDevicePerformance(): 'high' | 'medium' | 'low' {
    // Simple device performance detection
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 2;
    
    if (memory >= 8 && cores >= 4) {
      return 'high';
    } else if (memory >= 4 && cores >= 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private getResourceKey(resource: ResourceMetadata): string {
    return `${resource.type}:${resource.url}`;
  }

  private getTopicResources(_topicId: string): ResourceMetadata[] {
    // This would be populated with actual topic resources
    // For now, return empty array as topics are loaded dynamically
    return [];
  }

  private getFrequentTopicResources(): ResourceMetadata[] {
    const frequentTopics = this.userBehavior.topicsPlayed.slice(0, 5);
    const resources: ResourceMetadata[] = [];
    
    frequentTopics.forEach(topicId => {
      resources.push(...this.getTopicResources(topicId));
    });
    
    return resources;
  }

  private getExtendedGameplayResources(): ResourceMetadata[] {
    return [
      {
        url: '/audio/background-music.mp3',
        type: 'audio',
        priority: 'medium',
        preload: true,
      },
      {
        url: '/audio/extended-effects.mp3',
        type: 'audio',
        priority: 'low',
        preload: true,
      },
    ];
  }

  private getHighQualityAssets(): ResourceMetadata[] {
    return [
      {
        url: '/audio/high-quality-effects.mp3',
        type: 'audio',
        priority: 'medium',
        preload: true,
      },
      {
        url: '/images/high-res-backgrounds.webp',
        type: 'image',
        priority: 'low',
        preload: true,
      },
    ];
  }

  private getLowQualityAssets(): ResourceMetadata[] {
    return [
      {
        url: '/audio/compressed-effects.mp3',
        type: 'audio',
        priority: 'high',
        preload: true,
      },
    ];
  }

  private getEssentialAssets(): ResourceMetadata[] {
    return [
      {
        url: '/audio/essential-sounds.mp3',
        type: 'audio',
        priority: 'high',
        preload: true,
      },
      {
        url: '/fonts/game-font.woff2',
        type: 'font',
        priority: 'high',
        preload: true,
      },
    ];
  }
}