export interface TimeRange {
  start: Date;
  end: Date;
}

export interface ProductivityScore {
  developerId: string;
  timeRange: TimeRange;
  overallScore: number;
  components: {
    commitFrequency: number;
    prCompletionRate: number;
    issueResolutionCount: number;
    codeReviewParticipation: number;
  };
  trend: 'increasing' | 'stable' | 'decreasing';
  calculatedAt: Date;
}

export interface TeamHealthScore {
  teamId: string;
  timeRange: TimeRange;
  overallScore: number;
  components: {
    collaborationQuality: number;
    workloadBalance: number;
    communicationHealth: number;
    knowledgeSharing: number;
  };
  alerts: Alert[];
  calculatedAt: Date;
}

export interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  createdAt: Date;
}
