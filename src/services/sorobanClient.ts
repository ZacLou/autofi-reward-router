import { SorobanRpc, Keypair, Contract } from '@stellar/stellar-sdk';
import type { RoutePreferences } from '../types';
import { logger } from '../utils/logger';
import { retryAsync } from '../utils/retry';

export class SorobanContractClient {
  private server: SorobanRpc.Server;
  private contractId: string;
  private keypair: Keypair;

  constructor(rpcUrl: string, contractId: string, keypair: Keypair) {
    this.server = new SorobanRpc.Server(rpcUrl);
    this.contractId = contractId;
    this.keypair = keypair;
  }

  async getPreferences(userPublicKey: string): Promise<RoutePreferences> {
    return retryAsync(async () => {
      try {
        // Mock implementation - replace with actual Soroban invocation
        logger.debug(`Fetching preferences for ${userPublicKey} from contract ${this.contractId}`);
        
        // TODO: Use actual soroban-client contract methods when SDK is stable
        // For now, return a default
        return {
          off_ramp_pct: 70,
          keep_crypto_pct: 30,
          anchor_asset_code: 'USDC',
          anchor_issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        };
      } catch (err) {
        logger.error('Failed to fetch preferences from Soroban', err instanceof Error ? err.message : String(err));
        throw err;
      }
    });
  }

  async hasPreferences(userPublicKey: string): Promise<boolean> {
    return retryAsync(async () => {
      try {
        logger.debug(`Checking if ${userPublicKey} has preferences`);
        // TODO: Replace with actual Soroban call
        return true;
      } catch {
        return false;
      }
    });
  }
}

let contractClient: SorobanContractClient | null = null;

export function initSorobanClient(rpcUrl: string, contractId: string, keypair: Keypair): SorobanContractClient {
  contractClient = new SorobanContractClient(rpcUrl, contractId, keypair);
  return contractClient;
}

export function getSorobanClient(): SorobanContractClient {
  if (!contractClient) {
    throw new Error('Soroban client not initialized. Call initSorobanClient first.');
  }
  return contractClient;
}
