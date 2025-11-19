/**
 * Feature: dev-performance-tracker, Property 4: Activity metadata capture is complete
 * Validates: Requirements 2.1, 2.2, 2.3
 * 
 * For any developer activity (commit, pull request, or issue), all required metadata fields
 * (timestamp, author, type-specific details) should be captured and stored.
 */

import * as fc from 'fast-check';
import { ActivityMonitorService } from '../activity-monitor';
import { Commit, PullRequest, Issue } from '../types';
import { connectDB, disconnectDB } from '@dev-tracker/shared-types/dist/db';
import { ActivityModel, DeveloperModel } from '@dev-tracker/shared-types/dist/db';

describe('Property 4: Activity metadata completeness', () => {
  let activityMonitor: ActivityMonitorService;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    activityMonitor = new ActivityMonitorService();
    // Clean up database
    await ActivityModel.deleteMany({});
    await DeveloperModel.deleteMany({});
  });

  afterEach(async () => {
    await ActivityModel.deleteMany({});
    await DeveloperModel.deleteMany({});
  });

  // Generators for valid activity data
  const commitArbitrary = fc.record({
    sha: fc.hexaString({ minLength: 40, maxLength: 40 }),
    author: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    email: fc.emailAddress(),
    message: fc.string({ minLength: 1, maxLength: 200 }),
    timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
    stats: fc.record({
      additions: fc.nat({ max: 1000 }),
      deletions: fc.nat({ max: 1000 }),
      total: fc.nat({ max: 2000 }),
    }),
    files: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 20 }),
  });

  const pullRequestArbitrary = fc.record({
    number: fc.integer({ min: 1, max: 100000 }),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    author: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    state: fc.constantFrom('open' as const, 'closed' as const, 'merged' as const),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
    updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
    mergedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }), { nil: undefined }),
    additions: fc.nat({ max: 5000 }),
    deletions: fc.nat({ max: 5000 }),
    changedFiles: fc.nat({ max: 100 }),
    reviewComments: fc.array(fc.string({ maxLength: 500 }), { maxLength: 20 }),
  });

  const issueArbitrary = fc.record({
    number: fc.integer({ min: 1, max: 100000 }),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    author: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    state: fc.constantFrom('open' as const, 'closed' as const),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
    closedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }), { nil: undefined }),
    labels: fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
    comments: fc.nat({ max: 100 }),
  });

  const repositoryIdArbitrary = fc.hexaString({ minLength: 24, maxLength: 24 });

  test('Commit activities capture all required metadata', async () => {
    await fc.assert(
      fc.asyncProperty(commitArbitrary, repositoryIdArbitrary, async (commit, repositoryId) => {
        // Process the commit
        const activity = await activityMonitor.processCommit(commit, repositoryId);

        // Verify all required fields are present
        expect(activity.id).toBeDefined();
        expect(activity.type).toBe('commit');
        expect(activity.developerId).toBeDefined();
        expect(activity.repositoryId).toBe(repositoryId);
        expect(activity.timestamp).toEqual(commit.timestamp);

        // Verify commit-specific metadata
        expect(activity.metadata.commitHash).toBe(commit.sha);
        expect(activity.metadata.linesAdded).toBe(commit.stats.additions);
        expect(activity.metadata.linesDeleted).toBe(commit.stats.deletions);
        expect(activity.metadata.filesChanged).toBe(commit.files.length);
      }),
      { numRuns: 100 }
    );
  });

  test('Pull request activities capture all required metadata', async () => {
    await fc.assert(
      fc.asyncProperty(pullRequestArbitrary, repositoryIdArbitrary, async (pr, repositoryId) => {
        // Process the pull request
        const activity = await activityMonitor.processPullRequest(pr, repositoryId);

        // Verify all required fields are present
        expect(activity.id).toBeDefined();
        expect(activity.type).toBe('pull_request');
        expect(activity.developerId).toBeDefined();
        expect(activity.repositoryId).toBe(repositoryId);
        expect(activity.timestamp).toEqual(pr.createdAt);

        // Verify PR-specific metadata
        expect(activity.metadata.prNumber).toBe(pr.number);
        expect(activity.metadata.linesAdded).toBe(pr.additions);
        expect(activity.metadata.linesDeleted).toBe(pr.deletions);
        expect(activity.metadata.filesChanged).toBe(pr.changedFiles);
        expect(activity.metadata.reviewComments).toEqual(pr.reviewComments);
      }),
      { numRuns: 100 }
    );
  });

  test('Issue activities capture all required metadata', async () => {
    await fc.assert(
      fc.asyncProperty(issueArbitrary, repositoryIdArbitrary, async (issue, repositoryId) => {
        // Process the issue
        const activity = await activityMonitor.processIssue(issue, repositoryId);

        // Verify all required fields are present
        expect(activity.id).toBeDefined();
        expect(activity.type).toBe('issue');
        expect(activity.developerId).toBeDefined();
        expect(activity.repositoryId).toBe(repositoryId);
        expect(activity.timestamp).toEqual(issue.createdAt);

        // Verify issue-specific metadata
        expect(activity.metadata.issueNumber).toBe(issue.number);
      }),
      { numRuns: 100 }
    );
  });
});
