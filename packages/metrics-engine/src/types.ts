import { Activity, TimeRange, ProductivityScore, TeamHealthScore } from '@dev-tracker/shared-types';

export interface MetricWeights {
  commitFrequency: number;
  prCompletionRate: number;
  issueResolutionCount: number;
  codeReviewParticipation: number;
}

export interface WorkloadDistribution {
  teamId: string;
  timeRange: TimeRange;
  developerWorkloads: DeveloperWorkload[];
  averageWorkload: number;
  standardDeviation: number;
  outliers: string[]; // Developer IDs with imbalanced workload
}

export interface DeveloperWorkload {
  developerId: string;
  activityCount: number;
  workloadScore: number;
  deviationFromAverage: number;
}

export interface CollaborationMetrics {
  teamId: string;
  timeRange: TimeRange;
  crossDeveloperInteractions: number;
  codeReviewCount: number;
  pairProgrammingIndicators: number;
  collaborationScore: number;
}

export interface CodeQualityScore {
  developerId: string;
  timeRange: TimeRange;
  overallScore: number;
  components: {
    complexity: number;
    documentation: number;
    standards: number;
  };
  calculatedAt: Date;
}

export interface MetricSnapshot {
  id: string;
  developerId: string;
  teamId?: string;
  metricType: 'productivity' | 'quality' | 'team_health';
  score: number;
  timestamp: Date;
  metadata: any;
}
