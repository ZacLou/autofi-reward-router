import type { AnchorConfig } from '../types';

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
