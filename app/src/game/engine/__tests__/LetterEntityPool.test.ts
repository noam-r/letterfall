import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TextStyle } from 'pixi.js';
import { LetterEntityPool } from '../LetterEntityPool';

// Mock PixiJS Text class
const mockText = {
  anchor: { set: vi.fn() },
  removeAllListeners: vi.fn(),
  destroy: vi.fn(),
  text: '',
  x: 0,
  y: 0,
  visible: false,
  scale: { set: vi.fn() },
  alpha: 0.95,
  eventMode: 'static',
  cursor: 'pointer',
};

vi.mock('pixi.js', () => ({
  Text: vi.fn(() => ({ ...mockText })),
  TextStyle: vi.fn(),
}));

describe('LetterEntityPool', () => {
  let pool: LetterEntityPool;
  let textStyle: TextStyle;

  beforeEach(() => {
    vi.clearAllMocks();
    textStyle = new TextStyle();
    pool = new LetterEntityPool({
      initialSize: 5,
      maxSize: 10,
      textStyle,
    });
  });

  describe('initialization', () => {
    it('should create initial pool of Text objects', () => {
      const stats = pool.getStats();
      expect(stats.poolSize).toBe(5);
      expect(stats.activeCount).toBe(0);
      expect(stats.totalCreated).toBe(0); // No entities acquired yet
    });
  });

  describe('acquire', () => {
    it('should return a pooled entity with correct properties', () => {
      const entity = pool.acquire('A', 100, 200, 5);
      
      expect(entity.char).toBe('A');
      expect(entity.display.x).toBe(100);
      expect(entity.display.y).toBe(200);
      expect(entity.velocity).toBe(5);
      expect(entity.age).toBe(0);
      expect(entity.isActive).toBe(true);
      expect(entity.display.visible).toBe(true);
    });

    it('should reuse objects from the pool', () => {
      const entity1 = pool.acquire('A', 100, 200, 5);
      pool.release(entity1);
      
      const entity2 = pool.acquire('B', 150, 250, 6);
      
      // Should reuse the same Text object
      expect(entity2.display).toBe(entity1.display);
      expect(entity2.char).toBe('B');
      expect(entity2.display.x).toBe(150);
    });

    it('should create new objects when pool is empty', () => {
      // Acquire all initial objects
      const entities = [];
      for (let i = 0; i < 5; i++) {
        entities.push(pool.acquire(`${i}`, i * 10, i * 20, i));
      }
      
      // Acquire one more (should create new object)
      const newEntity = pool.acquire('X', 500, 600, 10);
      
      expect(newEntity.isActive).toBe(true);
      expect(newEntity.char).toBe('X');
    });

    it('should throw error when exceeding max size', () => {
      // Acquire maximum number of entities
      for (let i = 0; i < 10; i++) {
        pool.acquire(`${i}`, i * 10, i * 20, i);
      }
      
      // Trying to acquire one more should throw
      expect(() => {
        pool.acquire('X', 500, 600, 10);
      }).toThrow('LetterEntityPool: Maximum pool size (10) exceeded');
    });
  });

  describe('release', () => {
    it('should return entity to pool and mark as inactive', () => {
      const entity = pool.acquire('A', 100, 200, 5);
      expect(entity.isActive).toBe(true);
      
      pool.release(entity);
      
      expect(entity.isActive).toBe(false);
      expect(entity.display.visible).toBe(false);
      expect(entity.display.removeAllListeners).toHaveBeenCalled();
    });

    it('should warn when releasing already released entity', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const entity = pool.acquire('A', 100, 200, 5);
      pool.release(entity);
      pool.release(entity); // Release again
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'LetterEntityPool: Attempting to release already released entity'
      );
      
      consoleSpy.mockRestore();
    });

    it('should respect pool size limits when releasing entities', () => {
      // Acquire maximum entities
      const entities = [];
      for (let i = 0; i < 10; i++) {
        entities.push(pool.acquire(`${i}`, i * 10, i * 20, i));
      }
      
      // Release all entities
      entities.forEach(entity => pool.release(entity));
      
      // Pool size should not exceed maxSize
      expect(pool.getPoolSize()).toBeLessThanOrEqual(10);
      expect(pool.getActiveCount()).toBe(0);
    });
  });

  describe('getEntity', () => {
    it('should return entity associated with Text object', () => {
      const entity = pool.acquire('A', 100, 200, 5);
      const retrieved = pool.getEntity(entity.display);
      
      expect(retrieved).toBe(entity);
    });

    it('should return undefined for unknown Text object', () => {
      const unknownText = { ...mockText };
      const retrieved = pool.getEntity(unknownText as any);
      
      expect(retrieved).toBeUndefined();
    });
  });

  describe('statistics', () => {
    it('should track pool statistics correctly', () => {
      const entity1 = pool.acquire('A', 100, 200, 5);
      const entity2 = pool.acquire('B', 150, 250, 6);
      
      const stats = pool.getStats();
      expect(stats.activeCount).toBe(2);
      expect(stats.poolSize).toBe(3); // 5 initial - 2 acquired
      expect(stats.totalCreated).toBe(2);
      
      pool.release(entity1);
      
      const statsAfterRelease = pool.getStats();
      expect(statsAfterRelease.activeCount).toBe(1);
      expect(statsAfterRelease.poolSize).toBe(4); // 3 + 1 returned
      
      // Clean up entity2
      pool.release(entity2);
    });
  });

  describe('cleanup', () => {
    it('should trim pool to target size during cleanup', () => {
      // Create many entities and release them to grow the pool
      const entities = [];
      for (let i = 0; i < 8; i++) {
        entities.push(pool.acquire(`${i}`, i * 10, i * 20, i));
      }
      
      entities.forEach(entity => pool.release(entity));
      
      // Pool should be larger than initial size
      expect(pool.getPoolSize()).toBeGreaterThan(5);
      
      pool.performCleanup();
      
      // After cleanup, pool should be trimmed back to initial size
      expect(pool.getPoolSize()).toBeLessThanOrEqual(5);
    });
  });

  describe('clear', () => {
    it('should destroy all pooled objects and reset', () => {
      const entity = pool.acquire('A', 100, 200, 5);
      pool.release(entity);
      
      pool.clear();
      
      const stats = pool.getStats();
      expect(stats.poolSize).toBe(5); // Back to initial size
      expect(stats.totalCreated).toBe(0); // Reset counter
      expect(mockText.destroy).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should destroy all pooled objects', () => {
      pool.destroy();
      
      expect(mockText.destroy).toHaveBeenCalled();
      expect(pool.getPoolSize()).toBe(0);
    });
  });
});