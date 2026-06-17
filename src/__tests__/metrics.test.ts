import { metricsCollector } from '../src/utils/metrics';

describe('Metrics Collector', () => {
  beforeEach(() => {
    metricsCollector.reset();
  });

  test('records successful swaps', () => {
    metricsCollector.recordSuccess('100.00', 1000);
    metricsCollector.recordSuccess('50.00', 500);

    const metrics = metricsCollector.getMetrics();
    expect(metrics.successfulSwaps).toBe(2);
    expect(metrics.totalRewardsProcessed).toBe(2);
    expect(parseFloat(metrics.totalAmountProcessed)).toBe(150);
  });

  test('tracks processing time average', () => {
    metricsCollector.recordSuccess('100.00', 1000);
    metricsCollector.recordSuccess('50.00', 3000);

    const metrics = metricsCollector.getMetrics();
    expect(metrics.avgProcessingTime).toBe(2000);
  });

  test('records failures', () => {
    metricsCollector.recordSuccess('100.00', 1000);
    metricsCollector.recordFailure();

    const metrics = metricsCollector.getMetrics();
    expect(metrics.failedSwaps).toBe(1);
    expect(metrics.successfulSwaps).toBe(1);
  });
});
