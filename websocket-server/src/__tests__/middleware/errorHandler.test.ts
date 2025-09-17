import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  errorHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ExternalServiceError,
  asyncHandler
} from '../../middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('test-user-agent')
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    next = vi.fn();
  });

  describe('Error Types', () => {
    it('should handle ValidationError correctly', () => {
      const error = new ValidationError('Invalid input');
      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid input',
          code: 'VALIDATION_ERROR'
        })
      );
    });

    it('should handle AuthenticationError correctly', () => {
      const error = new AuthenticationError();
      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Authentication failed',
          code: 'AUTHENTICATION_ERROR'
        })
      );
    });

    it('should handle AuthorizationError correctly', () => {
      const error = new AuthorizationError();
      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Access denied',
          code: 'AUTHORIZATION_ERROR'
        })
      );
    });

    it('should handle NotFoundError correctly', () => {
      const error = new NotFoundError();
      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Resource not found',
          code: 'NOT_FOUND'
        })
      );
    });

    it('should handle RateLimitError correctly', () => {
      const error = new RateLimitError();
      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED'
        })
      );
    });

    it('should handle ExternalServiceError correctly', () => {
      const error = new ExternalServiceError('Service unavailable', 'twilio');
      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Service unavailable',
          code: 'EXTERNAL_SERVICE_ERROR_TWILIO'
        })
      );
    });
  });

  describe('Twilio Error Handling', () => {
    it('should handle Twilio authentication errors', () => {
      const error = { name: 'TwilioError', code: 20003, message: 'Auth failed' };
      errorHandler(error as Error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid Twilio credentials',
          code: 'TWILIO_20003'
        })
      );
    });

    it('should handle Twilio invalid phone number errors', () => {
      const error = { name: 'TwilioError', code: 21211, message: 'Invalid number' };
      errorHandler(error as Error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid phone number',
          code: 'TWILIO_21211'
        })
      );
    });
  });

  describe('JWT Error Handling', () => {
    it('should handle JWT invalid token errors', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid token',
          code: 'JWT_ERROR'
        })
      );
    });

    it('should handle JWT expired token errors', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Token expired',
          code: 'JWT_EXPIRED'
        })
      );
    });
  });

  describe('Generic Error Handling', () => {
    it('should handle unknown errors in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Unknown error');
      error.stack = 'Error stack trace';
      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unknown error',
          code: 'INTERNAL_ERROR',
          stack: 'Error stack trace'
        })
      );
    });

    it('should hide error details in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Sensitive error');
      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        })
      );
      expect(res.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          stack: expect.anything()
        })
      );
    });
  });

  describe('Async Handler', () => {
    it('should handle async functions correctly', async () => {
      const asyncFn = vi.fn().mockResolvedValue('success');
      const wrapped = asyncHandler(asyncFn);

      await wrapped(req as Request, res as Response, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it('should catch async errors and pass to next', async () => {
      const error = new Error('Async error');
      const asyncFn = vi.fn().mockRejectedValue(error);
      const wrapped = asyncHandler(asyncFn);

      await wrapped(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});