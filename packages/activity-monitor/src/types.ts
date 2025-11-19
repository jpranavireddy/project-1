// Re-export types from github-integration for convenience
export interface Commit {
  sha: string;
  author: string;
  email: string;
  message: string;
  timestamp: Date;
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
  files: string[];
}

export interface PullRequest {
  number: number;
  title: string;
  author: string;
  state: 'open' | 'closed' | 'merged';
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  additions: number;
  deletions: number;
  changedFiles: number;
  reviewComments: string[];
}

export interface Issue {
  number: number;
  title: string;
  author: string;
  state: 'open' | 'closed';
  createdAt: Date;
  closedAt?: Date;
  labels: string[];
  comments: number;
}
