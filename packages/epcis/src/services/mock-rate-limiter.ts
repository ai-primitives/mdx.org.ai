import type { RateLimiter } from '../types';

class MockRateLimiter implements RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }>;
  private readonly requestLimit: number;
  private readonly windowPeriod: number;

  constructor(requestLimit = 1000, windowPeriod = 60) {
    this.requests = new Map();
    this.requestLimit = requestLimit;
    this.windowPeriod = windowPeriod;
  }

  async limit(key: string): Promise<{ success: boolean; limit: number; reset: number; remaining: number }> {
    const now = Date.now();
    const entry = this.requests.get(key);

    // Clean up expired entries and handle first request
    if (!entry || entry.resetTime <= now) {
      // Delete expired entry if it exists
      if (entry) {
        this.requests.delete(key);
      }

      // Create new entry for first request or new window
      const resetTime = now + (this.windowPeriod * 1000);
      const newEntry = { count: 1, resetTime };
      this.requests.set(key, newEntry);

      return {
        success: true,
        limit: this.requestLimit,
        reset: this.windowPeriod,
        remaining: this.requestLimit - 1
      };
    }

    // Check if limit exceeded
    if (entry.count >= this.requestLimit) {
      const reset = Math.ceil((entry.resetTime - now) / 1000);
      return {
        success: false,
        limit: this.requestLimit,
        reset,
        remaining: 0
      };
    }

    // Increment request count
    entry.count++;
    const remaining = this.requestLimit - entry.count;
    const reset = Math.ceil((entry.resetTime - now) / 1000);

    return {
      success: true,
      limit: this.requestLimit,
      reset,
      remaining
    };
  }
}

export { MockRateLimiter };
