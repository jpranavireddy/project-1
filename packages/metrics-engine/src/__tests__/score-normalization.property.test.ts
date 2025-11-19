import * as fc from 'fast-check';
import { MetricsEngine } from '../metrics-engine';
import { Activity, TimeRange } from '@dev-tracker/shared-types';

// Feature: dev-performance-tracker, Property 8: Productivity scores are normalized and bounded
// Validates: Requirements 3.2

describe('Property 8: Productivity scores are normalized and bounded', () => {
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

  it('should produce scores bounded between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(activityArb, { minLength: 0, maxLength: 200 }),
        timeRangeArb,
        (developerId, activities, timeRange) => {
          // Ensure timeRange is valid
          if (timeRange.start >= timeRange.end) {
            timeRange.end = new Date(timeRange.start.getTime() + 24 * 60 * 60 * 1000);
          }

          const score = engine.calculateProductivityScore(developerId, activities, timeRange);

          // Verify score is bounded
          expect(score.overallScore).toBeGreaterThanOrEqual(0);
          expect(score.overallScore).toBeLessThanOrEqual(100);

          // Verify all components are bounded
          expect(score.components.commitFrequency).toBeGreaterThanOrEqual(0);
          expect(score.components.commitFrequency).toBeLessThanOrEqual(100);
          expect(score.components.prCompletionRate).toBeGreaterThanOrEqual(0);
          expect(score.components.prCompletionRate).toBeLessThanOrEqual(100);
          expect(score.components.issueResolutionCount).toBeGreaterThanOrEqual(0);
          expect(score.components.issueResolutionCount).toBeLessThanOrEqual(100);
          expect(score.components.codeReviewParticipation).toBeGreaterThanOrEqual(0);
          expect(score.components.codeReviewParticipation).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return zero score for zero activities', () => {
    fc.assert(
      fc.property(fc.uuid(), timeRangeArb, (developerId, timeRange) => {
        // Ensure timeRange is valid
        if (timeRange.start >= timeRange.end) {
          timeRange.end = new Date(timeRange.start.getTime() + 24 * 60 * 60 * 1000);
        }

        const score = engine.calculateProductivityScore(developerId, [], timeRange);

        // Zero activities should produce zero score
        expect(score.overallScore).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});
