# AutoFi Wallet — Automated Developer Reward Off-Ramp

AutoFi is a Soroban-powered middleware that hooks into open-source payout engines (Drips Waves, GitHub bounties). The moment a developer receives an on-chain token reward (USDC, XLM), AutoFi catches it, applies a configurable split rule stored on-chain, and executes an atomic path payment swap into a local fiat anchor stablecoin (NGNX, USDC, GBPT) — pushing funds directly into local banking infrastructure.

Live on Drips Network: https://docs.drips.network/wave

---

## Features

- **On-chain Split Rules** — Developer preferences (% to off-ramp vs. hold) are stored in a Soroban smart contract, not a centralised server.
- **Atomic Path Payments** — One Stellar operation swaps inbound reward tokens to an anchor stablecoin via the native DEX.
- **Multi-Currency Off-Ramp** — Supports NGN (NIBSS), USD (ACH), GBP (SEPA) via SEP-6/SEP-24 anchor integrations.
- **Drips Wave Listener** — Monitors Drips Wave payouts and fires the off-ramp pipeline automatically.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  External Triggers                   │
│  Drips Wave Payout  │  GitHub Bounty  │  Manual Send │
└──────────┬──────────┴────────┬────────┴──────┬───────┘
           │                   │               │
           ▼                   ▼               ▼
┌─────────────────────────────────────────────────────┐
│               dripListener.ts                        │
│  Polls Drips subgraph / webhook  →  RewardEvent{}    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                   index.ts                           │
│  1. Read RoutePreferences from Soroban contract      │
│  2. Calculate off-ramp amount  (amount × pct / 100)  │
│  3. Call executePathPayment()                        │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐     ┌──────────────────────────┐
│  Soroban Contract │     │    pathPayment.ts         │
│  reward_router    │     │  pathPaymentStrictSend    │
│  RoutePreferences │     │  inbound → anchor asset   │
└──────────────────┘     └──────────┬───────────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │  Stellar Anchor       │
                          │  SEP-6 / SEP-24       │
                          │  NGN / USD / GBP      │
                          └──────────────────────┘
```

---

## Directory Structure

```
autofi-wallet/
├── .env.example
├── README.md
├── package.json
├── tsconfig.json
├── contracts/
│   └── reward_router/
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs          # Soroban contract: stores RoutePreferences per user
└── src/
    ├── index.ts                # Orchestrator: listens → reads prefs → executes swap
    ├── config/
    │   └── anchors.ts          # SEP-6/SEP-24 anchor configs (NGNX, USDC, GBPT)
    ├── services/
    │   ├── dripListener.ts     # Drips Wave / GitHub bounty event listener
    │   └── pathPayment.ts      # Stellar pathPaymentStrictSend executor
    └── types/
        └── index.ts            # Shared TypeScript interfaces
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- Rust + [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup)
- Stellar Testnet or Mainnet account funded with XLM

### Setup

```bash
# 1. Install TypeScript dependencies
yarn install

# 2. Copy env config and fill in your keys
cp .env.example .env

# 3. Build the Soroban contract
cd contracts/reward_router
soroban contract build

# 4. Deploy to testnet (get back a contract ID)
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/reward_router.wasm \
  --source <YOUR_SECRET_KEY> \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# 5. Start the listener
cd ../..
yarn start
```

---

## Code Walkthrough

### 1. Smart Contract — `contracts/reward_router/src/lib.rs`

Stores each developer's routing preferences on-chain. The `set_preferences` call requires the user's Stellar auth signature so only the wallet owner can modify their own rules.

```rust
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoutePreferences {
    pub off_ramp_pct: u32,
    pub keep_crypto_pct: u32,
    pub anchor_asset_code: String, // "NGNX" | "USDC" | "GBPT"
    pub anchor_issuer: Address,
}

#[contract]
pub struct RewardRouter;

#[contractimpl]
impl RewardRouter {
    pub fn set_preferences(env: Env, user: Address, prefs: RoutePreferences) {
        user.require_auth();
        assert!(
            prefs.off_ramp_pct + prefs.keep_crypto_pct == 100,
            "allocations must sum to 100"
        );
        env.storage().persistent().set(&user, &prefs);
    }

    pub fn get_preferences(env: Env, user: Address) -> RoutePreferences {
        env.storage()
            .persistent()
            .get(&user)
            .expect("no preferences set for this address")
    }
}
```

