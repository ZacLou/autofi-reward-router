import type { AnchorConfig } from '../types';
import { validateStellarPublicKey } from '../utils/validation';
import { logger } from '../utils/logger';

export const ANCHORS: Record<string, AnchorConfig> = {
  NGNX: {
    code: 'NGNX',
    issuer: process.env.NGNX_ISSUER || '',
    homeDomain: 'ngnx.io',
    currency: 'NGN',
  },
  USDC: {
    code: 'USDC',
    issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    homeDomain: 'centre.io',
    currency: 'USD',
  },
  GBPT: {
    code: 'GBPT',
    issuer: process.env.GBPT_ISSUER || '',
    homeDomain: 'poundtoken.io',
    currency: 'GBP',
  },
};

export function validateAnchorConfig(): void {
  const errors: string[] = [];

  Object.entries(ANCHORS).forEach(([code, config]) => {
    if (!config.issuer) {
      errors.push(`${code} issuer is empty`);
    } else if (!validateStellarPublicKey(config.issuer)) {
      errors.push(`${code} issuer is not a valid Stellar public key`);
    }
  });

  if (errors.length > 0) {
    errors.forEach(e => logger.error(`Anchor config error: ${e}`));
    throw new Error(`${errors.length} anchor configuration error(s)`);
  }

  logger.info('Anchor configs validated');
}
