export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export class RetryHandler {
  private options: RetryOptions;

  constructor(options?: Partial<RetryOptions>) {
    this.options = {
      maxRetries: options?.maxRetries ?? 3,
      initialDelayMs: options?.initialDelayMs ?? 1000,
      maxDelayMs: options?.maxDelayMs ?? 30000,
      backoffMultiplier: options?.backoffMultiplier ?? 2,
    };
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    isRetryable: (error: any) => boolean = () => true
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.options.maxRetries || !isRetryable(error)) {
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  private calculateDelay(attempt: number): number {
    const delay = this.options.initialDelayMs * Math.pow(this.options.backoffMultiplier, attempt);
    return Math.min(delay, this.options.maxDelayMs);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
