import {
  Developer,
  Repository,
  Activity,
  ProductivityScore,
  TeamHealthScore,
  Anomaly,
  Achievement,
  DeveloperRole,
  ActivityType,
  AnomalyType,
  AchievementType,
} from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Developer Validation
export function validateDeveloper(developer: Partial<Developer>): ValidationResult {
  const errors: string[] = [];

  if (!developer.githubUsername || developer.githubUsername.trim() === '') {
    errors.push('GitHub username is required');
  }

  if (!developer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(developer.email)) {
    errors.push('Valid email is required');
  }

  if (!developer.name || developer.name.trim() === '') {
    errors.push('Name is required');
  }

  const validRoles: DeveloperRole[] = ['developer', 'senior_developer', 'team_lead', 'manager'];
  if (!developer.role || !validRoles.includes(developer.role)) {
    errors.push('Valid role is required');
  }

  if (!developer.teamId || developer.teamId.trim() === '') {
    errors.push('Team ID is required');
  }

  if (!developer.joinDate || !(developer.joinDate instanceof Date) || isNaN(developer.joinDate.getTime())) {
    errors.push('Valid join date is required');
  }

  if (!developer.profileData) {
    errors.push('Profile data is required');
  } else {
    if (!developer.profileData.avatar || developer.profileData.avatar.trim() === '') {
      errors.push('Profile avatar is required');
    }
    if (!developer.profileData.bio || developer.profileData.bio.trim() === '') {
      errors.push('Profile bio is required');
    }
    if (!developer.profileData.location || developer.profileData.location.trim() === '') {
      errors.push('Profile location is required');
    }
  }

  return { valid: errors.length === 0, errors };
}

// Repository Validation
export function validateRepository(repository: Partial<Repository>): ValidationResult {
  const errors: string[] = [];

  if (!repository.name || repository.name.trim() === '') {
    errors.push('Repository name is required');
  }

  if (!repository.url || !/^https?:\/\/.+/.test(repository.url)) {
    errors.push('Valid repository URL is required');
  }

  if (!repository.owner || repository.owner.trim() === '') {
    errors.push('Repository owner is required');
  }

  if (!repository.description || repository.description.trim() === '') {
    errors.push('Repository description is required');
  }

  if (!repository.primaryLanguage || repository.primaryLanguage.trim() === '') {
    errors.push('Primary language is required');
  }

  if (typeof repository.isPrivate !== 'boolean') {
    errors.push('isPrivate must be a boolean');
  }

  if (!repository.createdAt || !(repository.createdAt instanceof Date) || isNaN(repository.createdAt.getTime())) {
    errors.push('Valid created date is required');
  }

  if (!repository.lastSyncedAt || !(repository.lastSyncedAt instanceof Date) || isNaN(repository.lastSyncedAt.getTime())) {
    errors.push('Valid last synced date is required');
  }

  return { valid: errors.length === 0, errors };
}

