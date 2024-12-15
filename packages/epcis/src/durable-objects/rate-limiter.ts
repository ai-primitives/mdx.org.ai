import type { DurableObjectState } from '@cloudflare/workers-types';

export class RateLimiter {
  private state: DurableObjectState;
  private storage: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const key = url.searchParams.get('key') || '';
    const namespace = url.searchParams.get('namespace') || '';

    // Get rate limit configuration based on namespace
    const limits = {
      'epcis_capture': { limit: 1000, period: 60 },
      'epcis_query': { limit: 2000, period: 60 },
      'epcis_subscription': { limit: 500, period: 60 }
    };

    const config = limits[namespace as keyof typeof limits];
    if (!config) {
      return new Response('Invalid namespace', { status: 400 });
    }

    const now = Date.now();
    const entry = this.storage.get(key);

    if (!entry || now >= entry.resetTime) {
      // First request or expired entry
      this.storage.set(key, {
        count: 1,
        resetTime: now + (config.period * 1000)
      });

      return new Response(JSON.stringify({
        success: true,
        limit: config.limit,
        remaining: config.limit - 1,
        reset: config.period
      }));
    }

    // Update existing entry
    const remaining = config.limit - entry.count;
    const success = remaining > 0;

    if (success) {
      this.storage.set(key, {
        count: entry.count + 1,
        resetTime: entry.resetTime
      });
    }

    return new Response(JSON.stringify({
      success,
      limit: config.limit,
      remaining: Math.max(0, remaining),
      reset: Math.ceil((entry.resetTime - now) / 1000)
    }));
  }
}
