import { logger } from '../utils/logger';
import type { AnchorConfig } from '../types';

export interface SEP24DepositRequest {
  anchorConfig: AnchorConfig;
  amount: string;
  userPublicKey: string;
  userEmail?: string;
}

export interface SEP24DepositResponse {
  id: string;
  type: 'interactive';
  url: string;
}

export async function initiateSEP24Deposit(request: SEP24DepositRequest): Promise<SEP24DepositResponse> {
  const { anchorConfig, amount, userPublicKey, userEmail } = request;

  try {
    logger.info(`Initiating SEP-24 deposit for ${amount} ${anchorConfig.code}`);

    // Build SEP-24 deposit endpoint
    const anchorUrl = `https://${anchorConfig.homeDomain}`;
    const params = new URLSearchParams({
      asset_code: anchorConfig.code,
      amount,
      account: userPublicKey,
      ...(userEmail && { email: userEmail }),
    });

    const depositUrl = `${anchorUrl}/transactions/deposit/interactive?${params.toString()}`;

    // TODO: Make actual HTTPS POST to anchor's deposit endpoint
    logger.debug(`SEP-24 deposit URL: ${depositUrl}`);

    return {
      id: Math.random().toString(36).substring(7),
      type: 'interactive',
      url: depositUrl,
    };
  } catch (err) {
    logger.error('Failed to initiate SEP-24 deposit', err instanceof Error ? err.message : String(err));
    throw err;
  }
}

export async function pollSEP24Status(anchorUrl: string, transactionId: string): Promise<{ status: string; amount?: string }> {
  try {
    logger.debug(`Polling SEP-24 transaction status: ${transactionId}`);

    // TODO: Make actual request to anchor's /transactions endpoint
    return { status: 'pending' };
  } catch (err) {
    logger.error('Failed to poll SEP-24 status', err instanceof Error ? err.message : String(err));
    throw err;
  }
}
