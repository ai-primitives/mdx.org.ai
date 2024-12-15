import { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { HonoEnv } from '../types';

export const rateLimitMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const path = new URL(c.req.url).pathname;
  const rateLimiter = c.env.epcis_api;

  if (!rateLimiter || typeof rateLimiter.limit !== 'function') {
    console.warn('Rate limiter not configured, proceeding without rate limiting');
    return next();
  }

  try {
    const { success, limit, reset } = await rateLimiter.limit(`${c.req.method}:${path}`);

    // Set rate limit headers
    c.header('RateLimit-Limit', limit.toString());
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
    if (process.env.NODE_ENV === 'development') {
      // In development, log the error but allow the request
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
