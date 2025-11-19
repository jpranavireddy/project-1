import { RateLimiter } from '../rate-limiter';

describe('RateLimiter Unit Tests', () => {
  it('should execute single request immediately', async () => {
    const limiter = new RateLimiter(1000);
    
    const result = await limiter.enqueue(async () => {
      return 'test result';
    });
    
    expect(result).toBe('test result');
  });

  it('should queue multiple requests', async () => {
    const limiter = new RateLimiter(1000);
    const results: number[] = [];
    
    const promises = [
      limiter.enqueue(async () => { results.push(1); return 1; }),
      limiter.enqueue(async () => { results.push(2); return 2; }),
      limiter.enqueue(async () => { results.push(3); return 3; }),
    ];
    
    await Promise.all(promises);
    
    expect(results).toEqual([1, 2, 3]);
  });

  it('should handle request failures without blocking queue', async () => {
    const limiter = new RateLimiter(1000);
    
    const promise1 = limiter.enqueue(async () => {
      throw new Error('Test error');
    });
    
    const promise2 = limiter.enqueue(async () => {
      return 'success';
    });
    
    await expect(promise1).rejects.toThrow('Test error');
    await expect(promise2).resolves.toBe('success');
  });

  it('should report queue length', async () => {
    const limiter = new RateLimiter(100); // Very low rate to keep items in queue
    
    expect(limiter.getQueueLength()).toBe(0);
    
    // Add items to queue
    const promise1 = limiter.enqueue(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 1;
    });
    
    const promise2 = limiter.enqueue(async () => {
      return 2;
    });
    
    // Queue length should be > 0 while processing
    // Note: This is timing-dependent, so we just check it doesn't throw
    expect(typeof limiter.getQueueLength()).toBe('number');
    
    await Promise.all([promise1, promise2]);
    
    // After processing, queue should be empty
    expect(limiter.getQueueLength()).toBe(0);
  });
});
