import { Asset, Keypair } from '@stellar/stellar-sdk';
import { startDripListener } from './services/dripListener';
import { executePathPayment } from './services/pathPayment';
import { ANCHORS } from './config/anchors';
import type { RewardEvent, RoutePreferences } from './types';

// TODO: Replace with Soroban contract read via soroban-client
const MOCK_PREFS: Pick<RoutePreferences, 'off_ramp_pct' | 'keep_crypto_pct' | 'anchor_asset_code'> = {
  off_ramp_pct: 70,
  keep_crypto_pct: 30,
  anchor_asset_code: 'NGNX',
};

if (MOCK_PREFS.off_ramp_pct + MOCK_PREFS.keep_crypto_pct !== 100) {
  throw new Error(`MOCK_PREFS allocations must sum to 100, got ${MOCK_PREFS.off_ramp_pct + MOCK_PREFS.keep_crypto_pct}`);
}

async function handleReward(event: RewardEvent): Promise<void> {
  console.log(`[AutoFi] Reward received: ${event.amount} ${event.assetCode} from ${event.sourceId}`);

  const anchor = ANCHORS[MOCK_PREFS.anchor_asset_code];
  if (!anchor) throw new Error(`Unknown anchor: ${MOCK_PREFS.anchor_asset_code}`);

  const offRampAmount = (
    (parseFloat(event.amount) * MOCK_PREFS.off_ramp_pct) / 100
  ).toFixed(7);

  const devKeypair = Keypair.fromSecret(process.env.DEV_PRIVATE_KEY!);
  const sendAsset = new Asset(event.assetCode, event.assetIssuer);
  const destAsset = new Asset(anchor.code, anchor.issuer);

  console.log(`[AutoFi] Off-ramping ${offRampAmount} ${event.assetCode} → ${anchor.code} (${anchor.currency})`);

  const txHash = await executePathPayment({
    developerKeypair: devKeypair,
    sendAmount: offRampAmount,
    sendAsset,
    destAsset,
  });

  console.log(`[AutoFi] ✅ Swap complete. tx: ${txHash}`);
  // TODO: Trigger SEP-24 interactive deposit to push anchor funds to bank
}

const recipientKey = process.env.DEV_PUBLIC_KEY;
if (!recipientKey) throw new Error('DEV_PUBLIC_KEY not set');

startDripListener(recipientKey, handleReward);