// Activity Validation
export function validateActivity(activity: Partial<Activity>): ValidationResult {
  const errors: string[] = [];

  const validTypes: ActivityType[] = ['commit', 'pull_request', 'issue', 'review'];
  if (!activity.type || !validTypes.includes(activity.type)) {
    errors.push('Valid activity type is required');
  }

  if (!activity.developerId || activity.developerId.trim() === '') {
    errors.push('Developer ID is required');
  }

  if (!activity.repositoryId || activity.repositoryId.trim() === '') {
    errors.push('Repository ID is required');
  }

  if (!activity.timestamp || !(activity.timestamp instanceof Date) || isNaN(activity.timestamp.getTime())) {
    errors.push('Valid timestamp is required');
  }

  if (!activity.metadata) {
    errors.push('Activity metadata is required');
  } else {
    // Type-specific validation
    if (activity.type === 'commit' && !activity.metadata.commitHash) {
      errors.push('Commit hash is required for commit activities');
    }
    if (activity.type === 'pull_request' && !activity.metadata.prNumber) {
      errors.push('PR number is required for pull request activities');
    }
    if (activity.type === 'issue' && !activity.metadata.issueNumber) {
      errors.push('Issue number is required for issue activities');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ProductivityScore Validation
export function validateProductivityScore(score: Partial<ProductivityScore>): ValidationResult {
  const errors: string[] = [];

  if (!score.developerId || score.developerId.trim() === '') {
    errors.push('Developer ID is required');
  }

  if (!score.timeRange) {
    errors.push('Time range is required');
  } else {
    if (!score.timeRange.start || !(score.timeRange.start instanceof Date) || isNaN(score.timeRange.start.getTime())) {
      errors.push('Valid time range start is required');
    }
    if (!score.timeRange.end || !(score.timeRange.end instanceof Date) || isNaN(score.timeRange.end.getTime())) {
      errors.push('Valid time range end is required');
    }
    if (score.timeRange.start && score.timeRange.end && score.timeRange.start >= score.timeRange.end) {
      errors.push('Time range start must be before end');
    }
  }

  if (typeof score.overallScore !== 'number' || score.overallScore < 0 || score.overallScore > 100) {
    errors.push('Overall score must be a number between 0 and 100');
  }

  if (!score.components) {
    errors.push('Score components are required');
  } else {
    if (typeof score.components.commitFrequency !== 'number') {
      errors.push('Commit frequency must be a number');
    }
    if (typeof score.components.prCompletionRate !== 'number') {
      errors.push('PR completion rate must be a number');
    }
    if (typeof score.components.issueResolutionCount !== 'number') {
      errors.push('Issue resolution count must be a number');
    }
    if (typeof score.components.codeReviewParticipation !== 'number') {
      errors.push('Code review participation must be a number');
    }
  }

  const validTrends = ['increasing', 'stable', 'decreasing'];
  if (!score.trend || !validTrends.includes(score.trend)) {
    errors.push('Valid trend is required');
  }

  if (!score.calculatedAt || !(score.calculatedAt instanceof Date) || isNaN(score.calculatedAt.getTime())) {
    errors.push('Valid calculated date is required');
  }

  return { valid: errors.length === 0, errors };
}

// TeamHealthScore Validation
export function validateTeamHealthScore(score: Partial<TeamHealthScore>): ValidationResult {
  const errors: string[] = [];

  if (!score.teamId || score.teamId.trim() === '') {
    errors.push('Team ID is required');
  }

  if (!score.timeRange) {
    errors.push('Time range is required');
  } else {
    if (!score.timeRange.start || !(score.timeRange.start instanceof Date) || isNaN(score.timeRange.start.getTime())) {
      errors.push('Valid time range start is required');
    }
    if (!score.timeRange.end || !(score.timeRange.end instanceof Date) || isNaN(score.timeRange.end.getTime())) {
      errors.push('Valid time range end is required');
    }
    if (score.timeRange.start && score.timeRange.end && score.timeRange.start >= score.timeRange.end) {
      errors.push('Time range start must be before end');
    }
  }

  if (typeof score.overallScore !== 'number' || score.overallScore < 0 || score.overallScore > 100) {
    errors.push('Overall score must be a number between 0 and 100');
  }

  if (!score.components) {
    errors.push('Score components are required');
  } else {
    if (typeof score.components.collaborationQuality !== 'number') {
      errors.push('Collaboration quality must be a number');
    }
    if (typeof score.components.workloadBalance !== 'number') {
      errors.push('Workload balance must be a number');
    }
    if (typeof score.components.communicationHealth !== 'number') {
      errors.push('Communication health must be a number');
    }
    if (typeof score.components.knowledgeSharing !== 'number') {
      errors.push('Knowledge sharing must be a number');
    }
  }

  if (!Array.isArray(score.alerts)) {
    errors.push('Alerts must be an array');
  }

  if (!score.calculatedAt || !(score.calculatedAt instanceof Date) || isNaN(score.calculatedAt.getTime())) {
    errors.push('Valid calculated date is required');
  }

  return { valid: errors.length === 0, errors };
}

// Anomaly Validation
export function validateAnomaly(anomaly: Partial<Anomaly>): ValidationResult {
  const errors: string[] = [];

  if (!anomaly.developerId || anomaly.developerId.trim() === '') {
    errors.push('Developer ID is required');
  }

  const validTypes: AnomalyType[] = ['productivity_drop', 'unusual_pattern', 'quality_issue'];
  if (!anomaly.type || !validTypes.includes(anomaly.type)) {
    errors.push('Valid anomaly type is required');
  }

  const validSeverities = ['low', 'medium', 'high'];
  if (!anomaly.severity || !validSeverities.includes(anomaly.severity)) {
    errors.push('Valid severity is required');
  }

  if (!anomaly.description || anomaly.description.trim() === '') {
    errors.push('Description is required');
  }

  if (!anomaly.detectedAt || !(anomaly.detectedAt instanceof Date) || isNaN(anomaly.detectedAt.getTime())) {
    errors.push('Valid detected date is required');
  }

  if (!anomaly.affectedTimeRange) {
    errors.push('Affected time range is required');
  } else {
    if (!anomaly.affectedTimeRange.start || !(anomaly.affectedTimeRange.start instanceof Date) || isNaN(anomaly.affectedTimeRange.start.getTime())) {
      errors.push('Valid affected time range start is required');
    }
    if (!anomaly.affectedTimeRange.end || !(anomaly.affectedTimeRange.end instanceof Date) || isNaN(anomaly.affectedTimeRange.end.getTime())) {
      errors.push('Valid affected time range end is required');
    }
  }

  if (typeof anomaly.validated !== 'boolean') {
    errors.push('Validated must be a boolean');
  }

  return { valid: errors.length === 0, errors };
}

// Achievement Validation
export function validateAchievement(achievement: Partial<Achievement>): ValidationResult {
  const errors: string[] = [];

  if (!achievement.developerId || achievement.developerId.trim() === '') {
    errors.push('Developer ID is required');
  }

  const validTypes: AchievementType[] = ['high_productivity', 'code_quality', 'collaboration', 'consistency'];
  if (!achievement.type || !validTypes.includes(achievement.type)) {
    errors.push('Valid achievement type is required');
  }

  if (!achievement.title || achievement.title.trim() === '') {
    errors.push('Title is required');
  }

  if (!achievement.description || achievement.description.trim() === '') {
    errors.push('Description is required');
  }

  if (!achievement.criteria) {
    errors.push('Criteria is required');
  } else {
    if (!achievement.criteria.metric || achievement.criteria.metric.trim() === '') {
      errors.push('Criteria metric is required');
    }
    if (typeof achievement.criteria.threshold !== 'number') {
      errors.push('Criteria threshold must be a number');
    }
    if (!achievement.criteria.timeRange || achievement.criteria.timeRange.trim() === '') {
      errors.push('Criteria time range is required');
    }
  }

  if (!achievement.earnedAt || !(achievement.earnedAt instanceof Date) || isNaN(achievement.earnedAt.getTime())) {
    errors.push('Valid earned date is required');
  }

  if (typeof achievement.notified !== 'boolean') {
    errors.push('Notified must be a boolean');
  }

  return { valid: errors.length === 0, errors };
}
