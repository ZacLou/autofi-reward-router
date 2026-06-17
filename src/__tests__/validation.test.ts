import { validateAmount, validatePercentageSplit, validateStellarPublicKey, validateAssetCode } from '../src/utils/validation';

describe('Validation Utils', () => {
  test('validateAmount accepts positive amounts', () => {
    expect(validateAmount('100.50')).toBe(true);
    expect(validateAmount('0.0000001')).toBe(true);
  });

  test('validateAmount rejects invalid amounts', () => {
    expect(validateAmount('-10')).toBe(false);
    expect(validateAmount('0')).toBe(false);
    expect(validateAmount('invalid')).toBe(false);
  });

  test('validatePercentageSplit validates correct splits', () => {
    expect(validatePercentageSplit(70, 30)).toBe(true);
    expect(validatePercentageSplit(100, 0)).toBe(true);
    expect(validatePercentageSplit(0, 100)).toBe(true);
  });

  test('validatePercentageSplit rejects invalid splits', () => {
    expect(validatePercentageSplit(70, 29)).toBe(false);
    expect(validatePercentageSplit(50.5, 49.5)).toBe(false);
  });

  test('validateAssetCode validates correct codes', () => {
    expect(validateAssetCode('USDC')).toBe(true);
    expect(validateAssetCode('XLM')).toBe(true);
    expect(validateAssetCode('NGNX')).toBe(true);
  });

  test('validateAssetCode rejects invalid codes', () => {
    expect(validateAssetCode('TOOLONGASSETCODE')).toBe(false);
    expect(validateAssetCode('')).toBe(false);
    expect(validateAssetCode('USD-C')).toBe(false);
  });
});
