import { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { HonoEnv } from '../types';

const NAMESPACE_MAP = {
  '/capture': 'epcis_capture',
  '/query': 'epcis_query',
  '/subscription': 'epcis_subscription'
} as const;

export const rateLimitMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const path = new URL(c.req.url).pathname;
  const namespace = Object.entries(NAMESPACE_MAP).find(([prefix]) => path.startsWith(prefix))?.[1];

  if (!namespace) {
    return next();
  }

  const rateLimiter = c.env[namespace];
  if (!rateLimiter) {
    console.warn(`Rate limiter not found for namespace: ${namespace}`);
    return next();
  }

  try {
    const { success, limit, remaining, reset } = await rateLimiter.limit(
      `${c.req.method}:${path}`
    );

    // Set rate limit headers
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
