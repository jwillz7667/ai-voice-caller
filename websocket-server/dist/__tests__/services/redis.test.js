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
const vitest_1 = require("vitest");
const redis_1 = __importDefault(require("../../services/redis"));
// Mock ioredis
vitest_1.vi.mock('ioredis', () => {
    const Redis = vitest_1.vi.fn(() => ({
        setex: vitest_1.vi.fn().mockResolvedValue('OK'),
        get: vitest_1.vi.fn().mockResolvedValue(null),
        del: vitest_1.vi.fn().mockResolvedValue(1),
        expire: vitest_1.vi.fn().mockResolvedValue(1),
        sadd: vitest_1.vi.fn().mockResolvedValue(1),
        srem: vitest_1.vi.fn().mockResolvedValue(1),
        smembers: vitest_1.vi.fn().mockResolvedValue([]),
        keys: vitest_1.vi.fn().mockResolvedValue([]),
        ping: vitest_1.vi.fn().mockResolvedValue('PONG'),
        on: vitest_1.vi.fn(),
        quit: vitest_1.vi.fn().mockResolvedValue('OK'),
    }));
    return { default: Redis };
});
(0, vitest_1.describe)('Redis Service', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('Session Management', () => {
        (0, vitest_1.it)('should handle session operations when Redis is not available', () => __awaiter(void 0, void 0, void 0, function* () {
            // Test setSession
            const result = yield redis_1.default.setSession('test-session', { userId: '123' });
            (0, vitest_1.expect)(result).toBe(false);
            // Test getSession
            const session = yield redis_1.default.getSession('test-session');
            (0, vitest_1.expect)(session).toBeNull();
            // Test deleteSession
            const deleted = yield redis_1.default.deleteSession('test-session');
            (0, vitest_1.expect)(deleted).toBe(false);
            // Test updateSessionTTL
            const updated = yield redis_1.default.updateSessionTTL('test-session');
            (0, vitest_1.expect)(updated).toBe(false);
        }));
    });
    (0, vitest_1.describe)('WebSocket Connection Tracking', () => {
        (0, vitest_1.it)('should handle WebSocket connection operations', () => __awaiter(void 0, void 0, void 0, function* () {
            // Test addWebSocketConnection
            const added = yield redis_1.default.addWebSocketConnection('session-1', 'conn-1');
            (0, vitest_1.expect)(added).toBe(false);
            // Test getWebSocketConnections
            const connections = yield redis_1.default.getWebSocketConnections('session-1');
            (0, vitest_1.expect)(connections).toEqual([]);
            // Test removeWebSocketConnection
            const removed = yield redis_1.default.removeWebSocketConnection('session-1', 'conn-1');
            (0, vitest_1.expect)(removed).toBe(false);
        }));
    });
    (0, vitest_1.describe)('Cache Management', () => {
        (0, vitest_1.it)('should handle cache operations', () => __awaiter(void 0, void 0, void 0, function* () {
            // Test setCache
            const cached = yield redis_1.default.setCache('test-key', { data: 'test' });
            (0, vitest_1.expect)(cached).toBe(false);
            // Test getCache
            const data = yield redis_1.default.getCache('test-key');
            (0, vitest_1.expect)(data).toBeNull();
            // Test invalidateCache
            const invalidated = yield redis_1.default.invalidateCache('test-*');
            (0, vitest_1.expect)(invalidated).toBe(false);
        }));
    });
    (0, vitest_1.describe)('Health Check', () => {
        (0, vitest_1.it)('should return unhealthy when Redis is not initialized', () => __awaiter(void 0, void 0, void 0, function* () {
            const health = yield redis_1.default.healthCheck();
            (0, vitest_1.expect)(health.healthy).toBe(false);
            (0, vitest_1.expect)(health.message).toContain('not initialized');
        }));
    });
    (0, vitest_1.describe)('Connection Management', () => {
        (0, vitest_1.it)('should handle disconnect gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, vitest_1.expect)(redis_1.default.disconnect()).resolves.not.toThrow();
        }));
        (0, vitest_1.it)('should report connection status', () => {
            const status = redis_1.default.getConnectionStatus();
            (0, vitest_1.expect)(typeof status).toBe('boolean');
        });
    });
});
