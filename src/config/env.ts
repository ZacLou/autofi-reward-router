import { validateStellarPublicKey, validateStellarSecretKey } from '../utils/validation';
import { logger } from '../utils/logger';

export interface ValidatedConfig {
  stellar_network: 'testnet' | 'mainnet';
  horizon_url: string;
  dev_public_key: string;
  dev_private_key: string;
  ngnx_issuer: string;
  gbpt_issuer: string;
  soroban_rpc_url: string;
  reward_router_contract_id: string;
}

export function validateEnvironment(): ValidatedConfig {
  const errors: string[] = [];

  const stellar_network = process.env.STELLAR_NETWORK as 'testnet' | 'mainnet' | undefined;
  if (!stellar_network || !['testnet', 'mainnet'].includes(stellar_network)) {
    errors.push('STELLAR_NETWORK must be "testnet" or "mainnet"');
  }

  const horizon_url = process.env.HORIZON_URL;
  if (!horizon_url) {
    errors.push('HORIZON_URL is required');
  }

  const dev_public_key = process.env.DEV_PUBLIC_KEY;
  if (!dev_public_key || !validateStellarPublicKey(dev_public_key)) {
    errors.push('DEV_PUBLIC_KEY is required and must be a valid Stellar public key');
  }

  const dev_private_key = process.env.DEV_PRIVATE_KEY;
  if (!dev_private_key || !validateStellarSecretKey(dev_private_key)) {
    errors.push('DEV_PRIVATE_KEY is required and must be a valid Stellar secret key');
  }

  const ngnx_issuer = process.env.NGNX_ISSUER;
  if (!ngnx_issuer || !validateStellarPublicKey(ngnx_issuer)) {
    errors.push('NGNX_ISSUER is required and must be a valid Stellar public key');
  }

  const gbpt_issuer = process.env.GBPT_ISSUER;
  if (!gbpt_issuer || !validateStellarPublicKey(gbpt_issuer)) {
    errors.push('GBPT_ISSUER is required and must be a valid Stellar public key');
  }

  const soroban_rpc_url = process.env.SOROBAN_RPC_URL;
  if (!soroban_rpc_url) {
    errors.push('SOROBAN_RPC_URL is required');
  }

  const reward_router_contract_id = process.env.REWARD_ROUTER_CONTRACT_ID;
  if (!reward_router_contract_id || !reward_router_contract_id.startsWith('C')) {
    errors.push('REWARD_ROUTER_CONTRACT_ID is required and must start with "C"');
  }

  if (errors.length > 0) {
    logger.error('Environment validation failed:');
    errors.forEach(e => logger.error(`  - ${e}`));
    throw new Error(`${errors.length} environment variable(s) missing or invalid`);
  }

  return {
    stellar_network: stellar_network as 'testnet' | 'mainnet',
    horizon_url: horizon_url as string,
    dev_public_key: dev_public_key as string,
    dev_private_key: dev_private_key as string,
    ngnx_issuer: ngnx_issuer as string,
    gbpt_issuer: gbpt_issuer as string,
    soroban_rpc_url: soroban_rpc_url as string,
    reward_router_contract_id: reward_router_contract_id as string,
  };
}
