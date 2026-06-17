export interface Metrics {
  totalRewardsProcessed: number;
  totalAmountProcessed: string;
  successfulSwaps: number;
  failedSwaps: number;
  avgProcessingTime: number;
}

class MetricsCollector {
  private metrics: Metrics = {
    totalRewardsProcessed: 0,
    totalAmountProcessed: '0',
    successfulSwaps: 0,
    failedSwaps: 0,
    avgProcessingTime: 0,
  };

  private processingTimes: number[] = [];

  recordSuccess(amount: string, processingTimeMs: number) {
    this.metrics.totalRewardsProcessed++;
    this.metrics.successfulSwaps++;
    this.metrics.totalAmountProcessed = (
      parseFloat(this.metrics.totalAmountProcessed) + parseFloat(amount)
    ).toString();
    this.processingTimes.push(processingTimeMs);
    this.updateAvgTime();
  }

  recordFailure() {
    this.metrics.failedSwaps++;
  }

  private updateAvgTime() {
    if (this.processingTimes.length === 0) return;
    const sum = this.processingTimes.reduce((a, b) => a + b, 0);
    this.metrics.avgProcessingTime = sum / this.processingTimes.length;
  }

  getMetrics(): Metrics {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      totalRewardsProcessed: 0,
      totalAmountProcessed: '0',
      successfulSwaps: 0,
      failedSwaps: 0,
      avgProcessingTime: 0,
    };
    this.processingTimes = [];
  }
}

export const metricsCollector = new MetricsCollector();
