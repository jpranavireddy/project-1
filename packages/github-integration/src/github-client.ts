import { Octokit } from '@octokit/rest';
import { Repository, Developer } from '@dev-tracker/shared-types';
import {
  AuthResult,
  Commit,
  PullRequest,
  Issue,
  RateLimitInfo,
  GitHubIntegrationService,
} from './types';
import { RateLimiter } from './rate-limiter';
import { RetryHandler } from './retry-handler';

export class GitHubClient implements GitHubIntegrationService {
  private octokit: Octokit | null = null;
  private rateLimiter: RateLimiter;
  private retryHandler: RetryHandler;
  private authenticated = false;

  constructor() {
    this.rateLimiter = new RateLimiter();
    this.retryHandler = new RetryHandler();
  }

  async authenticate(token: string): Promise<AuthResult> {
    if (!token || token.trim() === '') {
      return {
        success: false,
        message: 'GitHub token is required',
      };
    }

    try {
      this.octokit = new Octokit({ auth: token });
      
      // Verify authentication by fetching user info
      const { data } = await this.retryHandler.executeWithRetry(
        () => this.octokit!.users.getAuthenticated(),
        this.isRetryableError
      );

      this.authenticated = true;
      return {
        success: true,
        message: 'Authentication successful',
        username: data.login,
      };
    } catch (error: any) {
      this.authenticated = false;
      this.octokit = null;
      
      if (error.status === 401) {
        return {
          success: false,
          message: 'Invalid GitHub token: Authentication failed',
        };
      }
      
      return {
        success: false,
        message: `Authentication error: ${error.message}`,
      };
    }
  }

  async fetchRepositoryInfo(repoUrl: string): Promise<Repository> {
    this.ensureAuthenticated();
    
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    
    return this.rateLimiter.enqueue(async () => {
      return this.retryHandler.executeWithRetry(async () => {
        const { data } = await this.octokit!.repos.get({ owner, repo });
        
        return {
          id: data.id.toString(),
          name: data.name,
          url: data.html_url,
          owner: data.owner.login,
          description: data.description || '',
          primaryLanguage: data.language || 'Unknown',
          isPrivate: data.private,
          createdAt: new Date(data.created_at),
          lastSyncedAt: new Date(),
        };
      }, this.isRetryableError);
    });
  }

  async getContributors(repoId: string): Promise<Developer[]> {
    this.ensureAuthenticated();
    
    const { owner, repo } = this.parseRepoId(repoId);
    
    return this.rateLimiter.enqueue(async () => {
      return this.retryHandler.executeWithRetry(async () => {
        const { data } = await this.octokit!.repos.listContributors({
          owner,
          repo,
          per_page: 100,
        });
        
        const developers: Developer[] = [];
        
        for (const contributor of data) {
          if (!contributor.login) continue;
          
          try {
            const { data: userData } = await this.octokit!.users.getByUsername({
              username: contributor.login,
            });
            
            developers.push({
              id: userData.id.toString(),
              githubUsername: userData.login,
              email: userData.email || `${userData.login}@github.com`,
              name: userData.name || userData.login,
              role: 'developer',
              teamId: 'default',
              joinDate: new Date(userData.created_at),
              profileData: {
                avatar: userData.avatar_url,
                bio: userData.bio || '',
                location: userData.location || '',
              },
            });
          } catch (error) {
            // If we can't fetch user details, create a minimal developer object
            developers.push({
              id: contributor.id!.toString(),
              githubUsername: contributor.login,
              email: `${contributor.login}@github.com`,
              name: contributor.login,
              role: 'developer',
              teamId: 'default',
              joinDate: new Date(),
              profileData: {
                avatar: contributor.avatar_url || '',
                bio: '',
                location: '',
              },
            });
          }
        }
        
        return developers;
      }, this.isRetryableError);
    });
  }

  async fetchCommits(repoId: string, since: Date): Promise<Commit[]> {
    this.ensureAuthenticated();
    
    const { owner, repo } = this.parseRepoId(repoId);
    
    return this.rateLimiter.enqueue(async () => {
      return this.retryHandler.executeWithRetry(async () => {
        const commits: Commit[] = [];
        let page = 1;
        const perPage = 100;
        
        while (true) {
          const { data } = await this.octokit!.repos.listCommits({
            owner,
            repo,
            since: since.toISOString(),
            per_page: perPage,
            page,
          });
          
          if (data.length === 0) break;
          
          for (const commitData of data) {
            if (!commitData.commit.author) continue;
            
            // Fetch detailed commit info to get stats
            const { data: detailedCommit } = await this.octokit!.repos.getCommit({
              owner,
              repo,
              ref: commitData.sha,
            });
            
            commits.push({
              sha: commitData.sha,
              author: commitData.commit.author.name || 'Unknown',
              email: commitData.commit.author.email || '',
              message: commitData.commit.message,
              timestamp: new Date(commitData.commit.author.date),
              stats: {
                additions: detailedCommit.stats?.additions || 0,
                deletions: detailedCommit.stats?.deletions || 0,
                total: detailedCommit.stats?.total || 0,
              },
              files: detailedCommit.files?.map(f => f.filename) || [],
            });
          }
          
          if (data.length < perPage) break;
          page++;
        }
        
        return commits;
      }, this.isRetryableError);
    });
  }