### 2. Path Payment Service — `src/services/pathPayment.ts`

Single function that builds and submits a `pathPaymentStrictSend` transaction. The empty `path: []` lets Horizon's pathfinding engine auto-route through the Stellar DEX.

```typescript
import { Horizon, Keypair, Operation, TransactionBuilder, Asset, Networks } from '@stellar/stellar-sdk';

const server = new Horizon.Server(process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org');

export async function executePathPayment({ developerKeypair, sendAmount, sendAsset, destAsset, destMin = '0.0000001' }) {
  const account = await server.loadAccount(developerKeypair.publicKey());

  const tx = new TransactionBuilder(account, { fee: '100000', networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.pathPaymentStrictSend({
      sendAsset, sendAmount,
      destination: developerKeypair.publicKey(),
      destAsset, destMin,
      path: [], // Horizon auto-routes via DEX
    }))
    .setTimeout(30)
    .build();

  tx.sign(developerKeypair);
  const result = await server.submitTransaction(tx);
  return result.hash;
}
```

### 3. Drips Listener — `src/services/dripListener.ts`

Polls for incoming Drips Wave payouts and emits `RewardEvent` objects to the handler pipeline. Replace the mock interval with a real Drips subgraph query or webhook.

```typescript
export async function startDripListener(recipientAddress: string, onReward: RewardHandler, intervalMs = 30_000) {
  setInterval(async () => {
    // TODO: query Drips subgraph for new splits/squeezes targeting recipientAddress
    const event: RewardEvent = { developerPublicKey: recipientAddress, amount: '100.00', assetCode: 'USDC', ... };
    await onReward(event);
  }, intervalMs);
}
```

### 4. Orchestrator — `src/index.ts`

Ties the pipeline together: receive event → read on-chain prefs → calculate split → execute swap.

```typescript
async function handleReward(event: RewardEvent) {
  const prefs = await readContractPreferences(event.developerPublicKey); // TODO: soroban-client call
  const offRampAmount = ((parseFloat(event.amount) * prefs.off_ramp_pct) / 100).toFixed(7);

  const txHash = await executePathPayment({
    developerKeypair: Keypair.fromSecret(process.env.DEV_PRIVATE_KEY!),
    sendAmount: offRampAmount,
    sendAsset: new Asset(event.assetCode, event.assetIssuer),
    destAsset: new Asset(anchor.code, anchor.issuer),
  });

  console.log(`✅ Off-ramp complete: ${txHash}`);
  // Next: trigger SEP-24 interactive deposit for bank push
}
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `STELLAR_NETWORK` | `testnet` or `mainnet` |
| `HORIZON_URL` | Horizon server endpoint |
| `DEV_PUBLIC_KEY` | Developer's Stellar public key |
| `DEV_PRIVATE_KEY` | Developer's Stellar secret key |
| `NGNX_ISSUER` | NGNX anchor issuer address |
| `GBPT_ISSUER` | GBPT anchor issuer address |
| `SOROBAN_RPC_URL` | Soroban RPC endpoint |
| `REWARD_ROUTER_CONTRACT_ID` | Deployed contract address |

---

## Roadmap / Open Issues

These are the remaining ~50% of the project — create GitHub issues for each:

- [ ] **Soroban client integration** — Replace mock prefs with live `get_preferences` call via `@stellar/stellar-sdk` contract client
- [ ] **Drips subgraph query** — Implement real Drips Wave payout listener using the GraphQL subgraph
- [ ] **SEP-24 off-ramp trigger** — After path payment, call anchor's `/transactions/deposit/interactive` to initiate bank transfer
- [ ] **SEP-6 polling** — Poll anchor transaction status and emit webhook/notification on completion  
- [ ] **GitHub bounty listener** — Parse GitHub webhook events for bounty payouts
- [ ] **Slippage protection** — Dynamically calculate `destMin` from current DEX orderbook before submitting
- [ ] **Multi-account support** — Handle multiple developer wallets from a single running instance
- [ ] **Frontend UI** — Simple web interface for setting `RoutePreferences` and viewing transaction history

---

## License

MIT
