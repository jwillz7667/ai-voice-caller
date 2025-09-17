import { Request, Response, NextFunction } from 'express';

// Error types
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, service: string) {
    super(message, 503, `EXTERNAL_SERVICE_ERROR_${service.toUpperCase()}`);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log error details
  const errorDetails = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  };

  console.error('[ErrorHandler]', errorDetails);

  // Handle specific error types
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }

  // Handle Twilio errors
  if (err.name === 'TwilioError' || (err as any).code?.toString().startsWith('2')) {
    const twilioError = err as any;
    let statusCode = 500;
    let message = 'Twilio service error';

    // Map common Twilio error codes
    switch (twilioError.code) {
      case 20003:
        statusCode = 401;
        message = 'Invalid Twilio credentials';
        break;
      case 21211:
      case 21214:
      case 21217:
        statusCode = 400;
        message = 'Invalid phone number';
        break;
      case 21608:
        statusCode = 400;
        message = 'Phone number not verified';
        break;
      default:
        message = twilioError.message || 'Twilio service error';
    }

    return res.status(statusCode).json({
      error: message,
      code: `TWILIO_${twilioError.code}`,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }

  // Handle OpenAI errors
  if (err.message?.includes('OpenAI') || err.message?.includes('GPT')) {
    return res.status(503).json({
      error: 'AI service temporarily unavailable',
      code: 'OPENAI_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }

  // Handle validation errors (from body-parser, etc.)
  if (err.name === 'ValidationError' || err.name === 'SyntaxError') {
    return res.status(400).json({
      error: 'Invalid request data',
      code: 'VALIDATION_ERROR',
      details: err.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'JWT_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      code: 'JWT_EXPIRED',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }

  // Default error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(isDevelopment && { stack: err.stack })
  });
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler (for undefined routes)
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

// Request validation middleware factory
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new ValidationError(
        `Validation failed: ${result.error.errors.map((e: any) => e.message).join(', ')}`
      ));
    }
    req.body = result.data;
    next();
  };
};