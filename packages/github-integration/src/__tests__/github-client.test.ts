import { GitHubClient } from '../github-client';

describe('GitHubClient Unit Tests', () => {
  describe('Authentication', () => {
    it('should reject empty token', async () => {
      const client = new GitHubClient();
      const result = await client.authenticate('');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('required');
      expect(result.username).toBeUndefined();
    });

    it('should reject whitespace-only token', async () => {
      const client = new GitHubClient();
      const result = await client.authenticate('   ');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('required');
    });

    it('should throw error when calling methods before authentication', async () => {
      const client = new GitHubClient();
      
      await expect(
        client.fetchRepositoryInfo('owner/repo')
      ).rejects.toThrow('Not authenticated');
      
      await expect(
        client.getContributors('owner/repo')
      ).rejects.toThrow('Not authenticated');
      
      await expect(
        client.fetchCommits('owner/repo', new Date())
      ).rejects.toThrow('Not authenticated');
      
      await expect(
        client.fetchPullRequests('owner/repo', new Date())
      ).rejects.toThrow('Not authenticated');
      
      await expect(
        client.fetchIssues('owner/repo', new Date())
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('Repository URL Parsing', () => {
    it('should handle various GitHub URL formats', async () => {
      const token = process.env.GITHUB_TEST_TOKEN;
      
      if (!token) {
        console.warn('Skipping test: GITHUB_TEST_TOKEN not set');
        return;
      }

      const client = new GitHubClient();
      await client.authenticate(token);
      
      // Test different URL formats
      const formats = [
        'octocat/Hello-World',
        'https://github.com/octocat/Hello-World',
        'github.com/octocat/Hello-World',
      ];
      
      for (const format of formats) {
        const repo = await client.fetchRepositoryInfo(format);
        expect(repo.name).toBe('Hello-World');
        expect(repo.owner).toBe('octocat');
      }
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle invalid repository URLs', async () => {
      const token = process.env.GITHUB_TEST_TOKEN;
      
      if (!token) {
        console.warn('Skipping test: GITHUB_TEST_TOKEN not set');
        return;
      }

      const client = new GitHubClient();
      await client.authenticate(token);
      
      await expect(
        client.fetchRepositoryInfo('invalid-url-format')
      ).rejects.toThrow('Invalid repository URL format');
    });

    it('should handle non-existent repositories', async () => {
      const token = process.env.GITHUB_TEST_TOKEN;
      
      if (!token) {
        console.warn('Skipping test: GITHUB_TEST_TOKEN not set');
        return;
      }

      const client = new GitHubClient();
      await client.authenticate(token);
      
      await expect(
        client.fetchRepositoryInfo('nonexistent-user-12345/nonexistent-repo-67890')
      ).rejects.toThrow();
    }, 15000);
  });

  describe('Rate Limiting', () => {
    it('should queue multiple requests', async () => {
      const token = process.env.GITHUB_TEST_TOKEN;
      
      if (!token) {
        console.warn('Skipping test: GITHUB_TEST_TOKEN not set');
        return;
      }

      const client = new GitHubClient();
      await client.authenticate(token);
      
      // Make multiple concurrent requests
      const promises = [
        client.fetchRepositoryInfo('octocat/Hello-World'),
        client.fetchRepositoryInfo('octocat/Hello-World'),
        client.fetchRepositoryInfo('octocat/Hello-World'),
      ];
      
      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(repo => {
        expect(repo.name).toBe('Hello-World');
        expect(repo.owner).toBe('octocat');
      });
    }, 30000);

    it('should retrieve rate limit information', async () => {
      const token = process.env.GITHUB_TEST_TOKEN;
      
      if (!token) {
        console.warn('Skipping test: GITHUB_TEST_TOKEN not set');
        return;
      }

      const client = new GitHubClient();
      await client.authenticate(token);
      
      const rateLimitInfo = await client.getRateLimitInfo();
      
      expect(rateLimitInfo.limit).toBeGreaterThan(0);
      expect(rateLimitInfo.remaining).toBeGreaterThanOrEqual(0);
      expect(rateLimitInfo.reset).toBeInstanceOf(Date);
    }, 15000);
  });

  describe('Data Collection', () => {
    it('should fetch repository information with all required fields', async () => {
      const token = process.env.GITHUB_TEST_TOKEN;
      
      if (!token) {
        console.warn('Skipping test: GITHUB_TEST_TOKEN not set');
        return;
      }

      const client = new GitHubClient();
      await client.authenticate(token);
      
      const repo = await client.fetchRepositoryInfo('octocat/Hello-World');
      
      expect(repo.id).toBeDefined();
      expect(repo.name).toBe('Hello-World');
      expect(repo.owner).toBe('octocat');
      expect(repo.url).toContain('github.com');
      expect(repo.description).toBeDefined();
      expect(repo.primaryLanguage).toBeDefined();
      expect(typeof repo.isPrivate).toBe('boolean');
      expect(repo.createdAt).toBeInstanceOf(Date);
      expect(repo.lastSyncedAt).toBeInstanceOf(Date);
    }, 15000);

    it('should fetch contributors with required fields', async () => {
      const token = process.env.GITHUB_TEST_TOKEN;
      
      if (!token) {
        console.warn('Skipping test: GITHUB_TEST_TOKEN not set');
        return;
      }

      const client = new GitHubClient();
      await client.authenticate(token);
      
      const contributors = await client.getContributors('octocat/Hello-World');
      
      expect(Array.isArray(contributors)).toBe(true);
      expect(contributors.length).toBeGreaterThan(0);
      
      contributors.forEach(contributor => {
        expect(contributor.id).toBeDefined();
        expect(contributor.githubUsername).toBeDefined();
        expect(contributor.email).toBeDefined();
        expect(contributor.name).toBeDefined();
        expect(contributor.role).toBe('developer');
        expect(contributor.profileData).toBeDefined();
        expect(contributor.profileData.avatar).toBeDefined();
      });
    }, 30000);

    it('should fetch commits with metadata', async () => {
      const token = process.env.GITHUB_TEST_TOKEN;
      
      if (!token) {
        console.warn('Skipping test: GITHUB_TEST_TOKEN not set');
        return;
      }

      const client = new GitHubClient();
      await client.authenticate(token);
      
      const since = new Date('2020-01-01');
      const commits = await client.fetchCommits('octocat/Hello-World', since);
      
      expect(Array.isArray(commits)).toBe(true);
      
      if (commits.length > 0) {
        const commit = commits[0];
        expect(commit.sha).toBeDefined();
        expect(commit.author).toBeDefined();
        expect(commit.message).toBeDefined();
        expect(commit.timestamp).toBeInstanceOf(Date);
        expect(commit.stats).toBeDefined();
        expect(typeof commit.stats.additions).toBe('number');
        expect(typeof commit.stats.deletions).toBe('number');
        expect(Array.isArray(commit.files)).toBe(true);
      }
    }, 60000);

    it('should fetch pull requests with metadata', async () => {
      const token = process.env.GITHUB_TEST_TOKEN;
      
      if (!token) {
        console.warn('Skipping test: GITHUB_TEST_TOKEN not set');
        return;
      }

      const client = new GitHubClient();
      await client.authenticate(token);
      
      const since = new Date('2020-01-01');
      const prs = await client.fetchPullRequests('octocat/Hello-World', since);
      
      expect(Array.isArray(prs)).toBe(true);
      
      if (prs.length > 0) {
        const pr = prs[0];
        expect(typeof pr.number).toBe('number');
        expect(pr.title).toBeDefined();
        expect(pr.author).toBeDefined();
        expect(['open', 'closed', 'merged']).toContain(pr.state);
        expect(pr.createdAt).toBeInstanceOf(Date);
        expect(pr.updatedAt).toBeInstanceOf(Date);
        expect(typeof pr.additions).toBe('number');
        expect(typeof pr.deletions).toBe('number');
        expect(Array.isArray(pr.reviewComments)).toBe(true);
      }
    }, 60000);

    it('should fetch issues with metadata', async () => {
      const token = process.env.GITHUB_TEST_TOKEN;
      
      if (!token) {
        console.warn('Skipping test: GITHUB_TEST_TOKEN not set');
        return;
      }

      const client = new GitHubClient();
      await client.authenticate(token);
      
      const since = new Date('2020-01-01');
      const issues = await client.fetchIssues('octocat/Hello-World', since);
      
      expect(Array.isArray(issues)).toBe(true);
      
      if (issues.length > 0) {
        const issue = issues[0];
        expect(typeof issue.number).toBe('number');
        expect(issue.title).toBeDefined();
        expect(issue.author).toBeDefined();
        expect(['open', 'closed']).toContain(issue.state);
        expect(issue.createdAt).toBeInstanceOf(Date);
        expect(Array.isArray(issue.labels)).toBe(true);
        expect(typeof issue.comments).toBe('number');
      }
    }, 60000);
  });
});
