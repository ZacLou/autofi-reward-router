import { logger } from './logger';

export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: Error | null = null;
  let delay = delayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        logger.warn(`Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoffMultiplier;
      }
    }
  }

  throw lastError || new Error('Retry failed');
}
