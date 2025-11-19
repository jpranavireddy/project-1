import * as fc from 'fast-check';
import { MetricsEngine } from '../metrics-engine';
import { Activity, TimeRange } from '@dev-tracker/shared-types';

// Feature: dev-performance-tracker, Property 16: Collaboration metrics measure cross-developer interactions
// Validates: Requirements 5.3

describe('Property 16: Collaboration metrics measure cross-developer interactions', () => {
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
      { minLength: 1, maxLength: 10 }
    )
    .map((pairs) => new Map(pairs));

  it('should measure cross-developer interactions including code reviews', () => {
    fc.assert(
      fc.property(fc.uuid(), developerActivitiesArb, timeRangeArb, (teamId, developerActivities, timeRange) => {
        // Ensure timeRange is valid
        if (timeRange.start >= timeRange.end) {
          timeRange.end = new Date(timeRange.start.getTime() + 24 * 60 * 60 * 1000);
        }

        const metrics = engine.getCollaborationMetrics(teamId, developerActivities, timeRange);

        // Verify all required metrics are present
        expect(metrics).toHaveProperty('crossDeveloperInteractions');
        expect(metrics).toHaveProperty('codeReviewCount');
        expect(metrics).toHaveProperty('pairProgrammingIndicators');
        expect(metrics).toHaveProperty('collaborationScore');

        // Verify metrics are numbers
        expect(typeof metrics.crossDeveloperInteractions).toBe('number');
        expect(typeof metrics.codeReviewCount).toBe('number');
        expect(typeof metrics.pairProgrammingIndicators).toBe('number');
        expect(typeof metrics.collaborationScore).toBe('number');

        // Verify metrics are non-negative
        expect(metrics.crossDeveloperInteractions).toBeGreaterThanOrEqual(0);
        expect(metrics.codeReviewCount).toBeGreaterThanOrEqual(0);
        expect(metrics.pairProgrammingIndicators).toBeGreaterThanOrEqual(0);
        expect(metrics.collaborationScore).toBeGreaterThanOrEqual(0);
        expect(metrics.collaborationScore).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });

  it('should count code reviews as cross-developer interactions', () => {
    fc.assert(
      fc.property(fc.uuid(), timeRangeArb, (teamId, timeRange) => {
        // Ensure timeRange is valid
        if (timeRange.start >= timeRange.end) {
          timeRange.end = new Date(timeRange.start.getTime() + 24 * 60 * 60 * 1000);
        }

        const dev1 = 'dev-1';
        const dev2 = 'dev-2';

        // Create activities with reviews
        const dev1Activities: Activity[] = [
          {
            id: 'review-1',
            type: 'review',
            developerId: dev1,
            repositoryId: 'repo-1',
            timestamp: new Date(timeRange.start.getTime() + 1000),
            metadata: { reviewComments: ['Good work'] },
          },
          {
            id: 'review-2',
            type: 'review',
            developerId: dev1,
            repositoryId: 'repo-1',
            timestamp: new Date(timeRange.start.getTime() + 2000),
            metadata: { reviewComments: ['Needs changes'] },
          },
        ];

        const dev2Activities: Activity[] = [
          {
            id: 'commit-1',
            type: 'commit',
            developerId: dev2,
            repositoryId: 'repo-1',
            timestamp: new Date(timeRange.start.getTime() + 3000),
            metadata: {},
          },
        ];

        const developerActivities = new Map([
          [dev1, dev1Activities],
          [dev2, dev2Activities],
        ]);

        const metrics = engine.getCollaborationMetrics(teamId, developerActivities, timeRange);

        // Code review count should match the number of review activities
        expect(metrics.codeReviewCount).toBe(2);

        // Cross-developer interactions should include the reviews
        expect(metrics.crossDeveloperInteractions).toBeGreaterThanOrEqual(2);
      }),
      { numRuns: 100 }
    );
  });

  it('should detect pair programming indicators from close-timed commits', () => {
    fc.assert(
      fc.property(fc.uuid(), timeRangeArb, (teamId, timeRange) => {
        // Ensure timeRange is valid
        if (timeRange.start >= timeRange.end) {
          timeRange.end = new Date(timeRange.start.getTime() + 24 * 60 * 60 * 1000);
        }

        const dev1 = 'dev-1';
        const dev2 = 'dev-2';
        const repoId = 'repo-1';

        // Create commits by different developers in the same repo within 1 hour
        const baseTime = timeRange.start.getTime();
        const dev1Activities: Activity[] = [
          {
            id: 'commit-1',
            type: 'commit',
            developerId: dev1,
            repositoryId: repoId,
            timestamp: new Date(baseTime + 1000),
            metadata: { commitHash: 'a'.repeat(40) },
          },
        ];

        const dev2Activities: Activity[] = [
          {
            id: 'commit-2',
            type: 'commit',
            developerId: dev2,
            repositoryId: repoId,
            timestamp: new Date(baseTime + 30 * 60 * 1000), // 30 minutes later
            metadata: { commitHash: 'b'.repeat(40) },
          },
        ];

        const developerActivities = new Map([
          [dev1, dev1Activities],
          [dev2, dev2Activities],
        ]);

        const metrics = engine.getCollaborationMetrics(teamId, developerActivities, timeRange);

        // Should detect pair programming indicator
        expect(metrics.pairProgrammingIndicators).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });
});
