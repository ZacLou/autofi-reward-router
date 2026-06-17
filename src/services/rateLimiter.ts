import { logger } from '../utils/logger';

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map();
  private readonly capacity: number;
  private readonly refillRatePerSecond: number;

  constructor(capacity: number = 10, refillRatePerSecond: number = 1) {
    this.capacity = capacity;
    this.refillRatePerSecond = refillRatePerSecond;
  }

  async waitIfNeeded(key: string): Promise<void> {
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: Date.now() };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on elapsed time
    const now = Date.now();
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsedSeconds * this.refillRatePerSecond);
    bucket.lastRefill = now;

    if (bucket.tokens < 1) {
      const waitTime = (1 - bucket.tokens) / this.refillRatePerSecond * 1000;
      logger.debug(`Rate limit: waiting ${Math.ceil(waitTime)}ms for ${key}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      bucket.tokens = 0;
    } else {
      bucket.tokens -= 1;
    }
  }

  reset(key?: string): void {
    if (key) {
      this.buckets.delete(key);
    } else {
      this.buckets.clear();
    }
  }
}

export const listenerRateLimiter = new RateLimiter(5, 0.5); // 5 calls per 10 seconds
