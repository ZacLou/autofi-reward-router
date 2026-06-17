# AutoFi Development Guide

## Architecture Overview

AutoFi is composed of several key modules:

### Core Flow
1. **Listeners** (DripListener, GitHubBountyListener) → detect reward events
2. **Route Preferences** (SorobanClient) → fetch user on-chain routing rules
3. **Path Payment** (executePathPayment) → atomic swap via Stellar DEX
4. **SEP-24** (sep24Deposit) → trigger bank transfer via anchor
5. **Metrics** → track and report success/failure

### Services

#### dripListener.ts
Polls for Drips Wave payouts. Currently mocked; replace with actual subgraph integration.

```typescript
import { startDripListener } from './services/dripListener';

startDripListener(devPublicKey, handleReward);
```

#### sorobanClient.ts
Fetches `RoutePreferences` from the on-chain Soroban smart contract. Uses retry logic for resilience.

```typescript
const client = initSorobanClient(rpcUrl, contractId, keypair);
const prefs = await client.getPreferences(userAddress);
```

#### pathPayment.ts
Executes strict-send path payments with slippage protection. Automatically calculates minimum destination amount from live DEX prices.

```typescript
const txHash = await executePathPayment({
  developerKeypair,
  sendAmount: '100.00',
  sendAsset: new Asset('USDC', issuer),
  destAsset: new Asset('NGNX', issuer),
  slippagePercent: 2,
});
```

#### sep24Deposit.ts
Initiates SEP-24 interactive deposits to push off-ramped funds to bank accounts.

```typescript
const deposit = await initiateSEP24Deposit({
  anchorConfig: ANCHORS.NGNX,
  amount: '70.00',
  userPublicKey: recipient,
});
console.log(deposit.url); // Redirect user to this URL
```

### Utilities

#### validation.ts
Validates Stellar keypairs, amounts, percentages, and asset codes.

```typescript
import { validateStellarPublicKey, validateAmount } from './utils/validation';

if (!validateStellarPublicKey(key)) throw new Error('Invalid key');
if (!validateAmount(amount)) throw new Error('Invalid amount');
```

#### retry.ts
Exponential backoff retry utility for network operations.

```typescript
import { retryAsync } from './utils/retry';

const result = await retryAsync(() => someAsyncOperation(), 3, 1000, 2);
```

#### slippage.ts
Calculates slippage-protected minimum destination amount from live DEX prices.

```typescript
import { calculateSlippageProtection } from './utils/slippage';

const minAmount = await calculateSlippageProtection(
  { code: 'USDC', issuer: '...' },
  { code: 'NGNX', issuer: '...' },
  '100.00',
  2 // 2% slippage
);
```

#### metrics.ts
Tracks success/failure rates and processing times.

```typescript
import { metricsCollector } from './utils/metrics';

metricsCollector.recordSuccess('100.00', 1234);
const stats = metricsCollector.getMetrics();
```

#### rateLimiter.ts
Token-bucket rate limiting for API calls.

```typescript
import { listenerRateLimiter } from './services/rateLimiter';

await listenerRateLimiter.waitIfNeeded('key');
```

#### logger.ts
Structured logging with levels (DEBUG, INFO, WARN, ERROR).

```typescript
import { logger, LogLevel } from './utils/logger';

logger.setLevel(LogLevel.DEBUG);
logger.info('Processing reward');
logger.error('Failed', new Error('...'));
```

## Environment Setup

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Fill in all required variables:
- `STELLAR_NETWORK`: testnet or mainnet
- `HORIZON_URL`: Horizon endpoint
- `DEV_PUBLIC_KEY` / `DEV_PRIVATE_KEY`: Developer's keypair
- `NGNX_ISSUER`, `GBPT_ISSUER`: Anchor issuer addresses
- `SOROBAN_RPC_URL`: Soroban RPC endpoint
- `REWARD_ROUTER_CONTRACT_ID`: Deployed contract ID

## Configuration

### Anchors

Edit `src/config/anchors.ts` to add new anchor support. Validation is automatic.

```typescript
USDC: {
  code: 'USDC',
  issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  homeDomain: 'centre.io',
  currency: 'USD',
}
```

### Environment Validation

Environment is validated on startup via `validateEnvironment()`. All required keys must be present and valid.

## Running

### Development

```bash
yarn dev              # Standard run
yarn dev:debug       # With debug logging
```

### Production

```bash
yarn build
yarn start
```

### Testing

```bash
yarn test            # Run all tests
yarn test:watch      # Watch mode
yarn lint           # Type check
```

## Error Handling

- All async operations use `retryAsync` with exponential backoff
- Failed rewards are logged and recorded in transaction history
- Metrics track failure rates for monitoring
- SIGINT gracefully shuts down and reports final metrics

## Monitoring

View metrics at runtime:
- Success rate: `metricsCollector.getMetrics().successfulSwaps`
- Total processed: `metricsCollector.getMetrics().totalAmountProcessed`
- Avg processing time: `metricsCollector.getMetrics().avgProcessingTime`

Transaction history saved to `.tx-history.json` for audit trails.

## TODOs

- [ ] Replace Soroban mock with actual contract invocation
- [ ] Replace Drips listener mock with subgraph GraphQL
- [ ] Implement GitHub webhook handler for bounty events
- [ ] Add Express server for webhook receivers
- [ ] Implement SEP-24 polling for transaction status
- [ ] Add database for transaction persistence
- [ ] Add Prometheus metrics export
- [ ] Add Sentry error tracking
