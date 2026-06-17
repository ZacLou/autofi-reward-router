import { logger } from '../utils/logger';
import type { RewardEvent } from '../types';

type RewardHandler = (event: RewardEvent) => Promise<void>;

/**
 * Polls the Drips Wave subgraph for new payouts to the configured address.
 * Emits RewardEvents to the provided handler.
 *
 * TODO: Replace mock with real Drips subgraph query once contract address is live.
 * Drips Wave docs: https://docs.drips.network/wave
 */
export async function startDripListener(
  recipientAddress: string,
  onReward: RewardHandler,
  intervalMs = 30_000
): Promise<void> {
  logger.info(`[DripListener] Watching for payouts to ${recipientAddress}`);

  // Placeholder polling loop — replace body with subgraph/webhook integration
  setInterval(async () => {
    try {
      // Simulate receiving a Drips Wave payout
      const mockEvent: RewardEvent = {
        developerPublicKey: recipientAddress,
        amount: '100.00',
        assetCode: 'USDC',
        assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        sourceId: 'drips',
      };

      await onReward(mockEvent);
    } catch (err) {
      logger.error('[DripListener] Error in polling loop', err instanceof Error ? err.message : String(err));
    }
  }, intervalMs);
}
