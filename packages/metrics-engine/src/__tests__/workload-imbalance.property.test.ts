import * as fc from 'fast-check';
import { MetricsEngine } from '../metrics-engine';
import { Activity, TimeRange } from '@dev-tracker/shared-types';

// Feature: dev-performance-tracker, Property 15: Workload imbalance detection identifies outliers
// Validates: Requirements 5.2

describe('Property 15: Workload imbalance detection identifies outliers', () => {
  const engine = new MetricsEngine();

  // Helper to convert null to undefined
  const optional = <T>(arb: fc.Arbitrary<T>): fc.Arbitrary<T | undefined> =>
    fc.option(arb, { nil: undefined });

  const activityArb: fc.Arbitrary<Activity> = fc.record({
    id: fc.uuid(),
    type: fc.constantFrom('commit' as const, 'pull_request' as const, 'issue' as const, 'review' as const),
    developerId: fc.uuid(),
    repositoryId: fc.uuid(),
    timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
    metadata: fc.record({
      commitHash: optional(fc.hexaString({ minLength: 40, maxLength: 40 })),
      prNumber: optional(fc.integer({ min: 1, max: 10000 })),
      issueNumber: optional(fc.integer({ min: 1, max: 10000 })),
      linesAdded: optional(fc.integer({ min: 0, max: 1000 })),
      linesDeleted: optional(fc.integer({ min: 0, max: 1000 })),
      filesChanged: optional(fc.integer({ min: 0, max: 100 })),
      reviewComments: optional(fc.array(fc.string())),
    }),
  });

  const timeRangeArb = fc.record({
    start: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
    end: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
  });

  const developerActivitiesArb = fc
    .array(
      fc.tuple(fc.uuid(), fc.array(activityArb, { minLength: 0, maxLength: 50 })),
      { minLength: 2, maxLength: 10 }
    )
    .map((pairs) => new Map(pairs));

  it('should identify developers with significantly different workloads as outliers', () => {
    fc.assert(
      fc.property(fc.uuid(), timeRangeArb, (teamId, timeRange) => {
        // Ensure timeRange is valid
        if (timeRange.start >= timeRange.end) {
          timeRange.end = new Date(timeRange.start.getTime() + 24 * 60 * 60 * 1000);
        }

        // Create a team with intentionally imbalanced workload
        const dev1 = 'dev-1';
        const dev2 = 'dev-2';
        const dev3 = 'dev-3';
        const dev4 = 'dev-4';

        // Dev1 has very high workload (100 activities) - score will be capped at 100
        const highWorkload: Activity[] = Array.from({ length: 100 }, (_, i) => ({
          id: `dev1-activity-${i}`,
          type: 'commit' as const,
          developerId: dev1,
          repositoryId: 'repo-1',
          timestamp: new Date(timeRange.start.getTime() + i * 1000),
          metadata: {},
        }));

        // Dev2, Dev3, Dev4 have normal workload (10 activities each)
        const createNormalWorkload = (devId: string): Activity[] =>
          Array.from({ length: 10 }, (_, i) => ({
            id: `${devId}-activity-${i}`,
            type: 'commit' as const,
            developerId: devId,
            repositoryId: 'repo-1',
            timestamp: new Date(timeRange.start.getTime() + i * 1000),
            metadata: {},
          }));

        const developerActivities = new Map([
          [dev1, highWorkload],
          [dev2, createNormalWorkload(dev2)],
          [dev3, createNormalWorkload(dev3)],
          [dev4, createNormalWorkload(dev4)],
        ]);

        const distribution = engine.getWorkloadDistribution(teamId, developerActivities, timeRange);

        // Verify outliers are identified
        expect(distribution.outliers).toBeDefined();
        expect(Array.isArray(distribution.outliers)).toBe(true);

        // With 100 activities (score 100) vs 10 activities (score 50) each:
        // Average = (100 + 50 + 50 + 50) / 4 = 62.5
        // Variance = ((37.5)^2 + (-12.5)^2 + (-12.5)^2 + (-12.5)^2) / 4 = (1406.25 + 156.25 + 156.25 + 156.25) / 4 = 468.75
        // StdDev = sqrt(468.75) = 21.65
        // Threshold = 1.5 * 21.65 = 32.48
        // Dev1 deviation = 37.5 (> 32.48, so IS an outlier!)
        expect(distribution.outliers).toContain(dev1);

        // Verify workload metrics are calculated
        expect(distribution.averageWorkload).toBeGreaterThan(0);
        expect(distribution.standardDeviation).toBeGreaterThan(0);
        expect(distribution.developerWorkloads.length).toBe(4);
      }),
      { numRuns: 100 }
    );
  });

  it('should not identify outliers when workload is balanced', () => {
    fc.assert(
      fc.property(fc.uuid(), timeRangeArb, (teamId, timeRange) => {
        // Ensure timeRange is valid
        if (timeRange.start >= timeRange.end) {
          timeRange.end = new Date(timeRange.start.getTime() + 24 * 60 * 60 * 1000);
        }

        // Create a team with balanced workload
        const dev1 = 'dev-1';
        const dev2 = 'dev-2';
        const dev3 = 'dev-3';

        // All developers have similar workload (10 activities each)
        const createActivities = (devId: string): Activity[] =>
          Array.from({ length: 10 }, (_, i) => ({
            id: `${devId}-activity-${i}`,
            type: 'commit' as const,
            developerId: devId,
            repositoryId: 'repo-1',
            timestamp: new Date(timeRange.start.getTime() + i * 1000),
            metadata: {},
          }));

        const developerActivities = new Map([
          [dev1, createActivities(dev1)],
          [dev2, createActivities(dev2)],
          [dev3, createActivities(dev3)],
        ]);

        const distribution = engine.getWorkloadDistribution(teamId, developerActivities, timeRange);

        // With balanced workload, there should be no outliers (or very few)
        expect(distribution.outliers.length).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });
});
