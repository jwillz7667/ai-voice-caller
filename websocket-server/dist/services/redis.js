"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Redis client with connection pooling and automatic reconnection
class RedisService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.initializeRedis();
    }
    initializeRedis() {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            console.warn('[Redis] No REDIS_URL provided, using in-memory fallback');
            return;
        }
        try {
            this.client = new ioredis_1.default(redisUrl, {
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
            this.client.on('reconnecting', (delay) => {
                this.reconnectAttempts++;
                console.log(`[Redis] Reconnecting in ${delay}ms...`);
            });
            this.client.on('end', () => {
                console.log('[Redis] Connection ended');
                this.isConnected = false;
            });
        }
        catch (error) {
            console.error('[Redis] Failed to initialize:', error);
        }
    }
    // Session management methods
    setSession(sessionId_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (sessionId, data, ttl = 3600) {
            if (!this.client) {
                console.warn('[Redis] No client available, session not cached');
                return false;
            }
            try {
                const key = `session:${sessionId}`;
                const value = JSON.stringify(data);
                yield this.client.setex(key, ttl, value);
                return true;
            }
            catch (error) {
                console.error('[Redis] Failed to set session:', error);
                return false;
            }
        });
    }
    getSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                return null;
            }
            try {
                const key = `session:${sessionId}`;
                const value = yield this.client.get(key);
                return value ? JSON.parse(value) : null;
            }
            catch (error) {
                console.error('[Redis] Failed to get session:', error);
                return null;
            }
        });
    }
    deleteSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                return false;
            }
            try {
                const key = `session:${sessionId}`;
                yield this.client.del(key);
                return true;
            }
            catch (error) {
                console.error('[Redis] Failed to delete session:', error);
                return false;
            }
        });
    }
    updateSessionTTL(sessionId_1) {
        return __awaiter(this, arguments, void 0, function* (sessionId, ttl = 3600) {
            if (!this.client) {
                return false;
            }
            try {
                const key = `session:${sessionId}`;
                yield this.client.expire(key, ttl);
                return true;
            }
            catch (error) {
                console.error('[Redis] Failed to update session TTL:', error);
                return false;
            }
        });
    }
    // WebSocket connection tracking
    addWebSocketConnection(sessionId, connectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                return false;
            }
            try {
                const key = `ws:${sessionId}`;
                yield this.client.sadd(key, connectionId);
                yield this.client.expire(key, 3600); // 1 hour TTL
                return true;
            }
            catch (error) {
                console.error('[Redis] Failed to add WebSocket connection:', error);
                return false;
            }
        });
    }
    removeWebSocketConnection(sessionId, connectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                return false;
            }
            try {
                const key = `ws:${sessionId}`;
                yield this.client.srem(key, connectionId);
                return true;
            }
            catch (error) {
                console.error('[Redis] Failed to remove WebSocket connection:', error);
                return false;
            }
        });
    }
    getWebSocketConnections(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                return [];
            }
            try {
                const key = `ws:${sessionId}`;
                return yield this.client.smembers(key);
            }
            catch (error) {
                console.error('[Redis] Failed to get WebSocket connections:', error);
                return [];
            }
        });
    }
    // Cache management
    setCache(key_1, value_1) {
        return __awaiter(this, arguments, void 0, function* (key, value, ttl = 300) {
            if (!this.client) {
                return false;
            }
            try {
                const cacheKey = `cache:${key}`;
                const data = JSON.stringify(value);
                yield this.client.setex(cacheKey, ttl, data);
                return true;
            }
            catch (error) {
                console.error('[Redis] Failed to set cache:', error);
                return false;
            }
        });
    }
    getCache(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                return null;
            }
            try {
                const cacheKey = `cache:${key}`;
                const value = yield this.client.get(cacheKey);
                return value ? JSON.parse(value) : null;
            }
            catch (error) {
                console.error('[Redis] Failed to get cache:', error);
                return null;
            }
        });
    }
    invalidateCache(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                return false;
            }
            try {
                const keys = yield this.client.keys(`cache:${pattern}`);
                if (keys.length > 0) {
                    yield this.client.del(...keys);
                }
                return true;
            }
            catch (error) {
                console.error('[Redis] Failed to invalidate cache:', error);
                return false;
            }
        });
    }
    // Health check
    healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                return {
                    healthy: false,
                    message: 'Redis client not initialized'
                };
            }
            try {
                yield this.client.ping();
                return {
                    healthy: true,
                    message: 'Redis connection is healthy'
                };
            }
            catch (error) {
                return {
                    healthy: false,
                    message: `Redis health check failed: ${error}`
                };
            }
        });
    }
    // Cleanup
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client) {
                yield this.client.quit();
                this.client = null;
                this.isConnected = false;
                console.log('[Redis] Disconnected');
            }
        });
    }
    // Check connection status
    getConnectionStatus() {
        return this.isConnected;
    }
}
// Export singleton instance
exports.redisService = new RedisService();
exports.default = exports.redisService;
