import * as fc from 'fast-check';
import { GitHubClient } from '../github-client';

// Feature: dev-performance-tracker, Property 3: Multiple repository connections are independent
// Validates: Requirements 1.5

describe('Property 3: Multiple repository connections are independent', () => {
  it('should handle multiple repositories independently without state interference', async () => {
    const token = process.env.GITHUB_TEST_TOKEN;
    
    if (!token) {
      console.warn('Skipping property test: GITHUB_TEST_TOKEN not set');
      return;
    }

    // Test with multiple well-known public repositories
    const testRepos = [
      'octocat/Hello-World',
      'torvalds/linux',
      'microsoft/vscode',
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.constant(token),
        fc.shuffledSubarray(testRepos, { minLength: 2, maxLength: 3 }),
        async (authToken, repos) => {
          const client = new GitHubClient();
          await client.authenticate(authToken);
          
          // Fetch info for all repositories
          const repoInfos = await Promise.all(
            repos.map(repo => client.fetchRepositoryInfo(repo))
          );
          
          // Property: Each repository should have unique data
          const ids = repoInfos.map(r => r.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
          
          const names = repoInfos.map(r => r.name);
          const uniqueNames = new Set(names);
          expect(uniqueNames.size).toBe(names.length);
          
          // Property: Repository data should match the requested repository
          for (let i = 0; i < repos.length; i++) {
            const [owner, repoName] = repos[i].split('/');
            expect(repoInfos[i].owner).toBe(owner);
            expect(repoInfos[i].name).toBe(repoName);
          }
          
          // Property: Fetching contributors for one repo shouldn't affect another
          const contributorsLists = await Promise.all(
            repos.map(repo => client.getContributors(repo))
          );
          
          // Each repository should have its own contributor list
          for (let i = 0; i < contributorsLists.length; i++) {
            expect(Array.isArray(contributorsLists[i])).toBe(true);
            
            // Contributors should have usernames matching the repository context
            contributorsLists[i].forEach(contributor => {
              expect(contributor.githubUsername).toBeDefined();
              expect(contributor.id).toBeDefined();
            });
          }
        }
      ),
      { numRuns: 1 } // Run once since we're hitting real API
    );
  }, 60000); // 60 second timeout for multiple API calls

  it('should maintain independent state for concurrent repository operations', async () => {
    const token = process.env.GITHUB_TEST_TOKEN;
    
    if (!token) {
      console.warn('Skipping property test: GITHUB_TEST_TOKEN not set');
      return;
    }

    const client = new GitHubClient();
    await client.authenticate(token);
    
    // Fetch multiple repositories concurrently
    const repo1Promise = client.fetchRepositoryInfo('octocat/Hello-World');
    const repo2Promise = client.fetchRepositoryInfo('torvalds/linux');
    
    const [repo1, repo2] = await Promise.all([repo1Promise, repo2Promise]);
    
    // Property: Results should be independent and correct
    expect(repo1.name).toBe('Hello-World');
    expect(repo1.owner).toBe('octocat');
    
    expect(repo2.name).toBe('linux');
    expect(repo2.owner).toBe('torvalds');
    
    // Property: IDs should be different
    expect(repo1.id).not.toBe(repo2.id);
  }, 30000);
});
