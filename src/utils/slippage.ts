import { Horizon, Asset } from '@stellar/stellar-sdk';

export async function calculateSlippageProtection(
  sendAsset: { code: string; issuer: string },
  destAsset: { code: string; issuer: string },
  sendAmount: string,
  slippagePercent: number = 2
): Promise<string> {
  const server = new Horizon.Server(process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org');

  try {
    const sendAssetObj = new Asset(sendAsset.code, sendAsset.issuer);
    const destAssetObj = new Asset(destAsset.code, destAsset.issuer);

    const paths = await server.strictSendPaths(
      sendAssetObj,
      sendAmount,
      [destAssetObj]
    ).call();

    if (!paths.records || paths.records.length === 0) {
      return '0.0000001'; // Fallback minimum
    }

    const bestPath = paths.records[0];
    const destAmounts = bestPath.destination_amount;
    const slippage = (parseFloat(destAmounts) * slippagePercent) / 100;
    const minAmount = (parseFloat(destAmounts) - slippage).toFixed(7);

    return Math.max(parseFloat(minAmount), 0.0000001).toFixed(7);
  } catch {
    return '0.0000001';
  }
}
