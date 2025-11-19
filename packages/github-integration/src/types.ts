import { Repository, Developer, Activity } from '@dev-tracker/shared-types';

export interface AuthResult {
  success: boolean;
  message: string;
  username?: string;
}

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

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

export interface GitHubIntegrationService {
  authenticate(token: string): Promise<AuthResult>;
  fetchRepositoryInfo(repoUrl: string): Promise<Repository>;
  getContributors(repoId: string): Promise<Developer[]>;
  fetchCommits(repoId: string, since: Date): Promise<Commit[]>;
  fetchPullRequests(repoId: string, since: Date): Promise<PullRequest[]>;
  fetchIssues(repoId: string, since: Date): Promise<Issue[]>;
  getRateLimitInfo(): Promise<RateLimitInfo>;
}
