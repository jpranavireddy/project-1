import { RetryHandler } from '../retry-handler';

describe('RetryHandler Unit Tests', () => {
  it('should execute operation successfully on first try', async () => {
    const handler = new RetryHandler();
    
    const result = await handler.executeWithRetry(async () => {
      return 'success';
    });
    
    expect(result).toBe('success');
  });

  it('should retry on failure and eventually succeed', async () => {
    const handler = new RetryHandler({ maxRetries: 3, initialDelayMs: 10 });
    let attempts = 0;
    
    const result = await handler.executeWithRetry(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    });
    
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should throw error after max retries', async () => {
    const handler = new RetryHandler({ maxRetries: 2, initialDelayMs: 10 });
    let attempts = 0;
    
    await expect(
      handler.executeWithRetry(async () => {
        attempts++;
        throw new Error('Persistent failure');
      })
    ).rejects.toThrow('Persistent failure');
    
    expect(attempts).toBe(3); // Initial + 2 retries
  });

  it('should not retry when isRetryable returns false', async () => {
    const handler = new RetryHandler({ maxRetries: 3, initialDelayMs: 10 });
    let attempts = 0;
    
    await expect(
      handler.executeWithRetry(
        async () => {
          attempts++;
          throw new Error('Non-retryable error');
        },
        () => false // Never retry
      )
    ).rejects.toThrow('Non-retryable error');
    
    expect(attempts).toBe(1); // Only initial attempt
  });

  it('should apply exponential backoff', async () => {
    const handler = new RetryHandler({
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 2,
    });
    
    const timestamps: number[] = [];
    let attempts = 0;
    
    try {
      await handler.executeWithRetry(async () => {
        timestamps.push(Date.now());
        attempts++;
        throw new Error('Test error');
      });
    } catch (error) {
      // Expected to fail
    }
    
    expect(attempts).toBe(4); // Initial + 3 retries
    expect(timestamps.length).toBe(4);
    
    // Check that delays are increasing (with some tolerance for timing)
    if (timestamps.length >= 3) {
      const delay1 = timestamps[1] - timestamps[0];
      const delay2 = timestamps[2] - timestamps[1];
      
      // Second delay should be roughly 2x the first (with 50% tolerance)
      expect(delay2).toBeGreaterThan(delay1 * 1.5);
    }
  });

  it('should respect max delay', async () => {
    const handler = new RetryHandler({
      maxRetries: 5,
      initialDelayMs: 1000,
      maxDelayMs: 2000,
      backoffMultiplier: 10,
    });
    
    const timestamps: number[] = [];
    
    try {
      await handler.executeWithRetry(async () => {
        timestamps.push(Date.now());
        throw new Error('Test error');
      });
    } catch (error) {
      // Expected to fail
    }
    
    // Check that no delay exceeds maxDelayMs (with some tolerance)
    for (let i = 1; i < timestamps.length; i++) {
      const delay = timestamps[i] - timestamps[i - 1];
      expect(delay).toBeLessThan(2500); // maxDelayMs + tolerance
    }
  });
});
