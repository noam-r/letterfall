import { Text, TextStyle } from 'pixi.js';

export interface PooledLetterEntity {
  id: number;
  char: string;
  letter: string; // Alias for char for compatibility
  display: Text;
  x: number; // Position x
  y: number; // Position y
  velocity: number;
  age: number;
  isActive: boolean;
}

export interface LetterEntityPoolConfig {
  initialSize: number;
  maxSize: number;
  textStyle?: TextStyle;
  style?: TextStyle; // Alternative property name for compatibility
}

/**
 * Object pool for PixiJS Text entities to reduce garbage collection pressure
 * and improve performance by reusing letter display objects.
 */
export class LetterEntityPool {
  private readonly pool: Text[] = [];
  private readonly activeEntities = new WeakMap<Text, PooledLetterEntity>();
  private readonly config: LetterEntityPoolConfig;
  private nextId = 0;
  private activeCount = 0;

  constructor(config: LetterEntityPoolConfig) {
    this.config = config;
    this.initializePool();
  }

  /**
   * Initialize the pool with the specified number of Text objects
   */
  private initializePool(): void {
    for (let i = 0; i < this.config.initialSize; i++) {
      const text = this.createTextObject();
      this.pool.push(text);
    }
  }

  /**
   * Create a new Text object with the configured style
   */
  private createTextObject(): Text {
    const style = this.config.textStyle || this.config.style;
    const text = new Text({
      text: '',
      style: style,
    });
    text.anchor.set(0.5);
    text.alpha = 0.95;
    text.eventMode = 'static';
    text.cursor = 'pointer';
    text.visible = false; // Hidden by default when in pool
    return text;
  }

  /**
   * Get a letter entity from the pool or create a new one if pool is empty
   */
  acquire(char: string, x: number, y: number, velocity: number = 0): PooledLetterEntity {
    let text: Text;

    if (this.pool.length > 0) {
      text = this.pool.pop()!;
    } else {
      // Pool is empty, create new object (but respect max size)
      if (this.getActiveCount() >= this.config.maxSize) {
        throw new Error(`LetterEntityPool: Maximum pool size (${this.config.maxSize}) exceeded`);
      }
      text = this.createTextObject();
    }

    // Reset and configure the text object
    text.text = char;
    text.x = x;
    text.y = y;
    text.visible = true;
    text.scale.set(1);
    text.removeAllListeners();

    const entity: PooledLetterEntity = {
      id: this.nextId++,
      char,
      letter: char, // Alias for compatibility
      x,
      y,
      display: text,
      velocity,
      age: 0,
      isActive: true,
    };

    // Track the entity using WeakMap
    this.activeEntities.set(text, entity);
    this.activeCount++;

    return entity;
  }

  /**
   * Return a letter entity to the pool for reuse
   */
  release(entity: PooledLetterEntity): void {
    if (!entity.isActive) {
      console.warn('LetterEntityPool: Attempting to release already released entity');
      return;
    }

    const text = entity.display;
    
    // Clean up the text object
    text.removeAllListeners();
    text.visible = false;
    text.x = 0;
    text.y = 0;
    text.text = '';
    text.scale.set(1);

    // Mark entity as inactive
    entity.isActive = false;

    // Remove from active tracking
    this.activeEntities.delete(text);
    this.activeCount--;

    // Return to pool if there's space
    if (this.pool.length < this.config.maxSize) {
      this.pool.push(text);
    } else {
      // Pool is full, destroy the object
      text.destroy();
    }
  }

  /**
   * Get the entity associated with a Text object
   */
  getEntity(text: Text): PooledLetterEntity | undefined {
    return this.activeEntities.get(text);
  }

  /**
   * Get the number of currently active entities
   */
  getActiveCount(): number {
    return this.activeCount;
  }

  /**
   * Get the number of entities currently in the pool (available for reuse)
   */
  getPoolSize(): number {
    return this.pool.length;
  }

  /**
   * Get the total number of entities created (active + pooled)
   */
  getTotalCreated(): number {
    return this.nextId;
  }

  /**
   * Get pool statistics for monitoring
   */
  getStats(): {
    poolSize: number;
    activeCount: number;
    totalCreated: number;
    hitRate: number;
  } {
    const poolSize = this.getPoolSize();
    const activeCount = this.getActiveCount();
    const totalCreated = this.getTotalCreated();
    const hitRate = totalCreated > 0 ? (totalCreated - this.config.initialSize) / totalCreated : 0;

    return {
      poolSize,
      activeCount,
      totalCreated,
      hitRate,
    };
  }

  /**
   * Clear all entities and reset the pool
   */
  clear(): void {
    // Destroy all pooled objects
    for (const text of this.pool) {
      text.destroy();
    }
    this.pool.length = 0;

    // Note: Active entities will be cleaned up when they're released
    // We can't force cleanup of WeakMap entries, but they'll be garbage collected
    
    this.nextId = 0;
    this.activeCount = 0;
    this.initializePool();
  }

  /**
   * Destroy the pool and all its objects
   */
  destroy(): void {
    // Destroy all pooled objects
    for (const text of this.pool) {
      text.destroy();
    }
    this.pool.length = 0;

    // Clear the WeakMap (though it will be garbage collected anyway)
    // Note: We can't iterate over WeakMap to destroy active entities
    // They should be properly released by the caller before destroying the pool
  }

  /**
   * Perform automatic cleanup - remove entities that have been inactive too long
   * This helps prevent memory leaks from entities that weren't properly released
   */
  performCleanup(): void {
    // Since we're using WeakMap, inactive entities should be automatically
    // garbage collected when no other references exist
    
    // We can trim the pool if it's grown too large
    const targetSize = Math.min(this.config.initialSize, this.config.maxSize);
    while (this.pool.length > targetSize) {
      const text = this.pool.pop();
      if (text) {
        text.destroy();
      }
    }
  }

  /**
   * Cleanup method for compatibility with tests
   */
  cleanup(): void {
    this.performCleanup();
  }
}