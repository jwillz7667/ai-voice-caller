import { Request, Response, NextFunction } from 'express';
import { logAPIRequest } from '../services/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Log request
  console.log(`${req.method} ${req.path} - ${req.ip}`);

  // Capture the original end function
  const originalEnd = res.end;

  // Override the end function to log response
  res.end = function(...args: any[]) {
    const duration = Date.now() - startTime;
    logAPIRequest(req.method, req.path, res.statusCode, duration);

    // Call the original end function
    originalEnd.apply(res, args);
  };

  next();
}