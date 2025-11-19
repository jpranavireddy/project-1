import * as fc from 'fast-check';
import { GitHubClient } from '../github-client';

// Feature: dev-performance-tracker, Property 2: Invalid authentication is rejected with clear errors
// Validates: Requirements 1.3

describe('Property 2: Invalid authentication is rejected with clear errors', () => {
  it('should reject invalid or malformed tokens with descriptive error messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(''), // Empty token
          fc.constant('   '), // Whitespace only
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.startsWith('ghp_')), // Invalid format
          fc.constant('invalid_token_12345'), // Clearly invalid
          fc.constant('ghp_invalidtokenformat123456789'), // Wrong format but looks like token
        ),
        async (invalidToken) => {
          const client = new GitHubClient();
          
          // Property: Invalid tokens should fail authentication
          const authResult = await client.authenticate(invalidToken);
          expect(authResult.success).toBe(false);
          expect(authResult.message).toBeDefined();
          expect(authResult.message.length).toBeGreaterThan(0);
          expect(authResult.username).toBeUndefined();
          
          // Property: After failed authentication, operations should throw errors
          await expect(async () => {
            await client.fetchRepositoryInfo('octocat/Hello-World');
          }).rejects.toThrow('Not authenticated');
          
          await expect(async () => {
            await client.getContributors('octocat/Hello-World');
          }).rejects.toThrow('Not authenticated');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide clear error messages for different failure scenarios', async () => {
    const client = new GitHubClient();
    
    // Test empty token
    const emptyResult = await client.authenticate('');
    expect(emptyResult.success).toBe(false);
    expect(emptyResult.message).toContain('required');
    
    // Test whitespace token
    const whitespaceResult = await client.authenticate('   ');
    expect(whitespaceResult.success).toBe(false);
    expect(whitespaceResult.message).toContain('required');
  });
});
