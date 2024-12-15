import { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { HonoEnv } from '../types';

const RATE_LIMIT_WINDOW = 60; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute

interface RateLimitInfo {
  count: number;
  timestamp: number;
}

export const rateLimitMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const tenantId = c.req.header('X-Tenant-ID');

  if (!tenantId) {
    throw new HTTPException(401, { message: 'Missing X-Tenant-ID header' });
  }

  const kv = c.env.EPCIS_KV;
  const key = `rate_limit:${tenantId}:${Math.floor(Date.now() / (RATE_LIMIT_WINDOW * 1000))}`;

  let info: RateLimitInfo | null = await kv.get(key, 'json');
  const now = Date.now();

  if (!info || (now - info.timestamp) >= RATE_LIMIT_WINDOW * 1000) {
    info = { count: 0, timestamp: now };
  }

  if (info.count >= MAX_REQUESTS_PER_WINDOW) {
    throw new HTTPException(429, {
      message: 'Rate limit exceeded. Please try again later.',
    });
  }

  // Increment counter
  info.count++;
  await kv.put(key, JSON.stringify(info), {
    expirationTtl: RATE_LIMIT_WINDOW * 2 // Double the window for safety
  });

  // Set rate limit headers
  c.header('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
  c.header('X-RateLimit-Remaining', (MAX_REQUESTS_PER_WINDOW - info.count).toString());
  c.header('X-RateLimit-Reset', (info.timestamp + RATE_LIMIT_WINDOW * 1000).toString());

  await next();
};
