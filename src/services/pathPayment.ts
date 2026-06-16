import {
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
  Asset,
  Networks,
} from '@stellar/stellar-sdk';

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
}

export async function executePathPayment({
  developerKeypair,
  sendAmount,
  sendAsset,
  destAsset,
  destMin = '0.0000001',
}: OffRampParams): Promise<string> {
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
        destMin,
        path: [],
      })
    )
    .setTimeout(30)
    .build();

  tx.sign(developerKeypair);
  const result = await server.submitTransaction(tx);
  return result.hash;
}
