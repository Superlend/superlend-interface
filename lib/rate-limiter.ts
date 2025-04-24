import { NextResponse } from 'next/server';
import { Redis } from 'ioredis';

// Initialize Redis client if REDIS_URL is available
let redis: Redis | null = null;
const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  redis = new Redis(REDIS_URL);
  redis.on('error', (err: Error) => {
    console.error('Redis connection error:', err);
    redis = null;
  });
}

// In-memory fallback (for local development or if Redis isn't available)
const inMemoryStore: Record<string, { count: number; expiry: number }> = {};

// Cleanup expired in-memory rate limits periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const key in inMemoryStore) {
      if (inMemoryStore[key].expiry < now) {
        delete inMemoryStore[key];
      }
    }
  }, 60000); // Clean up every minute
}

/**
 * Check if a request is within rate limits
 * @param identifier The unique identifier (IP address or other ID)
 * @param limit Maximum number of requests in the time window
 * @param windowMs Time window in milliseconds
 * @returns Boolean indicating if the request is allowed
 */
export async function isWithinRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000, // 1 minute
): Promise<boolean> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowSec = Math.floor(windowMs / 1000);

  // Try using Redis first if available
  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSec);
      }
      return count <= limit;
    } catch (error) {
      console.error('Redis rate limiting error:', error);
      // Fall back to in-memory if Redis fails
    }
  }

  // In-memory fallback
  if (!inMemoryStore[key]) {
    inMemoryStore[key] = { count: 1, expiry: now + windowMs };
    return true;
  }

  // If the rate limit window has expired, reset the counter
  if (inMemoryStore[key].expiry < now) {
    inMemoryStore[key] = { count: 1, expiry: now + windowMs };
    return true;
  }

  // Increment the counter
  inMemoryStore[key].count++;
  return inMemoryStore[key].count <= limit;
}

/**
 * Get the client's IP address from a request
 * @param request The request object
 * @returns The client's IP address
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return 'unknown-ip';
}

/**
 * Apply rate limiting to a request
 * @param request The request object
 * @param customIdentifier Optional custom identifier to use instead of IP
 * @param limit Maximum number of requests in the time window
 * @param windowMs Time window in milliseconds
 * @returns NextResponse or null if within rate limits
 */
export async function applyRateLimit(
  request: Request,
  customIdentifier?: string,
  limit: number = 10,
  windowMs: number = 60000, // 1 minute
): Promise<NextResponse | null> {
  const identifier = customIdentifier || getClientIp(request);
  const allowed = await isWithinRateLimit(identifier, limit, windowMs);

  if (!allowed) {
    console.log(`Rate limit exceeded for ${identifier}`);
    return NextResponse.json(
      { success: false, message: 'Too many requests, please try again later' },
      { status: 429 }
    );
  }

  return null;
} 