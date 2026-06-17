export interface RoutePreferences {
  off_ramp_pct: number;       // e.g. 70 = 70%
  keep_crypto_pct: number;    // e.g. 30 = 30%
  anchor_asset_code: string;  // e.g. "NGNX" | "USDC" | "GBPT"
  anchor_issuer: string;
}

export interface RewardEvent {
  developerPublicKey: string;
  amount: string;
  assetCode: string;
  assetIssuer: string;
  sourceId: 'drips' | 'github_bounty' | 'manual';
}

export interface AnchorConfig {
  code: string;
  issuer: string;
  homeDomain: string;
  currency: 'NGN' | 'USD' | 'GBP';
}

// Re-export utils for external use
export * from '../utils/validation';
export * from '../utils/metrics';
export * from '../utils/logger';
