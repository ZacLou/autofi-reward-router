import { Keypair } from '@stellar/stellar-sdk';

export function validateAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 922337203685.4775; // Max stroops
}

export function validatePercentage(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

export function validatePercentageSplit(offRamp: number, keepCrypto: number): boolean {
  return validatePercentage(offRamp) && validatePercentage(keepCrypto) && offRamp + keepCrypto === 100;
}

export function validateStellarPublicKey(key: string): boolean {
  try {
    Keypair.fromPublicKey(key);
    return true;
  } catch {
    return false;
  }
}

export function validateStellarSecretKey(key: string): boolean {
  try {
    Keypair.fromSecret(key);
    return true;
  } catch {
    return false;
  }
}

export function validateAssetCode(code: string): boolean {
  return code.length >= 1 && code.length <= 12 && /^[a-zA-Z0-9]+$/.test(code);
}
