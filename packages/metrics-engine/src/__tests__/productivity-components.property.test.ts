import * as fc from 'fast-check';
import { MetricsEngine } from '../metrics-engine';
import { Activity, TimeRange } from '@dev-tracker/shared-types';

// Feature: dev-performance-tracker, Property 7: Productivity scores include all required components
// Validates: Requirements 3.1

describe('Property 7: Productivity scores include all required components', () => {
  const engine = new MetricsEngine();

  // Helper to convert null to undefined
  const optional = <T>(arb: fc.Arbitrary<T>): fc.Arbitrary<T | undefined> =>
    fc.option(arb, { nil: undefined });

  // Generator for activities
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

  it('should include all required components in productivity score', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(activityArb, { minLength: 0, maxLength: 100 }),
        timeRangeArb,
        (developerId, activities, timeRange) => {
          // Ensure timeRange is valid
          if (timeRange.start >= timeRange.end) {
            timeRange.end = new Date(timeRange.start.getTime() + 24 * 60 * 60 * 1000);
          }

          const score = engine.calculateProductivityScore(developerId, activities, timeRange);

          // Verify all required components are present
          expect(score.components).toHaveProperty('commitFrequency');
          expect(score.components).toHaveProperty('prCompletionRate');
          expect(score.components).toHaveProperty('issueResolutionCount');
          expect(score.components).toHaveProperty('codeReviewParticipation');

          // Verify components are numbers
          expect(typeof score.components.commitFrequency).toBe('number');
          expect(typeof score.components.prCompletionRate).toBe('number');
          expect(typeof score.components.issueResolutionCount).toBe('number');
          expect(typeof score.components.codeReviewParticipation).toBe('number');

          // Verify components are non-negative
          expect(score.components.commitFrequency).toBeGreaterThanOrEqual(0);
          expect(score.components.prCompletionRate).toBeGreaterThanOrEqual(0);
          expect(score.components.issueResolutionCount).toBeGreaterThanOrEqual(0);
          expect(score.components.codeReviewParticipation).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
