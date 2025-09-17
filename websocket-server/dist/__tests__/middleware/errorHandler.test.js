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
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const errorHandler_1 = require("../../middleware/errorHandler");
(0, vitest_1.describe)('Error Handler Middleware', () => {
    let req;
    let res;
    let next;
    (0, vitest_1.beforeEach)(() => {
        req = {
            method: 'GET',
            path: '/test',
            ip: '127.0.0.1',
            get: vitest_1.vi.fn().mockReturnValue('test-user-agent')
        };
        res = {
            status: vitest_1.vi.fn().mockReturnThis(),
            json: vitest_1.vi.fn().mockReturnThis()
        };
        next = vitest_1.vi.fn();
    });
    (0, vitest_1.describe)('Error Types', () => {
        (0, vitest_1.it)('should handle ValidationError correctly', () => {
            const error = new errorHandler_1.ValidationError('Invalid input');
            (0, errorHandler_1.errorHandler)(error, req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                error: 'Invalid input',
                code: 'VALIDATION_ERROR'
            }));
        });
        (0, vitest_1.it)('should handle AuthenticationError correctly', () => {
            const error = new errorHandler_1.AuthenticationError();
            (0, errorHandler_1.errorHandler)(error, req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                error: 'Authentication failed',
                code: 'AUTHENTICATION_ERROR'
            }));
        });
        (0, vitest_1.it)('should handle AuthorizationError correctly', () => {
            const error = new errorHandler_1.AuthorizationError();
            (0, errorHandler_1.errorHandler)(error, req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                error: 'Access denied',
                code: 'AUTHORIZATION_ERROR'
            }));
        });
        (0, vitest_1.it)('should handle NotFoundError correctly', () => {
            const error = new errorHandler_1.NotFoundError();
            (0, errorHandler_1.errorHandler)(error, req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(404);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                error: 'Resource not found',
                code: 'NOT_FOUND'
            }));
        });
        (0, vitest_1.it)('should handle RateLimitError correctly', () => {
            const error = new errorHandler_1.RateLimitError();
            (0, errorHandler_1.errorHandler)(error, req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(429);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                error: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED'
            }));
        });
        (0, vitest_1.it)('should handle ExternalServiceError correctly', () => {
            const error = new errorHandler_1.ExternalServiceError('Service unavailable', 'twilio');
            (0, errorHandler_1.errorHandler)(error, req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(503);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                error: 'Service unavailable',
                code: 'EXTERNAL_SERVICE_ERROR_TWILIO'
            }));
        });
    });
    (0, vitest_1.describe)('Twilio Error Handling', () => {
        (0, vitest_1.it)('should handle Twilio authentication errors', () => {
            const error = { name: 'TwilioError', code: 20003, message: 'Auth failed' };
            (0, errorHandler_1.errorHandler)(error, req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                error: 'Invalid Twilio credentials',
                code: 'TWILIO_20003'
            }));
        });
        (0, vitest_1.it)('should handle Twilio invalid phone number errors', () => {
            const error = { name: 'TwilioError', code: 21211, message: 'Invalid number' };
            (0, errorHandler_1.errorHandler)(error, req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                error: 'Invalid phone number',
                code: 'TWILIO_21211'
            }));
        });
    });
    (0, vitest_1.describe)('JWT Error Handling', () => {
        (0, vitest_1.it)('should handle JWT invalid token errors', () => {
            const error = new Error('Invalid token');
            error.name = 'JsonWebTokenError';
            (0, errorHandler_1.errorHandler)(error, req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                error: 'Invalid token',
                code: 'JWT_ERROR'
            }));
        });
        (0, vitest_1.it)('should handle JWT expired token errors', () => {
            const error = new Error('Token expired');
            error.name = 'TokenExpiredError';
            (0, errorHandler_1.errorHandler)(error, req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(401);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                error: 'Token expired',
                code: 'JWT_EXPIRED'
            }));
        });
    });
    (0, vitest_1.describe)('Generic Error Handling', () => {
        (0, vitest_1.it)('should handle unknown errors in development', () => {
            process.env.NODE_ENV = 'development';
            const error = new Error('Unknown error');
            error.stack = 'Error stack trace';
            (0, errorHandler_1.errorHandler)(error, req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(500);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                error: 'Unknown error',
                code: 'INTERNAL_ERROR',
                stack: 'Error stack trace'
            }));
        });
        (0, vitest_1.it)('should hide error details in production', () => {
            process.env.NODE_ENV = 'production';
            const error = new Error('Sensitive error');
            (0, errorHandler_1.errorHandler)(error, req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(500);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                error: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }));
            (0, vitest_1.expect)(res.json).not.toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                stack: vitest_1.expect.anything()
            }));
        });
    });
    (0, vitest_1.describe)('Async Handler', () => {
        (0, vitest_1.it)('should handle async functions correctly', () => __awaiter(void 0, void 0, void 0, function* () {
            const asyncFn = vitest_1.vi.fn().mockResolvedValue('success');
            const wrapped = (0, errorHandler_1.asyncHandler)(asyncFn);
            yield wrapped(req, res, next);
            (0, vitest_1.expect)(asyncFn).toHaveBeenCalledWith(req, res, next);
            (0, vitest_1.expect)(next).not.toHaveBeenCalled();
        }));
        (0, vitest_1.it)('should catch async errors and pass to next', () => __awaiter(void 0, void 0, void 0, function* () {
            const error = new Error('Async error');
            const asyncFn = vitest_1.vi.fn().mockRejectedValue(error);
            const wrapped = (0, errorHandler_1.asyncHandler)(asyncFn);
            yield wrapped(req, res, next);
            (0, vitest_1.expect)(next).toHaveBeenCalledWith(error);
        }));
    });
});
