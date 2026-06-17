import { logger } from '../utils/logger';

export interface ErrorRecoveryContext {
  error: Error;
  context: string;
  attempt: number;
  maxAttempts: number;
}

type RecoveryHandler = (ctx: ErrorRecoveryContext) => Promise<boolean>;

const recoveryHandlers: Map<string, RecoveryHandler> = new Map();

export function registerRecoveryHandler(errorType: string, handler: RecoveryHandler): void {
  recoveryHandlers.set(errorType, handler);
  logger.debug(`Registered recovery handler for ${errorType}`);
}

export async function attemptRecovery(ctx: ErrorRecoveryContext): Promise<boolean> {
  const errorType = ctx.error.name || 'Error';
  const handler = recoveryHandlers.get(errorType);

  if (!handler) {
    logger.debug(`No recovery handler for ${errorType}`);
    return false;
  }

  try {
    logger.info(`Attempting recovery for ${errorType} (attempt ${ctx.attempt}/${ctx.maxAttempts})`);
    return await handler(ctx);
  } catch (err) {
    logger.error('Recovery handler failed', err instanceof Error ? err.message : String(err));
    return false;
  }
}

// Default recovery handlers
registerRecoveryHandler('NetworkError', async (ctx) => {
  if (ctx.attempt < ctx.maxAttempts) {
    logger.info('Network error detected, waiting before retry');
    await new Promise(resolve => setTimeout(resolve, 2000 * ctx.attempt));
    return true;
  }
  return false;
});

registerRecoveryHandler('TimeoutError', async (ctx) => {
  if (ctx.attempt < ctx.maxAttempts) {
    logger.info('Timeout detected, retrying with longer timeout');
    return true;
  }
  return false;
});

registerRecoveryHandler('RateLimitError', async (ctx) => {
  const backoffMs = Math.min(60000, 1000 * Math.pow(2, ctx.attempt));
  logger.info(`Rate limited, backing off for ${backoffMs}ms`);
  await new Promise(resolve => setTimeout(resolve, backoffMs));
  return true;
});
