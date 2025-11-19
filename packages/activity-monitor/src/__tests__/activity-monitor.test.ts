/**
 * Unit tests for Activity Monitor service
 * Tests activity processing, validation, and developer identity resolution
 */

import { ActivityMonitorService } from '../activity-monitor';
import { Commit, PullRequest, Issue } from '../types';
import { connectDB, disconnectDB } from '@dev-tracker/shared-types/dist/db';
import { ActivityModel, DeveloperModel } from '@dev-tracker/shared-types/dist/db';

describe('ActivityMonitorService', () => {
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

  describe('processCommit', () => {
    it('should process a valid commit and store it as an activity', async () => {
      const commit: Commit = {
        sha: 'abc123def456',
        author: 'testuser',
        email: 'test@example.com',
        message: 'Test commit',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        stats: {
          additions: 10,
          deletions: 5,
          total: 15,
        },
        files: ['file1.ts', 'file2.ts'],
      };

      const activity = await activityMonitor.processCommit(commit, 'repo123');

      expect(activity.type).toBe('commit');
      expect(activity.repositoryId).toBe('repo123');
      expect(activity.timestamp).toEqual(commit.timestamp);
      expect(activity.metadata.commitHash).toBe(commit.sha);
      expect(activity.metadata.linesAdded).toBe(10);
      expect(activity.metadata.linesDeleted).toBe(5);
      expect(activity.metadata.filesChanged).toBe(2);
    });

    it('should reject commit with missing sha', async () => {
      const invalidCommit = {
        author: 'testuser',
        email: 'test@example.com',
        message: 'Test',
        timestamp: new Date(),
        stats: { additions: 0, deletions: 0, total: 0 },
        files: [],
      } as any;

      await expect(
        activityMonitor.processCommit(invalidCommit, 'repo123')
      ).rejects.toThrow('Invalid commit: missing or invalid sha');
    });

    it('should reject commit with invalid timestamp', async () => {
      const invalidCommit = {
        sha: 'abc123',
        author: 'testuser',
        email: 'test@example.com',
        message: 'Test',
        timestamp: 'not-a-date',
        stats: { additions: 0, deletions: 0, total: 0 },
        files: [],
      } as any;

      await expect(
        activityMonitor.processCommit(invalidCommit, 'repo123')
      ).rejects.toThrow('Invalid commit: missing or invalid timestamp');
    });
  });

  describe('processPullRequest', () => {
    it('should process a valid pull request and store it as an activity', async () => {
      const pr: PullRequest = {
        number: 42,
        title: 'Test PR',
        author: 'testuser',
        state: 'open',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T11:00:00Z'),
        additions: 100,
        deletions: 50,
        changedFiles: 5,
        reviewComments: ['LGTM', 'Needs changes'],
      };

      const activity = await activityMonitor.processPullRequest(pr, 'repo123');

      expect(activity.type).toBe('pull_request');
      expect(activity.repositoryId).toBe('repo123');
      expect(activity.timestamp).toEqual(pr.createdAt);
      expect(activity.metadata.prNumber).toBe(42);
      expect(activity.metadata.linesAdded).toBe(100);
      expect(activity.metadata.linesDeleted).toBe(50);
      expect(activity.metadata.filesChanged).toBe(5);
      expect(activity.metadata.reviewComments).toEqual(['LGTM', 'Needs changes']);
    });

    it('should reject pull request with missing number', async () => {
      const invalidPR = {
        title: 'Test',
        author: 'testuser',
        state: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        additions: 0,
        deletions: 0,
        changedFiles: 0,
        reviewComments: [],
      } as any;

      await expect(
        activityMonitor.processPullRequest(invalidPR, 'repo123')
      ).rejects.toThrow('Invalid pull request: missing or invalid number');
    });
  });

  describe('processIssue', () => {
    it('should process a valid issue and store it as an activity', async () => {
      const issue: Issue = {
        number: 123,
        title: 'Test Issue',
        author: 'testuser',
        state: 'open',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        labels: ['bug', 'high-priority'],
        comments: 5,
      };

      const activity = await activityMonitor.processIssue(issue, 'repo123');

      expect(activity.type).toBe('issue');
      expect(activity.repositoryId).toBe('repo123');
      expect(activity.timestamp).toEqual(issue.createdAt);
      expect(activity.metadata.issueNumber).toBe(123);
    });

    it('should reject issue with missing author', async () => {
      const invalidIssue = {
        number: 123,
        title: 'Test',
        state: 'open',
        createdAt: new Date(),
        labels: [],
        comments: 0,
      } as any;

      await expect(
        activityMonitor.processIssue(invalidIssue, 'repo123')
      ).rejects.toThrow('Invalid issue: missing or invalid author');
    });
  });

  describe('developer identity resolution', () => {
    it('should find existing developer by GitHub username', async () => {
      // Create a developer
      const developer = await DeveloperModel.create({
        githubUsername: 'existinguser',
        email: 'existing@example.com',
        name: 'Existing User',
        role: 'developer',
        teamId: 'team1',
        joinDate: new Date(),
        profileData: { 
          avatar: 'https://github.com/identicons/existinguser.png', 
          bio: 'Test user', 
          location: 'Test Location' 
        },
      });

      const commit: Commit = {
        sha: 'abc123',
        author: 'existinguser',
        email: 'different@example.com',
        message: 'Test',
        timestamp: new Date(),
        stats: { additions: 1, deletions: 0, total: 1 },
        files: ['test.ts'],
      };

      const activity = await activityMonitor.processCommit(commit, 'repo123');

      expect(activity.developerId).toBe(developer._id.toString());
    });

    it('should create new developer if not found', async () => {
      const commit: Commit = {
        sha: 'abc123',
        author: 'newuser',
        email: 'new@example.com',
        message: 'Test',
        timestamp: new Date(),
        stats: { additions: 1, deletions: 0, total: 1 },
        files: ['test.ts'],
      };

      const activity = await activityMonitor.processCommit(commit, 'repo123');

      expect(activity.developerId).toBeDefined();

      // Verify developer was created
      const developer = await DeveloperModel.findById(activity.developerId);
      expect(developer).toBeDefined();
      expect(developer?.githubUsername).toBe('newuser');
      expect(developer?.email).toBe('new@example.com');
    });
  });

  describe('activity retrieval', () => {
    it('should retrieve activities by developer within time range', async () => {
      // Create a developer
      const developer = await DeveloperModel.create({
        githubUsername: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        role: 'developer',
        teamId: 'team1',
        joinDate: new Date(),
        profileData: { 
          avatar: 'https://github.com/identicons/testuser.png', 
          bio: 'Test user', 
          location: 'Test Location' 
        },
      });

      // Create activities
      const commit1: Commit = {
        sha: 'abc123',
        author: 'testuser',
        email: 'test@example.com',
        message: 'Commit 1',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        stats: { additions: 1, deletions: 0, total: 1 },
        files: ['file1.ts'],
      };

      const commit2: Commit = {
        sha: 'def456',
        author: 'testuser',
        email: 'test@example.com',
        message: 'Commit 2',
        timestamp: new Date('2024-01-02T10:00:00Z'),
        stats: { additions: 2, deletions: 0, total: 2 },
        files: ['file2.ts'],
      };

      await activityMonitor.processCommit(commit1, 'repo123');
      await activityMonitor.processCommit(commit2, 'repo123');

      const activities = await activityMonitor.getActivitiesByDeveloper(
        developer._id.toString(),
        {
          start: new Date('2024-01-01T00:00:00Z'),
          end: new Date('2024-01-03T00:00:00Z'),
        }
      );

      expect(activities).toHaveLength(2);
      expect(activities[0].metadata.commitHash).toBe('def456'); // Most recent first
      expect(activities[1].metadata.commitHash).toBe('abc123');
    });

    it('should retrieve activities by repository within time range', async () => {
      const commit: Commit = {
        sha: 'abc123',
        author: 'testuser',
        email: 'test@example.com',
        message: 'Test',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        stats: { additions: 1, deletions: 0, total: 1 },
        files: ['file.ts'],
      };

      await activityMonitor.processCommit(commit, 'repo123');

      const activities = await activityMonitor.getActivitiesByRepository('repo123', {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-02T00:00:00Z'),
      });

      expect(activities).toHaveLength(1);
      expect(activities[0].repositoryId).toBe('repo123');
    });
  });
});
