/**
 * Feature: dev-performance-tracker, Property 5: Activities are correctly attributed to developers
 * Validates: Requirements 2.4
 * 
 * For any captured activity, the associated developer identity should match the actual author
 * of that activity in the GitHub repository.
 */

import * as fc from 'fast-check';
import { ActivityMonitorService } from '../activity-monitor';
import { Commit, PullRequest, Issue } from '../types';
import { Activity } from '@dev-tracker/shared-types';
import { connectDB, disconnectDB } from '@dev-tracker/shared-types/dist/db';
import { ActivityModel, DeveloperModel } from '@dev-tracker/shared-types/dist/db';

describe('Property 5: Activity attribution correctness', () => {
  let activityMonitor: ActivityMonitorService;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    activityMonitor = new ActivityMonitorService();
    await ActivityModel.deleteMany({});
    await DeveloperModel.deleteMany({});
  });

  afterEach(async () => {
    await ActivityModel.deleteMany({});
    await DeveloperModel.deleteMany({});
  });

  // Generators
  const githubUsernameArbitrary = fc.string({ minLength: 1, maxLength: 39 })
    .filter(s => s.trim().length > 0 && /^[a-zA-Z0-9-]+$/.test(s));

  const emailArbitrary = fc.emailAddress();

  const commitArbitrary = (author: string, email: string) => fc.record({
    sha: fc.hexaString({ minLength: 40, maxLength: 40 }),
    author: fc.constant(author),
    email: fc.constant(email),
    message: fc.string({ minLength: 1, maxLength: 200 }),
    timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
    stats: fc.record({
      additions: fc.nat({ max: 1000 }),
      deletions: fc.nat({ max: 1000 }),
      total: fc.nat({ max: 2000 }),
    }),
    files: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 20 }),
  });

  const pullRequestArbitrary = (author: string) => fc.record({
    number: fc.integer({ min: 1, max: 100000 }),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    author: fc.constant(author),
    state: fc.constantFrom('open' as const, 'closed' as const, 'merged' as const),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
    updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
    mergedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }), { nil: undefined }),
    additions: fc.nat({ max: 5000 }),
    deletions: fc.nat({ max: 5000 }),
    changedFiles: fc.nat({ max: 100 }),
    reviewComments: fc.array(fc.string({ maxLength: 500 }), { maxLength: 20 }),
  });

  const issueArbitrary = (author: string) => fc.record({
    number: fc.integer({ min: 1, max: 100000 }),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    author: fc.constant(author),
    state: fc.constantFrom('open' as const, 'closed' as const),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
    closedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }), { nil: undefined }),
    labels: fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
    comments: fc.nat({ max: 100 }),
  });

  const repositoryIdArbitrary = fc.hexaString({ minLength: 24, maxLength: 24 });

  test('Commit activities are attributed to the correct developer by username', async () => {
    await fc.assert(
      fc.asyncProperty(
        githubUsernameArbitrary,
        emailArbitrary,
        repositoryIdArbitrary,
        async (username, email, repositoryId) => {
          // Check if developer already exists, otherwise create
          let developer = await DeveloperModel.findOne({ githubUsername: username });
          if (!developer) {
            developer = await DeveloperModel.create({
              githubUsername: username,
              email: email,
              name: username,
              role: 'developer',
              teamId: 'test-team',
              joinDate: new Date(),
              profileData: {
                avatar: 'https://github.com/identicons/' + username + '.png',
                bio: 'Test developer profile',
                location: 'Test Location',
              },
            });
          }

          // Generate a commit with this author
          const commit = await fc.sample(commitArbitrary(username, email), 1)[0];

          // Process the commit
          const activity = await activityMonitor.processCommit(commit, repositoryId);

          // Verify the activity is attributed to the correct developer
          expect(activity.developerId).toBe(developer._id.toString());
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Pull request activities are attributed to the correct developer', async () => {
    await fc.assert(
      fc.asyncProperty(
        githubUsernameArbitrary,
        repositoryIdArbitrary,
        async (username, repositoryId) => {
          // Check if developer already exists, otherwise create
          let developer = await DeveloperModel.findOne({ githubUsername: username });
          if (!developer) {
            developer = await DeveloperModel.create({
              githubUsername: username,
              email: `${username}@test.com`,
              name: username,
              role: 'developer',
              teamId: 'test-team',
              joinDate: new Date(),
              profileData: {
                avatar: 'https://github.com/identicons/' + username + '.png',
                bio: 'Test developer profile',
                location: 'Test Location',
              },
            });
          }

          // Generate a PR with this author
          const pr = await fc.sample(pullRequestArbitrary(username), 1)[0];

          // Process the PR
          const activity = await activityMonitor.processPullRequest(pr, repositoryId);

          // Verify the activity is attributed to the correct developer
          expect(activity.developerId).toBe(developer._id.toString());
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Issue activities are attributed to the correct developer', async () => {
    await fc.assert(
      fc.asyncProperty(
        githubUsernameArbitrary,
        repositoryIdArbitrary,
        async (username, repositoryId) => {
          // Check if developer already exists, otherwise create
          let developer = await DeveloperModel.findOne({ githubUsername: username });
          if (!developer) {
            developer = await DeveloperModel.create({
              githubUsername: username,
              email: `${username}@test.com`,
              name: username,
              role: 'developer',
              teamId: 'test-team',
              joinDate: new Date(),
              profileData: {
                avatar: 'https://github.com/identicons/' + username + '.png',
                bio: 'Test developer profile',
                location: 'Test Location',
              },
            });
          }

          // Generate an issue with this author
          const issue = await fc.sample(issueArbitrary(username), 1)[0];

          // Process the issue
          const activity = await activityMonitor.processIssue(issue, repositoryId);

          // Verify the activity is attributed to the correct developer
          expect(activity.developerId).toBe(developer._id.toString());
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Multiple activities from the same author are attributed to the same developer', async () => {
    await fc.assert(
      fc.asyncProperty(
        githubUsernameArbitrary,
        emailArbitrary,
        repositoryIdArbitrary,
        async (username, email, repositoryId) => {
          // Generate multiple commits from the same author
          const commits = await fc.sample(commitArbitrary(username, email), 3);

          // Process commits sequentially to avoid race conditions
          const activities: Activity[] = [];
          for (const commit of commits) {
            const activity = await activityMonitor.processCommit(commit, repositoryId);
            activities.push(activity);
          }

          // Verify all activities are attributed to the same developer
          const developerIds = activities.map(a => a.developerId);
          const uniqueDeveloperIds = new Set(developerIds);
          expect(uniqueDeveloperIds.size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
