import { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { HonoEnv } from '../types';

const isDevelopment = process.env.NODE_ENV === 'development';

export const rateLimitMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const path = new URL(c.req.url).pathname;
  const rateLimiter = c.env.epcis_api;

  // Development mode handling
  if (isDevelopment) {
    if (!rateLimiter || typeof rateLimiter.limit !== 'function') {
      console.warn('[Development] Rate limiter not configured, simulating rate limiting');
      // Simulate rate limit headers in development
      c.header('RateLimit-Limit', '1000');
      c.header('RateLimit-Remaining', '999');
      c.header('RateLimit-Reset', Math.floor(Date.now() / 1000 + 60).toString());
      return next();
    }
  }

  // Production environment check
  if (!rateLimiter || typeof rateLimiter.limit !== 'function') {
    console.error('Rate limiter service binding not configured correctly');
    return c.json(
      {
        type: 'epcisException:ImplementationException',
        title: 'Rate limiting configuration error',
        status: 500,
        detail: 'Rate limiting service is not properly configured'
      },
      500
    );
  }

  try {
    const { success, limit, reset } = await rateLimiter.limit(`${c.req.method}:${path}`);
    const remaining = success ? limit - 1 : 0;

    // Set standard rate limit headers (RFC 6585)
    c.header('RateLimit-Limit', limit.toString());
    c.header('RateLimit-Remaining', remaining.toString());
    c.header('RateLimit-Reset', reset.toString());

    if (!success) {
      return c.json(
        {
          type: 'epcisException:TooManyRequests',
          title: 'Rate limit exceeded',
          status: 429,
          detail: `Rate limit of ${limit} requests per minute exceeded. Reset in ${reset} seconds.`
        },
        429
      );
    }

    return next();
  } catch (error) {
    console.error('Rate limiting error:', error);

    if (isDevelopment) {
      console.warn('[Development] Rate limiting error occurred, allowing request');
      return next();
    }

    return c.json(
      {
        type: 'epcisException:ImplementationException',
        title: 'Rate limiting error',
        status: 500,
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
};
