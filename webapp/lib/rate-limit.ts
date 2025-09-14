import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

// Initialize Redis client if available
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;

// Rate limiter configurations
const rateLimiters = {
  // General API rate limit
  api: redis
    ? new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: 'rl:api',
        points: 100, // Number of requests
        duration: 60, // Per 60 seconds
        blockDuration: 60 * 5, // Block for 5 minutes
      })
    : new RateLimiterMemory({
        keyPrefix: 'rl:api',
        points: 100,
        duration: 60,
        blockDuration: 60 * 5,
      }),

  // Strict rate limit for auth endpoints
  auth: redis
    ? new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: 'rl:auth',
        points: 5,
        duration: 60 * 15, // 5 attempts per 15 minutes
        blockDuration: 60 * 30, // Block for 30 minutes
      })
    : new RateLimiterMemory({
        keyPrefix: 'rl:auth',
        points: 5,
        duration: 60 * 15,
        blockDuration: 60 * 30,
      }),

  // Rate limit for expensive operations (AI calls)
  expensive: redis
    ? new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: 'rl:expensive',
        points: 10,
        duration: 60 * 60, // 10 calls per hour
        blockDuration: 60 * 60, // Block for 1 hour
      })
    : new RateLimiterMemory({
        keyPrefix: 'rl:expensive',
        points: 10,
        duration: 60 * 60,
        blockDuration: 60 * 60,
      }),
};

export type RateLimitType = keyof typeof rateLimiters;

interface RateLimitOptions {
  type?: RateLimitType;
  identifier?: string;
  points?: number;
}

export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  const { type = 'api', identifier, points = 1 } = options;

  // Get identifier (IP or custom identifier)
  const key = identifier ||
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.ip ||
    'unknown';

  const rateLimiter = rateLimiters[type];

  try {
    await rateLimiter.consume(key, points);

    // Log to database for persistent tracking
    await prisma.rateLimit.upsert({
      where: {
        identifier_endpoint_window: {
          identifier: key,
          endpoint: req.nextUrl.pathname,
          window: `${type}:${new Date().getHours()}`,
        },
      },
      create: {
        identifier: key,
        endpoint: req.nextUrl.pathname,
        window: `${type}:${new Date().getHours()}`,
        count: points,
      },
      update: {
        count: {
          increment: points,
        },
      },
    });

    return null; // Request allowed
  } catch (rejRes: any) {
    // Rate limit exceeded
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 60;

    // Update blocked status in database
    await prisma.rateLimit.update({
      where: {
        identifier_endpoint_window: {
          identifier: key,
          endpoint: req.nextUrl.pathname,
          window: `${type}:${new Date().getHours()}`,
        },
      },
      data: {
        blockedUntil: new Date(Date.now() + rejRes.msBeforeNext),
      },
    }).catch(() => {}); // Ignore errors

    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${secs} seconds.`,
        retryAfter: secs,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(secs),
          'X-RateLimit-Limit': String(rateLimiter.points),
          'X-RateLimit-Remaining': String(rejRes.remainingPoints || 0),
          'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
        },
      }
    );
  }
}

// Utility function to check if user is rate limited
export async function isRateLimited(
  identifier: string,
  endpoint: string
): Promise<boolean> {
  const rateLimit = await prisma.rateLimit.findFirst({
    where: {
      identifier,
      endpoint,
      blockedUntil: {
        gt: new Date(),
      },
    },
  });

  return !!rateLimit;
}

// Clean up expired rate limit records
export async function cleanupRateLimits() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  await prisma.rateLimit.deleteMany({
    where: {
      OR: [
        {
          blockedUntil: {
            lt: new Date(),
          },
        },
        {
          updatedAt: {
            lt: oneHourAgo,
          },
        },
      ],
    },
  });
}