import * as fc from 'fast-check';
import { MetricsEngine } from '../metrics-engine';
import { Activity, TimeRange } from '@dev-tracker/shared-types';

// Feature: dev-performance-tracker, Property 20: Performance scoring is consistent across developers
// Validates: Requirements 7.1

describe('Property 20: Performance scoring is consistent across developers', () => {
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

  it('should produce equal scores for developers with identical activity patterns', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.array(activityArb, { minLength: 0, maxLength: 50 }),
        timeRangeArb,
        (dev1Id, dev2Id, activities, timeRange) => {
          // Ensure timeRange is valid
          if (timeRange.start >= timeRange.end) {
            timeRange.end = new Date(timeRange.start.getTime() + 24 * 60 * 60 * 1000);
          }

          // Ensure developers are different
          if (dev1Id === dev2Id) {
            dev2Id = dev1Id + '-different';
          }

          const engine = new MetricsEngine();

          // Create identical activity patterns for both developers
          const dev1Activities = activities.map((a) => ({
            ...a,
            id: `dev1-${a.id}`,
            developerId: dev1Id,
          }));

          const dev2Activities = activities.map((a) => ({
            ...a,
            id: `dev2-${a.id}`,
            developerId: dev2Id,
          }));

          const score1 = engine.calculateProductivityScore(dev1Id, dev1Activities, timeRange);
          const score2 = engine.calculateProductivityScore(dev2Id, dev2Activities, timeRange);

          // Scores should be equal for identical activity patterns
          expect(score1.overallScore).toBe(score2.overallScore);
          expect(score1.components.commitFrequency).toBe(score2.components.commitFrequency);
          expect(score1.components.prCompletionRate).toBe(score2.components.prCompletionRate);
          expect(score1.components.issueResolutionCount).toBe(score2.components.issueResolutionCount);
          expect(score1.components.codeReviewParticipation).toBe(score2.components.codeReviewParticipation);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply consistent scoring criteria regardless of developer identity', () => {
    fc.assert(
      fc.property(fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }), timeRangeArb, (developerIds, timeRange) => {
        // Ensure timeRange is valid
        if (timeRange.start >= timeRange.end) {
          timeRange.end = new Date(timeRange.start.getTime() + 24 * 60 * 60 * 1000);
        }

        const engine = new MetricsEngine();

        // Create the same activity pattern for all developers
        const baseTime = timeRange.start.getTime();
        const createStandardActivities = (devId: string): Activity[] => [
          {
            id: `${devId}-commit-1`,
            type: 'commit',
            developerId: devId,
            repositoryId: 'repo-1',
            timestamp: new Date(baseTime + 1000),
            metadata: { commitHash: 'a'.repeat(40), linesAdded: 10, filesChanged: 2 },
          },
          {
            id: `${devId}-pr-1`,
            type: 'pull_request',
            developerId: devId,
            repositoryId: 'repo-1',
            timestamp: new Date(baseTime + 2000),
            metadata: { prNumber: 1 },
          },
          {
            id: `${devId}-review-1`,
            type: 'review',
            developerId: devId,
            repositoryId: 'repo-1',
            timestamp: new Date(baseTime + 3000),
            metadata: { reviewComments: ['LGTM'] },
          },
        ];

        const scores = developerIds.map((devId) => {
          const activities = createStandardActivities(devId);
          return engine.calculateProductivityScore(devId, activities, timeRange);
        });

        // All scores should be identical
        const firstScore = scores[0];
        for (let i = 1; i < scores.length; i++) {
          expect(scores[i].overallScore).toBe(firstScore.overallScore);
          expect(scores[i].components.commitFrequency).toBe(firstScore.components.commitFrequency);
          expect(scores[i].components.prCompletionRate).toBe(firstScore.components.prCompletionRate);
          expect(scores[i].components.issueResolutionCount).toBe(firstScore.components.issueResolutionCount);
          expect(scores[i].components.codeReviewParticipation).toBe(firstScore.components.codeReviewParticipation);
        }
      }),
      { numRuns: 100 }
    );
  });
});
