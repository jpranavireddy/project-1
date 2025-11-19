import * as fc from 'fast-check';
import { MetricsEngine } from '../metrics-engine';
import { Activity, TimeRange } from '@dev-tracker/shared-types';

// Feature: dev-performance-tracker, Property 14: Team health scores include all required factors
// Validates: Requirements 5.1

describe('Property 14: Team health scores include all required factors', () => {
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

  it('should include all required factors in team health score', () => {
    fc.assert(
      fc.property(fc.uuid(), developerActivitiesArb, timeRangeArb, (teamId, developerActivities, timeRange) => {
        // Ensure timeRange is valid
        if (timeRange.start >= timeRange.end) {
          timeRange.end = new Date(timeRange.start.getTime() + 24 * 60 * 60 * 1000);
        }

        const score = engine.calculateTeamHealthScore(teamId, developerActivities, timeRange);

        // Verify all required components are present
        expect(score.components).toHaveProperty('collaborationQuality');
        expect(score.components).toHaveProperty('workloadBalance');
        expect(score.components).toHaveProperty('communicationHealth');
        expect(score.components).toHaveProperty('knowledgeSharing');

        // Verify components are numbers
        expect(typeof score.components.collaborationQuality).toBe('number');
        expect(typeof score.components.workloadBalance).toBe('number');
        expect(typeof score.components.communicationHealth).toBe('number');
        expect(typeof score.components.knowledgeSharing).toBe('number');

        // Verify components are non-negative and bounded
        expect(score.components.collaborationQuality).toBeGreaterThanOrEqual(0);
        expect(score.components.collaborationQuality).toBeLessThanOrEqual(100);
        expect(score.components.workloadBalance).toBeGreaterThanOrEqual(0);
        expect(score.components.workloadBalance).toBeLessThanOrEqual(100);
        expect(score.components.communicationHealth).toBeGreaterThanOrEqual(0);
        expect(score.components.communicationHealth).toBeLessThanOrEqual(100);
        expect(score.components.knowledgeSharing).toBeGreaterThanOrEqual(0);
        expect(score.components.knowledgeSharing).toBeLessThanOrEqual(100);

        // Verify overall score is bounded
        expect(score.overallScore).toBeGreaterThanOrEqual(0);
        expect(score.overallScore).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });
});
