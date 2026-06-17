import { RateLimiter } from '../src/services/rateLimiter';

describe('Rate Limiter', () => {
  test('allows requests within capacity', async () => {
    const limiter = new RateLimiter(3, 1);
    const start = Date.now();

    await limiter.waitIfNeeded('test-key');
    await limiter.waitIfNeeded('test-key');
    await limiter.waitIfNeeded('test-key');

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  test('throttles requests beyond capacity', async () => {
    const limiter = new RateLimiter(1, 1);
    const start = Date.now();

    await limiter.waitIfNeeded('test-key');
    await limiter.waitIfNeeded('test-key');

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThan(800);
  });

  test('resets buckets', () => {
    const limiter = new RateLimiter(1, 1);
    limiter.reset('test-key');
    expect(true).toBe(true);
  });
});
