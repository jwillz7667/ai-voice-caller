import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex');
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const SALT_ROUNDS = 12;

export interface JWTPayload {
  sub: string;
  email: string;
  tokenBalance: number;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: 'HS256'
    });
  }

  static generateRefreshToken(userId: string): string {
    return jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256'
    });
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static verifyRefreshToken(token: string): { sub: string } {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as { sub: string };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateApiKey(): string {
    return `sk_${crypto.randomBytes(32).toString('hex')}`;
  }

  static hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      req.user = AuthService.verifyAccessToken(token);
    }

    next();
  } catch {
    next();
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const rateLimiter = (maxRequests: number = 5, windowMs: number = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const identifier = req.user?.sub || req.ip || 'anonymous';
    const now = Date.now();

    const userRequests = requests.get(identifier);

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }

    if (userRequests.count >= maxRequests) {
      const retryAfter = Math.ceil((userRequests.resetTime - now) / 1000);
      res.status(429).json({
        error: 'Too many requests',
        retryAfter
      });
      return;
    }

    userRequests.count++;
    next();
  };
};