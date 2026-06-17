import {
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
  Asset,
  Networks,
} from '@stellar/stellar-sdk';
import { logger } from '../utils/logger';
import { retryAsync } from '../utils/retry';
import { calculateSlippageProtection } from '../utils/slippage';

const server = new Horizon.Server(
  process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org'
);

const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK === 'mainnet'
  ? Networks.PUBLIC
  : Networks.TESTNET;

interface OffRampParams {
  developerKeypair: Keypair;
  sendAmount: string;
  sendAsset: Asset;
  destAsset: Asset;
  destMin?: string;
  slippagePercent?: number;
}

export async function executePathPayment({
  developerKeypair,
  sendAmount,
  sendAsset,
  destAsset,
  destMin,
  slippagePercent = 2,
}: OffRampParams): Promise<string> {
  return retryAsync(async () => {
    logger.debug(`Executing path payment: ${sendAmount} ${sendAsset.code} → ${destAsset.code}`);

    // Calculate slippage-protected minimum if not provided
    let finalDestMin = destMin;
    if (!destMin) {
      finalDestMin = await calculateSlippageProtection(
        { code: sendAsset.code, issuer: sendAsset.issuer },
        { code: destAsset.code, issuer: destAsset.issuer },
        sendAmount,
        slippagePercent
      );
      logger.debug(`Calculated min destination amount: ${finalDestMin}`);
    }

    const account = await server.loadAccount(developerKeypair.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: '100000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.pathPaymentStrictSend({
          sendAsset,
          sendAmount,
          destination: developerKeypair.publicKey(),
          destAsset,
          destMin: finalDestMin || '0.0000001',
          path: [],
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(developerKeypair);
    const result = await server.submitTransaction(tx);
    logger.info(`Path payment successful: ${result.hash}`);
    return result.hash;
  }, 3, 2000);
}
