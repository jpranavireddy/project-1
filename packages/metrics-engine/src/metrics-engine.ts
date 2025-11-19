import { Activity, TimeRange, ProductivityScore, TeamHealthScore, Alert } from '@dev-tracker/shared-types';
import {
  MetricWeights,
  WorkloadDistribution,
  DeveloperWorkload,
  CollaborationMetrics,
  CodeQualityScore,
  MetricSnapshot,
} from './types';

export class MetricsEngine {
  private metricWeights: MetricWeights = {
    commitFrequency: 0.3,
    prCompletionRate: 0.3,
    issueResolutionCount: 0.2,
    codeReviewParticipation: 0.2,
  };

  private snapshots: MetricSnapshot[] = [];

  /**
   * Calculate productivity score for a developer based on their activities
   */
  calculateProductivityScore(
    developerId: string,
    activities: Activity[],
    timeRange: TimeRange
  ): ProductivityScore {
    const components = this.calculateProductivityComponents(activities, timeRange);
    const overallScore = this.calculateWeightedScore(components);
    const normalizedScore = this.normalizeScore(overallScore, activities.length);

    const trend = this.calculateTrend(developerId, normalizedScore);

    const score: ProductivityScore = {
      developerId,
      timeRange,
      overallScore: normalizedScore,
      components,
      trend,
      calculatedAt: new Date(),
    };

    // Store snapshot
    this.storeSnapshot({
      id: `${developerId}-${Date.now()}`,
      developerId,
      metricType: 'productivity',
      score: normalizedScore,
      timestamp: new Date(),
      metadata: { components },
    });

    return score;
  }

  /**
   * Calculate individual productivity components
   */
  private calculateProductivityComponents(
    activities: Activity[],
    timeRange: TimeRange
  ): ProductivityScore['components'] {
    const commits = activities.filter((a) => a.type === 'commit');
    const prs = activities.filter((a) => a.type === 'pull_request');
    const issues = activities.filter((a) => a.type === 'issue');
    const reviews = activities.filter((a) => a.type === 'review');

    const timeRangeMs = timeRange.end.getTime() - timeRange.start.getTime();
    const days = timeRangeMs / (1000 * 60 * 60 * 24);

    // Commit frequency: commits per day, normalized to 0-100
    const commitFrequency = Math.min(100, (commits.length / Math.max(days, 1)) * 20);

    // PR completion rate: percentage of PRs (assuming all collected PRs are completed)
    const prCompletionRate = prs.length > 0 ? 100 : 0;

    // Issue resolution count: normalized to 0-100
    const issueResolutionCount = Math.min(100, issues.length * 10);

    // Code review participation: normalized to 0-100
    const codeReviewParticipation = Math.min(100, reviews.length * 10);

    return {
      commitFrequency,
      prCompletionRate,
      issueResolutionCount,
      codeReviewParticipation,
    };
  }

  /**
   * Calculate weighted score from components
   */
  private calculateWeightedScore(components: ProductivityScore['components']): number {
    return (
      components.commitFrequency * this.metricWeights.commitFrequency +
      components.prCompletionRate * this.metricWeights.prCompletionRate +
      components.issueResolutionCount * this.metricWeights.issueResolutionCount +
      components.codeReviewParticipation * this.metricWeights.codeReviewParticipation
    );
  }

  /**
   * Normalize score to 0-100 range accounting for workload type
   */
  private normalizeScore(rawScore: number, activityCount: number): number {
    // If no activities, return 0
    if (activityCount === 0) {
      return 0;
    }

    // Ensure score is bounded between 0 and 100
    return Math.max(0, Math.min(100, rawScore));
  }

  /**
   * Calculate trend based on historical data
   */
  private calculateTrend(developerId: string, currentScore: number): 'increasing' | 'stable' | 'decreasing' {
    const recentSnapshots = this.snapshots
      .filter((s) => s.developerId === developerId && s.metricType === 'productivity')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);

