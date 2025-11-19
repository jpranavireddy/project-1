import * as fc from 'fast-check';
import { GitHubClient } from '../github-client';

// Feature: dev-performance-tracker, Property 1: GitHub authentication establishes valid connections
// Validates: Requirements 1.1, 1.2, 1.4

describe('Property 1: GitHub authentication establishes valid connections', () => {
  it('should successfully authenticate with valid tokens and retrieve repository metadata', async () => {
    // This test requires a real GitHub token to work properly
    // We'll use environment variable for testing
    const token = process.env.GITHUB_TEST_TOKEN;
    const testRepo = process.env.GITHUB_TEST_REPO || 'octocat/Hello-World';
    
    if (!token) {
      console.warn('Skipping property test: GITHUB_TEST_TOKEN not set');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constant(token),
        fc.constant(testRepo),
        async (authToken, repoUrl) => {
          const client = new GitHubClient();
          
          // Property: Valid token should authenticate successfully
          const authResult = await client.authenticate(authToken);
          expect(authResult.success).toBe(true);
          expect(authResult.username).toBeDefined();
          expect(authResult.message).toBe('Authentication successful');
          
          // Property: After authentication, should be able to fetch repository info
          const repoInfo = await client.fetchRepositoryInfo(repoUrl);
          expect(repoInfo).toBeDefined();
          expect(repoInfo.id).toBeDefined();
          expect(repoInfo.name).toBeDefined();
          expect(repoInfo.owner).toBeDefined();
          expect(repoInfo.url).toBeDefined();
          
          // Property: After authentication, should be able to get contributors
          const contributors = await client.getContributors(repoUrl);
          expect(Array.isArray(contributors)).toBe(true);
          
          // Each contributor should have required fields
          contributors.forEach(contributor => {
            expect(contributor.id).toBeDefined();
            expect(contributor.githubUsername).toBeDefined();
            expect(contributor.email).toBeDefined();
            expect(contributor.name).toBeDefined();
          });
        }
      ),
      { numRuns: 1 } // Run once since we're hitting real API
    );
  }, 30000); // 30 second timeout for API calls
});
