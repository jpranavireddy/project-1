import { Activity, ActivityType } from '@dev-tracker/shared-types';
import { ActivityModel } from '@dev-tracker/shared-types/dist/db';
import { Commit, PullRequest, Issue } from './types';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface ActivityMonitor {
  processCommit(commit: Commit, repositoryId: string): Promise<Activity>;
  processPullRequest(pr: PullRequest, repositoryId: string): Promise<Activity>;
  processIssue(issue: Issue, repositoryId: string): Promise<Activity>;
  getActivitiesByDeveloper(developerId: string, timeRange: TimeRange): Promise<Activity[]>;
  getActivitiesByRepository(repositoryId: string, timeRange: TimeRange): Promise<Activity[]>;
}

export class ActivityMonitorService implements ActivityMonitor {
  /**
   * Process a commit and store it as an activity
   */
  async processCommit(commit: Commit, repositoryId: string): Promise<Activity> {
    // Validate commit data
    this.validateCommit(commit);

    // Resolve developer identity
    const developerId = await this.resolveDeveloperIdentity(commit.author, commit.email);

    // Create activity object
    const activity: Omit<Activity, 'id'> = {
      type: 'commit',
      developerId,
      repositoryId,
      timestamp: commit.timestamp,
      metadata: {
        commitHash: commit.sha,
        linesAdded: commit.stats.additions,
        linesDeleted: commit.stats.deletions,
        filesChanged: commit.files.length,
      },
    };

    // Store activity
    return this.storeActivity(activity);
  }

  /**
   * Process a pull request and store it as an activity
   */
  async processPullRequest(pr: PullRequest, repositoryId: string): Promise<Activity> {
    // Validate PR data
    this.validatePullRequest(pr);

    // Resolve developer identity
    const developerId = await this.resolveDeveloperIdentity(pr.author);

    // Create activity object
    const activity: Omit<Activity, 'id'> = {
      type: 'pull_request',
      developerId,
      repositoryId,
      timestamp: pr.createdAt,
      metadata: {
        prNumber: pr.number,
        linesAdded: pr.additions,
        linesDeleted: pr.deletions,
        filesChanged: pr.changedFiles,
        reviewComments: pr.reviewComments,
      },
    };

    // Store activity
    return this.storeActivity(activity);
  }

  /**
   * Process an issue and store it as an activity
   */
  async processIssue(issue: Issue, repositoryId: string): Promise<Activity> {
    // Validate issue data
    this.validateIssue(issue);

    // Resolve developer identity
    const developerId = await this.resolveDeveloperIdentity(issue.author);

    // Create activity object
    const activity: Omit<Activity, 'id'> = {
      type: 'issue',
      developerId,
      repositoryId,
      timestamp: issue.createdAt,
      metadata: {
        issueNumber: issue.number,
      },
    };

    // Store activity
    return this.storeActivity(activity);
  }

  /**
   * Retrieve activities for a specific developer within a time range
   */
  async getActivitiesByDeveloper(
    developerId: string,
    timeRange: TimeRange
  ): Promise<Activity[]> {
    const activities = await ActivityModel.find({
      developerId,
      timestamp: {
        $gte: timeRange.start,
        $lte: timeRange.end,
      },
    })
      .sort({ timestamp: -1 })
      .lean();

    return activities.map(this.mapDocumentToActivity);
  }

  /**
   * Retrieve activities for a specific repository within a time range
   */
  async getActivitiesByRepository(
    repositoryId: string,
    timeRange: TimeRange
  ): Promise<Activity[]> {
    const activities = await ActivityModel.find({
      repositoryId,
      timestamp: {
        $gte: timeRange.start,
        $lte: timeRange.end,
      },
    })
      .sort({ timestamp: -1 })
      .lean();

    return activities.map(this.mapDocumentToActivity);
  }

  /**
   * Validate commit data
   */
  private validateCommit(commit: Commit): void {
    if (!commit.sha || typeof commit.sha !== 'string') {
      throw new Error('Invalid commit: missing or invalid sha');
    }
    if (!commit.author || typeof commit.author !== 'string') {
      throw new Error('Invalid commit: missing or invalid author');
    }
    if (!commit.timestamp || !(commit.timestamp instanceof Date)) {
      throw new Error('Invalid commit: missing or invalid timestamp');
    }
    if (!commit.stats || typeof commit.stats.additions !== 'number') {
      throw new Error('Invalid commit: missing or invalid stats');
    }
    if (!Array.isArray(commit.files)) {
      throw new Error('Invalid commit: missing or invalid files array');
    }
  }

  /**
   * Validate pull request data
   */
  private validatePullRequest(pr: PullRequest): void {
    if (typeof pr.number !== 'number') {
      throw new Error('Invalid pull request: missing or invalid number');
    }
    if (!pr.author || typeof pr.author !== 'string') {
      throw new Error('Invalid pull request: missing or invalid author');
    }
    if (!pr.createdAt || !(pr.createdAt instanceof Date)) {
      throw new Error('Invalid pull request: missing or invalid createdAt');
    }
    if (typeof pr.additions !== 'number' || typeof pr.deletions !== 'number') {
      throw new Error('Invalid pull request: missing or invalid additions/deletions');
    }
  }

  /**
   * Validate issue data
   */
  private validateIssue(issue: Issue): void {
    if (typeof issue.number !== 'number') {
      throw new Error('Invalid issue: missing or invalid number');
    }
    if (!issue.author || typeof issue.author !== 'string') {
      throw new Error('Invalid issue: missing or invalid author');
    }
    if (!issue.createdAt || !(issue.createdAt instanceof Date)) {
      throw new Error('Invalid issue: missing or invalid createdAt');
    }
  }

  /**
   * Resolve developer identity from GitHub username and/or email
   */
  private async resolveDeveloperIdentity(
    githubUsername: string,
    email?: string
  ): Promise<string> {
    const { DeveloperModel } = await import('@dev-tracker/shared-types/dist/db');

    // Try to find developer by GitHub username
    let developer = await DeveloperModel.findOne({ githubUsername }).lean();

    // If not found and email provided, try by email
    if (!developer && email) {
      developer = await DeveloperModel.findOne({ email }).lean();
    }

    // If still not found, create a new developer record
    if (!developer) {
      const newDeveloper = await DeveloperModel.create({
        githubUsername,
        email: email || `${githubUsername}@unknown.com`,
        name: githubUsername,
        role: 'developer',
        teamId: 'default',
        joinDate: new Date(),
        profileData: {
          avatar: 'https://github.com/identicons/' + githubUsername + '.png',
          bio: 'Auto-created developer profile',
          location: 'Unknown',
        },
      });
      return newDeveloper._id.toString();
    }

    return developer._id.toString();
  }

  /**
   * Store activity in database with timestamp preservation
   */
  private async storeActivity(activity: Omit<Activity, 'id'>): Promise<Activity> {
    const activityDoc = await ActivityModel.create(activity);
    return this.mapDocumentToActivity(activityDoc.toObject());
  }

  /**
   * Map MongoDB document to Activity interface
   */
  private mapDocumentToActivity(doc: any): Activity {
    return {
      id: doc._id.toString(),
      type: doc.type,
      developerId: doc.developerId,
      repositoryId: doc.repositoryId,
      timestamp: doc.timestamp,
      metadata: doc.metadata,
    };
  }
}
