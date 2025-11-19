import * as fc from 'fast-check';
import { MetricsEngine } from '../metrics-engine';
import { Activity, TimeRange } from '@dev-tracker/shared-types';

// Feature: dev-performance-tracker, Property 21: All contribution types are valued in scoring
// Validates: Requirements 7.2

describe('Property 21: All contribution types are valued in scoring', () => {
  const engine = new MetricsEngine();

  const timeRangeArb = fc.record({
    start: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
    end: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
  });

  it('should value all contribution types (commits, PRs, issues, reviews) in productivity score', () => {
    fc.assert(
      fc.property(fc.uuid(), timeRangeArb, (developerId, timeRange) => {
        // Ensure timeRange is valid
        if (timeRange.start >= timeRange.end) {
          timeRange.end = new Date(timeRange.start.getTime() + 24 * 60 * 60 * 1000);
        }

        const baseTime = timeRange.start.getTime();

        // Create diverse contributions
        const diverseActivities: Activity[] = [
          {
            id: 'commit-1',
            type: 'commit',
            developerId,
            repositoryId: 'repo-1',
            timestamp: new Date(baseTime + 1000),
            metadata: { commitHash: 'a'.repeat(40), linesAdded: 10, filesChanged: 2 },
          },
          {
            id: 'pr-1',
            type: 'pull_request',
            developerId,
            repositoryId: 'repo-1',
            timestamp: new Date(baseTime + 2000),
            metadata: { prNumber: 1 },
          },
          {
            id: 'issue-1',
            type: 'issue',
            developerId,
            repositoryId: 'repo-1',
            timestamp: new Date(baseTime + 3000),
            metadata: { issueNumber: 1 },
          },
          {
            id: 'review-1',
            type: 'review',
            developerId,
            repositoryId: 'repo-1',
            timestamp: new Date(baseTime + 4000),
            metadata: { reviewComments: ['LGTM'] },
          },
        ];

        // Calculate score with diverse contributions
        const diverseScore = engine.calculateProductivityScore(developerId, diverseActivities, timeRange);

        // Create activities with only commits
        const commitOnlyActivities: Activity[] = [
          {
            id: 'commit-1',
            type: 'commit',
            developerId,
            repositoryId: 'repo-1',
            timestamp: new Date(baseTime + 1000),
            metadata: { commitHash: 'a'.repeat(40), linesAdded: 10, filesChanged: 2 },
          },
        ];

        const commitOnlyScore = engine.calculateProductivityScore(developerId, commitOnlyActivities, timeRange);

        // Diverse contributions should result in a higher score than commit-only
        // because all contribution types are valued
        expect(diverseScore.overallScore).toBeGreaterThan(commitOnlyScore.overallScore);

        // Verify that all component scores are present and contribute
        expect(diverseScore.components.commitFrequency).toBeGreaterThan(0);
        expect(diverseScore.components.prCompletionRate).toBeGreaterThan(0);
        expect(diverseScore.components.issueResolutionCount).toBeGreaterThan(0);
        expect(diverseScore.components.codeReviewParticipation).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should reflect each contribution type in the corresponding component score', () => {
    fc.assert(
      fc.property(fc.uuid(), timeRangeArb, (developerId, timeRange) => {
        // Ensure timeRange is valid
        if (timeRange.start >= timeRange.end) {
          timeRange.end = new Date(timeRange.start.getTime() + 24 * 60 * 60 * 1000);
        }

        const baseTime = timeRange.start.getTime();

        // Test each contribution type individually
        const commitActivity: Activity = {
          id: 'commit-1',
          type: 'commit',
          developerId,
          repositoryId: 'repo-1',
          timestamp: new Date(baseTime + 1000),
          metadata: { commitHash: 'a'.repeat(40) },
        };

        const prActivity: Activity = {
          id: 'pr-1',
          type: 'pull_request',
          developerId,
          repositoryId: 'repo-1',
          timestamp: new Date(baseTime + 2000),
          metadata: { prNumber: 1 },
        };

        const issueActivity: Activity = {
          id: 'issue-1',
          type: 'issue',
          developerId,
          repositoryId: 'repo-1',
          timestamp: new Date(baseTime + 3000),
          metadata: { issueNumber: 1 },
        };

        const reviewActivity: Activity = {
          id: 'review-1',
          type: 'review',
          developerId,
          repositoryId: 'repo-1',
          timestamp: new Date(baseTime + 4000),
          metadata: { reviewComments: ['Good work'] },
        };

        // Calculate scores for each type
        const commitScore = engine.calculateProductivityScore(developerId, [commitActivity], timeRange);
        const prScore = engine.calculateProductivityScore(developerId, [prActivity], timeRange);
        const issueScore = engine.calculateProductivityScore(developerId, [issueActivity], timeRange);
        const reviewScore = engine.calculateProductivityScore(developerId, [reviewActivity], timeRange);

        // Each contribution type should affect its corresponding component
        expect(commitScore.components.commitFrequency).toBeGreaterThan(0);
        expect(prScore.components.prCompletionRate).toBeGreaterThan(0);
        expect(issueScore.components.issueResolutionCount).toBeGreaterThan(0);
        expect(reviewScore.components.codeReviewParticipation).toBeGreaterThan(0);

        // Each should contribute to the overall score
        expect(commitScore.overallScore).toBeGreaterThan(0);
        expect(prScore.overallScore).toBeGreaterThan(0);
        expect(issueScore.overallScore).toBeGreaterThan(0);
        expect(reviewScore.overallScore).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});
