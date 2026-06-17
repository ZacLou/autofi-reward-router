import { logger } from '../utils/logger';
import type { RewardEvent } from '../types';

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

export interface GitHubBountyEvent {
  action: string;
  issue?: {
    number: number;
    title: string;
    user: { login: string };
    labels: Array<{ name: string }>;
  };
  pull_request?: {
    number: number;
    user: { login: string };
    merged: boolean;
  };
}

export async function parseGitHubBountyEvent(payload: GitHubBountyEvent, developerAddress: string): Promise<RewardEvent | null> {
  try {
    // Handle bounty issue labeled with reward
    if (payload.action === 'closed' && payload.issue) {
      const hasBountyLabel = payload.issue.labels.some(l => l.name.toLowerCase().includes('bounty'));
      if (hasBountyLabel) {
        logger.info(`GitHub bounty detected: ${payload.issue.title}`);
        // Amount would come from label or comment parsing
        return {
          developerPublicKey: developerAddress,
          amount: '100.00', // Parse from issue label or comment
          assetCode: 'USDC',
          assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
          sourceId: 'github_bounty',
        };
      }
    }

    return null;
  } catch (err) {
    logger.error('Failed to parse GitHub bounty event', err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function startGitHubBountyListener(
  webhookPort: number = 3000,
  onReward: (event: RewardEvent) => Promise<void>
): Promise<void> {
  logger.info(`GitHub bounty listener ready on port ${webhookPort}`);
  // TODO: Set up Express webhook handler for /webhook/github
}
