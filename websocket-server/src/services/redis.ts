import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Redis client with connection pooling and automatic reconnection
class RedisService {
  private client: Redis | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn('[Redis] No REDIS_URL provided, using in-memory fallback');
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => {
          if (times > this.maxReconnectAttempts) {
            console.error('[Redis] Max reconnection attempts reached');
            return null;
          }
          const delay = Math.min(times * 1000, 30000); // Max 30 seconds
          console.log(`[Redis] Reconnecting in ${delay}ms... (attempt ${times}/${this.maxReconnectAttempts})`);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            // Only reconnect when the error contains "READONLY"
            return true;
          }
          return false;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        keepAlive: 30000, // 30 seconds
        connectTimeout: 10000, // 10 seconds
      });

      this.client.on('connect', () => {
        console.log('[Redis] Connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.client.on('ready', () => {
        console.log('[Redis] Ready to accept commands');
      });

      this.client.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('[Redis] Connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', (delay: number) => {
        this.reconnectAttempts++;
        console.log(`[Redis] Reconnecting in ${delay}ms...`);
      });

      this.client.on('end', () => {
        console.log('[Redis] Connection ended');
        this.isConnected = false;
      });
    } catch (error) {
      console.error('[Redis] Failed to initialize:', error);
    }
  }

  // Session management methods
  async setSession(sessionId: string, data: any, ttl: number = 3600): Promise<boolean> {
    if (!this.client) {
      console.warn('[Redis] No client available, session not cached');
      return false;
    }

    try {
      const key = `session:${sessionId}`;
      const value = JSON.stringify(data);
      await this.client.setex(key, ttl, value);
      return true;
    } catch (error) {
      console.error('[Redis] Failed to set session:', error);
      return false;
    }
  }

  async getSession(sessionId: string): Promise<any | null> {
    if (!this.client) {
      return null;
    }

    try {
      const key = `session:${sessionId}`;
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('[Redis] Failed to get session:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const key = `session:${sessionId}`;
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('[Redis] Failed to delete session:', error);
      return false;
    }
  }

  async updateSessionTTL(sessionId: string, ttl: number = 3600): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const key = `session:${sessionId}`;
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('[Redis] Failed to update session TTL:', error);
      return false;
    }
  }

  // WebSocket connection tracking
  async addWebSocketConnection(sessionId: string, connectionId: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const key = `ws:${sessionId}`;
      await this.client.sadd(key, connectionId);
      await this.client.expire(key, 3600); // 1 hour TTL
      return true;
    } catch (error) {
      console.error('[Redis] Failed to add WebSocket connection:', error);
      return false;
    }
  }

  async removeWebSocketConnection(sessionId: string, connectionId: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const key = `ws:${sessionId}`;
      await this.client.srem(key, connectionId);
      return true;
    } catch (error) {
      console.error('[Redis] Failed to remove WebSocket connection:', error);
      return false;
    }
  }

  async getWebSocketConnections(sessionId: string): Promise<string[]> {
    if (!this.client) {
      return [];
    }

    try {
      const key = `ws:${sessionId}`;
      return await this.client.smembers(key);
    } catch (error) {
      console.error('[Redis] Failed to get WebSocket connections:', error);
      return [];
    }
  }

  // Cache management
  async setCache(key: string, value: any, ttl: number = 300): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const cacheKey = `cache:${key}`;
      const data = JSON.stringify(value);
      await this.client.setex(cacheKey, ttl, data);
      return true;
    } catch (error) {
      console.error('[Redis] Failed to set cache:', error);
      return false;
    }
  }

  async getCache(key: string): Promise<any | null> {
    if (!this.client) {
      return null;
    }

    try {
      const cacheKey = `cache:${key}`;
      const value = await this.client.get(cacheKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('[Redis] Failed to get cache:', error);
      return null;
    }
  }

  async invalidateCache(pattern: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(`cache:${pattern}`);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('[Redis] Failed to invalidate cache:', error);
      return false;
    }
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    if (!this.client) {
      return {
        healthy: false,
        message: 'Redis client not initialized'
      };
    }

    try {
      await this.client.ping();
      return {
        healthy: true,
        message: 'Redis connection is healthy'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Redis health check failed: ${error}`
      };
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log('[Redis] Disconnected');
    }
  }

  // Check connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const redisService = new RedisService();
export default redisService;