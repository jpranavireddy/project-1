export type ActivityType = 'commit' | 'pull_request' | 'issue' | 'review';

export interface Activity {
  id: string;
  type: ActivityType;
  developerId: string;
  repositoryId: string;
  timestamp: Date;
  metadata: {
    commitHash?: string;
    prNumber?: number;
    issueNumber?: number;
    linesAdded?: number;
    linesDeleted?: number;
    filesChanged?: number;
    reviewComments?: string[];
  };
}