  async fetchPullRequests(repoId: string, since: Date): Promise<PullRequest[]> {
    this.ensureAuthenticated();
    
    const { owner, repo } = this.parseRepoId(repoId);
    
    return this.rateLimiter.enqueue(async () => {
      return this.retryHandler.executeWithRetry(async () => {
        const pullRequests: PullRequest[] = [];
        let page = 1;
        const perPage = 100;
        
        while (true) {
          const { data } = await this.octokit!.pulls.list({
            owner,
            repo,
            state: 'all',
            sort: 'updated',
            direction: 'desc',
            per_page: perPage,
            page,
          });
          
          if (data.length === 0) break;
          
          for (const pr of data) {
            const updatedAt = new Date(pr.updated_at);
            if (updatedAt < since) continue;
            
            // Fetch review comments
            const { data: comments } = await this.octokit!.pulls.listReviewComments({
              owner,
              repo,
              pull_number: pr.number,
            });
            
            pullRequests.push({
              number: pr.number,
              title: pr.title,
              author: pr.user?.login || 'Unknown',
              state: pr.merged_at ? 'merged' : pr.state as 'open' | 'closed',
              createdAt: new Date(pr.created_at),
              updatedAt: new Date(pr.updated_at),
              mergedAt: pr.merged_at ? new Date(pr.merged_at) : undefined,
              additions: pr.additions || 0,
              deletions: pr.deletions || 0,
              changedFiles: pr.changed_files || 0,
              reviewComments: comments.map(c => c.body),
            });
          }
          
          if (data.length < perPage) break;
          page++;
        }
        
        return pullRequests;
      }, this.isRetryableError);
    });
  }

  async fetchIssues(repoId: string, since: Date): Promise<Issue[]> {
    this.ensureAuthenticated();
    
    const { owner, repo } = this.parseRepoId(repoId);
    
    return this.rateLimiter.enqueue(async () => {
      return this.retryHandler.executeWithRetry(async () => {
        const issues: Issue[] = [];
        let page = 1;
        const perPage = 100;
        
        while (true) {
          const { data } = await this.octokit!.issues.listForRepo({
            owner,
            repo,
            state: 'all',
            sort: 'updated',
            direction: 'desc',
            since: since.toISOString(),
            per_page: perPage,
            page,
          });
          
          if (data.length === 0) break;
          
          for (const issue of data) {
            // Skip pull requests (they appear in issues API)
            if (issue.pull_request) continue;
            
            issues.push({
              number: issue.number,
              title: issue.title,
              author: issue.user?.login || 'Unknown',
              state: issue.state as 'open' | 'closed',
              createdAt: new Date(issue.created_at),
              closedAt: issue.closed_at ? new Date(issue.closed_at) : undefined,
              labels: issue.labels.map(l => typeof l === 'string' ? l : l.name || ''),
              comments: issue.comments || 0,
            });
          }
          
          if (data.length < perPage) break;
          page++;
        }
        
        return issues;
      }, this.isRetryableError);
    });
  }

  async getRateLimitInfo(): Promise<RateLimitInfo> {
    this.ensureAuthenticated();
    
    const { data } = await this.octokit!.rateLimit.get();
    
    return {
      limit: data.rate.limit,
      remaining: data.rate.remaining,
      reset: new Date(data.rate.reset * 1000),
    };
  }

  private ensureAuthenticated(): void {
    if (!this.authenticated || !this.octokit) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }
  }

  private parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
    // Handle various GitHub URL formats
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)/,
      /^([^\/]+)\/([^\/]+)$/,
    ];
    
    for (const pattern of patterns) {
      const match = repoUrl.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, ''),
        };
      }
    }
    
    throw new Error(`Invalid repository URL format: ${repoUrl}`);
  }

  private parseRepoId(repoId: string): { owner: string; repo: string } {
    // Assume repoId is in format "owner/repo"
    const parts = repoId.split('/');
    if (parts.length !== 2) {
      throw new Error(`Invalid repository ID format: ${repoId}. Expected "owner/repo"`);
    }
    
    return {
      owner: parts[0],
      repo: parts[1],
    };
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors and rate limiting
    if (error.status === 403 && error.message?.includes('rate limit')) {
      return true;
    }
    
    // Retry on server errors (5xx)
    if (error.status >= 500) {
      return true;
    }
    
    // Retry on network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    return false;
  }
}
