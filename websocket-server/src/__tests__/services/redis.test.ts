import { describe, it, expect, beforeEach, vi } from 'vitest';
import redisService from '../../services/redis';

// Mock ioredis
vi.mock('ioredis', () => {
  const Redis = vi.fn(() => ({
    setex: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    sadd: vi.fn().mockResolvedValue(1),
    srem: vi.fn().mockResolvedValue(1),
    smembers: vi.fn().mockResolvedValue([]),
    keys: vi.fn().mockResolvedValue([]),
    ping: vi.fn().mockResolvedValue('PONG'),
    on: vi.fn(),
    quit: vi.fn().mockResolvedValue('OK'),
  }));
  return { default: Redis };
});

describe('Redis Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should handle session operations when Redis is not available', async () => {
      // Test setSession
      const result = await redisService.setSession('test-session', { userId: '123' });
      expect(result).toBe(false);

      // Test getSession
      const session = await redisService.getSession('test-session');
      expect(session).toBeNull();

      // Test deleteSession
      const deleted = await redisService.deleteSession('test-session');
      expect(deleted).toBe(false);

      // Test updateSessionTTL
      const updated = await redisService.updateSessionTTL('test-session');
      expect(updated).toBe(false);
    });
  });

  describe('WebSocket Connection Tracking', () => {
    it('should handle WebSocket connection operations', async () => {
      // Test addWebSocketConnection
      const added = await redisService.addWebSocketConnection('session-1', 'conn-1');
      expect(added).toBe(false);

      // Test getWebSocketConnections
      const connections = await redisService.getWebSocketConnections('session-1');
      expect(connections).toEqual([]);

      // Test removeWebSocketConnection
      const removed = await redisService.removeWebSocketConnection('session-1', 'conn-1');
      expect(removed).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should handle cache operations', async () => {
      // Test setCache
      const cached = await redisService.setCache('test-key', { data: 'test' });
      expect(cached).toBe(false);

      // Test getCache
      const data = await redisService.getCache('test-key');
      expect(data).toBeNull();

      // Test invalidateCache
      const invalidated = await redisService.invalidateCache('test-*');
      expect(invalidated).toBe(false);
    });
  });

  describe('Health Check', () => {
    it('should return unhealthy when Redis is not initialized', async () => {
      const health = await redisService.healthCheck();
      expect(health.healthy).toBe(false);
      expect(health.message).toContain('not initialized');
    });
  });

  describe('Connection Management', () => {
    it('should handle disconnect gracefully', async () => {
      await expect(redisService.disconnect()).resolves.not.toThrow();
    });

    it('should report connection status', () => {
      const status = redisService.getConnectionStatus();
      expect(typeof status).toBe('boolean');
    });
  });
});