    if (recentSnapshots.length < 2) {
      return 'stable';
    }

    const avgPreviousScore =
      recentSnapshots.slice(1).reduce((sum, s) => sum + s.score, 0) / (recentSnapshots.length - 1);

    const diff = currentScore - avgPreviousScore;

    if (diff > 5) return 'increasing';
    if (diff < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate code quality score
   */
  calculateCodeQualityScore(
    developerId: string,
    activities: Activity[],
    timeRange: TimeRange
  ): CodeQualityScore {
    const commits = activities.filter((a) => a.type === 'commit');

    // Simple heuristics for code quality
    const complexity = this.calculateComplexityScore(commits);
    const documentation = this.calculateDocumentationScore(commits);
    const standards = this.calculateStandardsScore(commits);

    const overallScore = (complexity + documentation + standards) / 3;

    return {
      developerId,
      timeRange,
      overallScore,
      components: {
        complexity,
        documentation,
        standards,
      },
      calculatedAt: new Date(),
    };
  }

  private calculateComplexityScore(commits: Activity[]): number {
    if (commits.length === 0) return 0;

    // Lower lines changed per commit suggests better modularity
    const avgLinesChanged =
      commits.reduce((sum, c) => sum + (c.metadata.linesAdded || 0) + (c.metadata.linesDeleted || 0), 0) /
      commits.length;

    // Score inversely proportional to lines changed (capped at 100)
    return Math.max(0, Math.min(100, 100 - avgLinesChanged / 10));
  }

  private calculateDocumentationScore(commits: Activity[]): number {
    if (commits.length === 0) return 0;

    // Simple heuristic: commits with meaningful messages
    const meaningfulCommits = commits.filter((c) => {
      const msg = c.metadata.commitHash || '';
      return msg.length > 20; // Arbitrary threshold
    });

    return (meaningfulCommits.length / commits.length) * 100;
  }

  private calculateStandardsScore(commits: Activity[]): number {
    if (commits.length === 0) return 0;

    // Simple heuristic: reasonable file changes per commit
    const avgFilesChanged = commits.reduce((sum, c) => sum + (c.metadata.filesChanged || 0), 0) / commits.length;

    // Optimal range: 1-5 files per commit
    if (avgFilesChanged >= 1 && avgFilesChanged <= 5) return 100;
    if (avgFilesChanged < 1) return 50;
    return Math.max(0, 100 - (avgFilesChanged - 5) * 10);
  }

  /**
   * Calculate team health score
   */
  calculateTeamHealthScore(
    teamId: string,
    developerActivities: Map<string, Activity[]>,
    timeRange: TimeRange
  ): TeamHealthScore {
    const collaborationQuality = this.calculateCollaborationQuality(developerActivities);
    const workloadBalance = this.calculateWorkloadBalance(developerActivities);
    const communicationHealth = this.calculateCommunicationHealth(developerActivities);
    const knowledgeSharing = this.calculateKnowledgeSharing(developerActivities);

    const overallScore = (collaborationQuality + workloadBalance + communicationHealth + knowledgeSharing) / 4;

    const alerts = this.generateTeamHealthAlerts(
      teamId,
      workloadBalance,
      collaborationQuality,
      communicationHealth
    );

    const score: TeamHealthScore = {
      teamId,
      timeRange,
      overallScore,
      components: {
        collaborationQuality,
        workloadBalance,
        communicationHealth,
        knowledgeSharing,
      },
      alerts,
      calculatedAt: new Date(),
    };

    // Store snapshot
    this.storeSnapshot({
      id: `${teamId}-${Date.now()}`,
      developerId: teamId,
      teamId,
      metricType: 'team_health',
      score: overallScore,
      timestamp: new Date(),
      metadata: { components: score.components },
    });

    return score;
  }

  private calculateCollaborationQuality(developerActivities: Map<string, Activity[]>): number {
    let totalReviews = 0;
    let totalActivities = 0;

    for (const activities of developerActivities.values()) {
      totalReviews += activities.filter((a) => a.type === 'review').length;
      totalActivities += activities.length;
    }

    if (totalActivities === 0) return 0;

    // Higher review ratio indicates better collaboration
    const reviewRatio = totalReviews / totalActivities;
    return Math.min(100, reviewRatio * 200);
  }

  private calculateWorkloadBalance(developerActivities: Map<string, Activity[]>): number {
    const workloads = Array.from(developerActivities.values()).map((activities) => activities.length);

    if (workloads.length === 0) return 0;

    const avg = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
    const variance = workloads.reduce((sum, w) => sum + Math.pow(w - avg, 2), 0) / workloads.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation indicates better balance
    const coefficientOfVariation = avg > 0 ? stdDev / avg : 0;
    return Math.max(0, Math.min(100, 100 - coefficientOfVariation * 100));
  }

  private calculateCommunicationHealth(developerActivities: Map<string, Activity[]>): number {
    let totalPRs = 0;
    let totalReviews = 0;

    for (const activities of developerActivities.values()) {
      totalPRs += activities.filter((a) => a.type === 'pull_request').length;
      totalReviews += activities.filter((a) => a.type === 'review').length;
    }

    if (totalPRs === 0) return 0;

    // Good communication: multiple reviews per PR
    const reviewsPerPR = totalReviews / totalPRs;
    return Math.min(100, reviewsPerPR * 50);
  }

  private calculateKnowledgeSharing(developerActivities: Map<string, Activity[]>): number {
    // Heuristic: developers working on multiple repositories
    const reposByDeveloper = new Map<string, Set<string>>();

    for (const [devId, activities] of developerActivities.entries()) {
      const repos = new Set(activities.map((a) => a.repositoryId));
      reposByDeveloper.set(devId, repos);
    }

    const avgReposPerDev =
      Array.from(reposByDeveloper.values()).reduce((sum, repos) => sum + repos.size, 0) /
      Math.max(reposByDeveloper.size, 1);

    return Math.min(100, avgReposPerDev * 30);
  }

  private generateTeamHealthAlerts(
    teamId: string,
    workloadBalance: number,
    collaborationQuality: number,
    communicationHealth: number
  ): Alert[] {
    const alerts: Alert[] = [];

    if (workloadBalance < 50) {
      alerts.push({
        id: `${teamId}-workload-${Date.now()}`,
        type: 'workload_imbalance',
        severity: 'high',
        message: 'Significant workload imbalance detected in the team',
        createdAt: new Date(),
      });
    }

    if (collaborationQuality < 40) {
      alerts.push({
        id: `${teamId}-collaboration-${Date.now()}`,
        type: 'low_collaboration',
        severity: 'medium',
        message: 'Low collaboration quality detected',
        createdAt: new Date(),
      });
    }

    if (communicationHealth < 40) {
      alerts.push({
        id: `${teamId}-communication-${Date.now()}`,
        type: 'poor_communication',
        severity: 'medium',
        message: 'Communication health is below optimal levels',
        createdAt: new Date(),
      });
    }

    return alerts;
  }

  /**
   * Analyze workload distribution across team
   */
  getWorkloadDistribution(
    teamId: string,
    developerActivities: Map<string, Activity[]>,
    timeRange: TimeRange
  ): WorkloadDistribution {
    const developerWorkloads: DeveloperWorkload[] = [];

    for (const [devId, activities] of developerActivities.entries()) {
      const activityCount = activities.length;
      const workloadScore = Math.min(100, activityCount * 5);

      developerWorkloads.push({
        developerId: devId,
        activityCount,
        workloadScore,
        deviationFromAverage: 0, // Will be calculated below
      });
    }

    const averageWorkload =
      developerWorkloads.reduce((sum, dw) => sum + dw.workloadScore, 0) /
      Math.max(developerWorkloads.length, 1);

    const variance =
      developerWorkloads.reduce((sum, dw) => sum + Math.pow(dw.workloadScore - averageWorkload, 2), 0) /
      Math.max(developerWorkloads.length, 1);
    const standardDeviation = Math.sqrt(variance);

    // Update deviations and identify outliers
    const outliers: string[] = [];
    for (const dw of developerWorkloads) {
      dw.deviationFromAverage = dw.workloadScore - averageWorkload;

      // Outlier: more than 1.5 standard deviations from mean
      if (Math.abs(dw.deviationFromAverage) > 1.5 * standardDeviation) {
        outliers.push(dw.developerId);
      }
    }

    return {
      teamId,
      timeRange,
      developerWorkloads,
      averageWorkload,
      standardDeviation,
      outliers,
    };
  }

  /**
   * Calculate collaboration metrics
   */
  getCollaborationMetrics(
    teamId: string,
    developerActivities: Map<string, Activity[]>,
    timeRange: TimeRange
  ): CollaborationMetrics {
    let crossDeveloperInteractions = 0;
    let codeReviewCount = 0;
    let pairProgrammingIndicators = 0;

    // Count reviews (cross-developer interactions)
    for (const activities of developerActivities.values()) {
      const reviews = activities.filter((a) => a.type === 'review');
      codeReviewCount += reviews.length;
      crossDeveloperInteractions += reviews.length;
    }

    // Heuristic for pair programming: commits with multiple authors or small time gaps
    const allActivities = Array.from(developerActivities.values()).flat();
    const commitsByRepo = new Map<string, Activity[]>();

    for (const activity of allActivities) {
      if (activity.type === 'commit') {
        if (!commitsByRepo.has(activity.repositoryId)) {
          commitsByRepo.set(activity.repositoryId, []);
        }
        commitsByRepo.get(activity.repositoryId)!.push(activity);
      }
    }

    // Look for commits in same repo within short time window
    for (const commits of commitsByRepo.values()) {
      const sorted = commits.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      for (let i = 1; i < sorted.length; i++) {
        const timeDiff = sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // Commits within 1 hour by different developers suggest pair programming
        if (hoursDiff < 1 && sorted[i].developerId !== sorted[i - 1].developerId) {
          pairProgrammingIndicators++;
        }
      }
    }

    const collaborationScore = Math.min(
      100,
      (crossDeveloperInteractions * 2 + pairProgrammingIndicators * 5) / Math.max(developerActivities.size, 1)
    );

    return {
      teamId,
      timeRange,
      crossDeveloperInteractions,
      codeReviewCount,
      pairProgrammingIndicators,
      collaborationScore,
    };
  }

  /**
   * Update metric weights configuration
   */
  updateMetricWeights(weights: MetricWeights): void {
    // Validate weights sum to 1.0
    const sum =
      weights.commitFrequency +
      weights.prCompletionRate +
      weights.issueResolutionCount +
      weights.codeReviewParticipation;

    if (Math.abs(sum - 1.0) > 0.01) {
      throw new Error('Metric weights must sum to 1.0');
    }

    this.metricWeights = { ...weights };
  }

  /**
   * Store metric snapshot for historical analysis
   */
  private storeSnapshot(snapshot: MetricSnapshot): void {
    this.snapshots.push(snapshot);

    // Keep only last 1000 snapshots per developer/team
    const snapshotsForEntity = this.snapshots.filter(
      (s) => s.developerId === snapshot.developerId && s.metricType === snapshot.metricType
    );

    if (snapshotsForEntity.length > 1000) {
      // Remove oldest snapshots
      const toRemove = snapshotsForEntity
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(0, snapshotsForEntity.length - 1000);

      this.snapshots = this.snapshots.filter((s) => !toRemove.includes(s));
    }
  }

  /**
   * Get historical snapshots for a developer
   */
  getHistoricalSnapshots(developerId: string, metricType: string, limit: number = 100): MetricSnapshot[] {
    return this.snapshots
      .filter((s) => s.developerId === developerId && s.metricType === metricType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}
