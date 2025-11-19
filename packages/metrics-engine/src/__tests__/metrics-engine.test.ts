import { MetricsEngine } from '../metrics-engine';
import { Activity, TimeRange } from '@dev-tracker/shared-types';

describe('MetricsEngine', () => {
  let engine: MetricsEngine;
  let timeRange: TimeRange;

  beforeEach(() => {
    engine = new MetricsEngine();
    timeRange = {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31'),
    };
  });

  describe('calculateProductivityScore', () => {
    it('should calculate productivity with various activity patterns', () => {
      const developerId = 'dev-1';
      const activities: Activity[] = [
        {
          id: 'commit-1',
          type: 'commit',
          developerId,
          repositoryId: 'repo-1',
          timestamp: new Date('2024-01-05'),
          metadata: { commitHash: 'abc123', linesAdded: 50, filesChanged: 3 },
        },
        {
          id: 'pr-1',
          type: 'pull_request',
          developerId,
          repositoryId: 'repo-1',
          timestamp: new Date('2024-01-10'),
          metadata: { prNumber: 42 },
        },
        {
          id: 'issue-1',
          type: 'issue',
          developerId,
          repositoryId: 'repo-1',
          timestamp: new Date('2024-01-15'),
          metadata: { issueNumber: 10 },
        },
        {
          id: 'review-1',
          type: 'review',
          developerId,
          repositoryId: 'repo-1',
          timestamp: new Date('2024-01-20'),
          metadata: { reviewComments: ['LGTM', 'Good work'] },
        },
      ];

      const score = engine.calculateProductivityScore(developerId, activities, timeRange);

      expect(score.developerId).toBe(developerId);
      expect(score.overallScore).toBeGreaterThan(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
      expect(score.components.commitFrequency).toBeGreaterThan(0);
      expect(score.components.prCompletionRate).toBeGreaterThan(0);
      expect(score.components.issueResolutionCount).toBeGreaterThan(0);
      expect(score.components.codeReviewParticipation).toBeGreaterThan(0);
    });

    it('should produce zero score for zero activity', () => {
      const developerId = 'dev-1';
      const activities: Activity[] = [];

      const score = engine.calculateProductivityScore(developerId, activities, timeRange);

      expect(score.overallScore).toBe(0);
      expect(score.components.commitFrequency).toBe(0);
      expect(score.components.prCompletionRate).toBe(0);
      expect(score.components.issueResolutionCount).toBe(0);
      expect(score.components.codeReviewParticipation).toBe(0);
    });

    it('should normalize scores to 0-100 range', () => {
      const developerId = 'dev-1';
      // Create many activities to test normalization
      const activities: Activity[] = Array.from({ length: 200 }, (_, i) => ({
        id: `activity-${i}`,
        type: 'commit' as const,
        developerId,
        repositoryId: 'repo-1',
        timestamp: new Date('2024-01-15'),
        metadata: { commitHash: `hash-${i}` },
      }));

      const score = engine.calculateProductivityScore(developerId, activities, timeRange);

      expect(score.overallScore).toBeGreaterThanOrEqual(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
      expect(score.components.commitFrequency).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateTeamHealthScore', () => {
    it('should calculate team health with multiple developers', () => {
      const teamId = 'team-1';
      const developerActivities = new Map<string, Activity[]>([
        [
          'dev-1',
          [
            {
              id: 'commit-1',
              type: 'commit',
              developerId: 'dev-1',
              repositoryId: 'repo-1',
              timestamp: new Date('2024-01-05'),
              metadata: {},
            },
            {
              id: 'review-1',
              type: 'review',
              developerId: 'dev-1',
              repositoryId: 'repo-1',
              timestamp: new Date('2024-01-10'),
              metadata: { reviewComments: ['Good'] },
            },
          ],
        ],
        [
          'dev-2',
          [
            {
              id: 'pr-1',
              type: 'pull_request',
              developerId: 'dev-2',
              repositoryId: 'repo-1',
              timestamp: new Date('2024-01-08'),
              metadata: { prNumber: 1 },
            },
          ],
        ],
      ]);

      const score = engine.calculateTeamHealthScore(teamId, developerActivities, timeRange);

      expect(score.teamId).toBe(teamId);
      expect(score.overallScore).toBeGreaterThanOrEqual(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
      expect(score.components.collaborationQuality).toBeGreaterThanOrEqual(0);
      expect(score.components.workloadBalance).toBeGreaterThanOrEqual(0);
      expect(score.components.communicationHealth).toBeGreaterThanOrEqual(0);
      expect(score.components.knowledgeSharing).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getWorkloadDistribution', () => {
    it('should analyze workload distribution', () => {
      const teamId = 'team-1';
      const developerActivities = new Map<string, Activity[]>([
        [
          'dev-1',
          Array.from({ length: 10 }, (_, i) => ({
            id: `activity-${i}`,
            type: 'commit' as const,
            developerId: 'dev-1',
            repositoryId: 'repo-1',
            timestamp: new Date('2024-01-05'),
            metadata: {},
          })),
        ],
        [
          'dev-2',
          Array.from({ length: 5 }, (_, i) => ({
            id: `activity-${i}`,
            type: 'commit' as const,
            developerId: 'dev-2',
            repositoryId: 'repo-1',
            timestamp: new Date('2024-01-05'),
            metadata: {},
          })),
        ],
      ]);

      const distribution = engine.getWorkloadDistribution(teamId, developerActivities, timeRange);

      expect(distribution.teamId).toBe(teamId);
      expect(distribution.developerWorkloads).toHaveLength(2);
      expect(distribution.averageWorkload).toBeGreaterThan(0);
      expect(distribution.standardDeviation).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(distribution.outliers)).toBe(true);
    });
  });

  describe('updateMetricWeights', () => {
    it('should update metric weights when valid', () => {
      const newWeights = {
        commitFrequency: 0.4,
        prCompletionRate: 0.3,
        issueResolutionCount: 0.2,
        codeReviewParticipation: 0.1,
      };

      expect(() => engine.updateMetricWeights(newWeights)).not.toThrow();
    });

    it('should reject weights that do not sum to 1.0', () => {
      const invalidWeights = {
        commitFrequency: 0.5,
        prCompletionRate: 0.3,
        issueResolutionCount: 0.1,
        codeReviewParticipation: 0.05, // Sum = 0.95, not 1.0
      };

      expect(() => engine.updateMetricWeights(invalidWeights)).toThrow('Metric weights must sum to 1.0');
    });
  });

  describe('getCollaborationMetrics', () => {
    it('should calculate collaboration metrics', () => {
      const teamId = 'team-1';
      const developerActivities = new Map<string, Activity[]>([
        [
          'dev-1',
          [
            {
              id: 'review-1',
              type: 'review',
              developerId: 'dev-1',
              repositoryId: 'repo-1',
              timestamp: new Date('2024-01-05'),
              metadata: { reviewComments: ['LGTM'] },
            },
          ],
        ],
        [
          'dev-2',
          [
            {
              id: 'commit-1',
              type: 'commit',
              developerId: 'dev-2',
              repositoryId: 'repo-1',
              timestamp: new Date('2024-01-05T00:30:00'),
              metadata: { commitHash: 'abc123' },
            },
          ],
        ],
      ]);

      const metrics = engine.getCollaborationMetrics(teamId, developerActivities, timeRange);

      expect(metrics.teamId).toBe(teamId);
      expect(metrics.codeReviewCount).toBeGreaterThanOrEqual(0);
      expect(metrics.crossDeveloperInteractions).toBeGreaterThanOrEqual(0);
      expect(metrics.pairProgrammingIndicators).toBeGreaterThanOrEqual(0);
      expect(metrics.collaborationScore).toBeGreaterThanOrEqual(0);
      expect(metrics.collaborationScore).toBeLessThanOrEqual(100);
    });
  });
});
