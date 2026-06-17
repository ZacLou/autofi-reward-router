import { Asset, Keypair } from '@stellar/stellar-sdk';
import { startDripListener } from './services/dripListener';
import { executePathPayment } from './services/pathPayment';
import { initSorobanClient, getSorobanClient } from './services/sorobanClient';
import { initiateSEP24Deposit } from './services/sep24Deposit';
import { transactionHistory } from './services/transactionHistory';
import { listenerRateLimiter } from './services/rateLimiter';
import { ANCHORS, validateAnchorConfig } from './config/anchors';
import { validateEnvironment } from './config/env';
import type { RewardEvent } from './types';
import { logger, LogLevel } from './utils/logger';
import { metricsCollector } from './utils/metrics';
import { validatePercentageSplit } from './utils/validation';

let config = validateEnvironment();
validateAnchorConfig();

if (process.env.DEBUG) {
  logger.setLevel(LogLevel.DEBUG);
}

const devKeypair = Keypair.fromSecret(config.dev_private_key);
initSorobanClient(config.soroban_rpc_url, config.reward_router_contract_id, devKeypair);

async function handleReward(event: RewardEvent): Promise<void> {
  const startTime = Date.now();

  try {
    logger.info(`[AutoFi] Reward received: ${event.amount} ${event.assetCode} from ${event.sourceId}`);

    // Rate limiting
    await listenerRateLimiter.waitIfNeeded('handleReward');

    // Get preferences from Soroban contract
    const sorobanClient = getSorobanClient();
    const prefs = await sorobanClient.getPreferences(event.developerPublicKey);

    // Validate preferences
    if (!validatePercentageSplit(prefs.off_ramp_pct, prefs.keep_crypto_pct)) {
      throw new Error(`Invalid preference split: ${prefs.off_ramp_pct}% + ${prefs.keep_crypto_pct}% != 100%`);
    }

    const anchor = ANCHORS[prefs.anchor_asset_code];
    if (!anchor) {
      throw new Error(`Unknown anchor: ${prefs.anchor_asset_code}`);
    }

    const offRampAmount = (
      (parseFloat(event.amount) * prefs.off_ramp_pct) / 100
    ).toFixed(7);

    logger.info(`[AutoFi] Off-ramping ${offRampAmount} ${event.assetCode} → ${anchor.code} (${anchor.currency})`);

    const sendAsset = new Asset(event.assetCode, event.assetIssuer);
    const destAsset = new Asset(anchor.code, anchor.issuer);

    const txHash = await executePathPayment({
      developerKeypair: devKeypair,
      sendAmount: offRampAmount,
      sendAsset,
      destAsset,
      slippagePercent: 2,
    });

    logger.info(`[AutoFi] ✅ Swap complete. tx: ${txHash}`);

    // Record transaction
    transactionHistory.add({
      txHash,
      developerPublicKey: event.developerPublicKey,
      sendAmount: offRampAmount,
      sendAsset: event.assetCode,
      destAsset: anchor.code,
      status: 'success',
    });

    // Trigger SEP-24 interactive deposit
    try {
      const depositResult = await initiateSEP24Deposit({
        anchorConfig: anchor,
        amount: offRampAmount,
        userPublicKey: event.developerPublicKey,
      });
      logger.info(`[AutoFi] SEP-24 deposit initiated: ${depositResult.url}`);
    } catch (err) {
      logger.warn('SEP-24 deposit initiation failed', err instanceof Error ? err.message : String(err));
    }

    const processingTime = Date.now() - startTime;
    metricsCollector.recordSuccess(offRampAmount, processingTime);
    logger.debug(`Processed in ${processingTime}ms`);

  } catch (err) {
    logger.error('[AutoFi] Error processing reward', err instanceof Error ? err : String(err));
    metricsCollector.recordFailure();

    transactionHistory.add({
      txHash: 'failed',
      developerPublicKey: event.developerPublicKey,
      sendAmount: event.amount,
      sendAsset: event.assetCode,
      destAsset: 'unknown',
      status: 'failed',
    });

    // Implement exponential backoff for retries via the main listener
  }
}

// Start listener
const recipientKey = config.dev_public_key;
logger.info(`Starting AutoFi listener for ${recipientKey}`);
startDripListener(recipientKey, handleReward);

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  const metrics = metricsCollector.getMetrics();
  logger.info(`Final metrics: ${JSON.stringify(metrics)}`);
  process.exit(0);
});

