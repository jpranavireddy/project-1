import {
  validateDeveloper,
  validateRepository,
  validateActivity,
  validateProductivityScore,
  validateTeamHealthScore,
  validateAnomaly,
  validateAchievement,
} from '../validation';
import {
  Developer,
  Repository,
  Activity,
  ProductivityScore,
  TeamHealthScore,
  Anomaly,
  Achievement,
} from '../../types';

describe('Data Validation Functions', () => {
  describe('validateDeveloper', () => {
    const validDeveloper: Developer = {
      id: 'dev-1',
      githubUsername: 'johndoe',
      email: 'john@example.com',
      name: 'John Doe',
      role: 'developer',
      teamId: 'team-1',
      joinDate: new Date('2023-01-01'),
      profileData: {
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Software developer',
        location: 'San Francisco',
      },
    };

    it('should validate a correct developer', () => {
      const result = validateDeveloper(validDeveloper);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject developer with missing githubUsername', () => {
      const invalid = { ...validDeveloper, githubUsername: '' };
      const result = validateDeveloper(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('GitHub username is required');
    });

    it('should reject developer with invalid email', () => {
      const invalid = { ...validDeveloper, email: 'invalid-email' };
      const result = validateDeveloper(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valid email is required');
    });

    it('should reject developer with invalid role', () => {
      const invalid = { ...validDeveloper, role: 'invalid' as any };
      const result = validateDeveloper(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valid role is required');
    });

    it('should reject developer with invalid joinDate', () => {
      const invalid = { ...validDeveloper, joinDate: new Date('invalid') };
      const result = validateDeveloper(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valid join date is required');
    });

    it('should reject developer with missing profile data', () => {
      const invalid = { ...validDeveloper, profileData: undefined as any };
      const result = validateDeveloper(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Profile data is required');
    });
  });

  describe('validateRepository', () => {
    const validRepository: Repository = {
      id: 'repo-1',
      name: 'test-repo',
      url: 'https://github.com/user/test-repo',
      owner: 'user',
      description: 'A test repository',
      primaryLanguage: 'TypeScript',
      isPrivate: false,
      createdAt: new Date('2023-01-01'),
      lastSyncedAt: new Date('2024-01-01'),
    };

    it('should validate a correct repository', () => {
      const result = validateRepository(validRepository);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject repository with invalid URL', () => {
      const invalid = { ...validRepository, url: 'not-a-url' };
      const result = validateRepository(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valid repository URL is required');
    });

    it('should reject repository with non-boolean isPrivate', () => {
      const invalid = { ...validRepository, isPrivate: 'yes' as any };
      const result = validateRepository(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('isPrivate must be a boolean');
    });
  });

  describe('validateActivity', () => {
    const validCommitActivity: Activity = {
      id: 'activity-1',
      type: 'commit',
      developerId: 'dev-1',
      repositoryId: 'repo-1',
      timestamp: new Date('2024-01-01T10:00:00Z'),
      metadata: {
        commitHash: 'abc123def456',
        linesAdded: 100,
        linesDeleted: 50,
        filesChanged: 5,
      },
    };

    it('should validate a correct commit activity', () => {
      const result = validateActivity(validCommitActivity);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject activity with invalid type', () => {
      const invalid = { ...validCommitActivity, type: 'invalid' as any };
      const result = validateActivity(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valid activity type is required');
    });

    it('should reject commit activity without commitHash', () => {
      const invalid = {
        ...validCommitActivity,
        metadata: { linesAdded: 100 },
      };
      const result = validateActivity(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Commit hash is required for commit activities');
    });

    it('should reject pull_request activity without prNumber', () => {
      const invalid: Activity = {
        ...validCommitActivity,
        type: 'pull_request',
        metadata: { linesAdded: 100 },
      };
      const result = validateActivity(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('PR number is required for pull request activities');
    });

    it('should reject issue activity without issueNumber', () => {
      const invalid: Activity = {
        ...validCommitActivity,
        type: 'issue',
        metadata: {},
      };
      const result = validateActivity(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Issue number is required for issue activities');
    });

    it('should reject activity with invalid timestamp', () => {
      const invalid = { ...validCommitActivity, timestamp: new Date('invalid') };
      const result = validateActivity(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valid timestamp is required');
    });
  });

  describe('validateProductivityScore', () => {
    const validScore: ProductivityScore = {
      developerId: 'dev-1',
      timeRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
      overallScore: 85,
      components: {
        commitFrequency: 20,
        prCompletionRate: 25,
        issueResolutionCount: 15,
        codeReviewParticipation: 25,
      },
      trend: 'increasing',
      calculatedAt: new Date('2024-02-01'),
    };

    it('should validate a correct productivity score', () => {
      const result = validateProductivityScore(validScore);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject score with overallScore out of range', () => {
      const invalid = { ...validScore, overallScore: 150 };
      const result = validateProductivityScore(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Overall score must be a number between 0 and 100');
    });

    it('should reject score with invalid time range', () => {
      const invalid = {
        ...validScore,
        timeRange: {
          start: new Date('2024-01-31'),
          end: new Date('2024-01-01'),
        },
      };
      const result = validateProductivityScore(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Time range start must be before end');
    });

    it('should reject score with invalid trend', () => {
      const invalid = { ...validScore, trend: 'invalid' as any };
      const result = validateProductivityScore(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valid trend is required');
    });
  });

  describe('validateTeamHealthScore', () => {
    const validScore: TeamHealthScore = {
      teamId: 'team-1',
      timeRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
      overallScore: 75,
      components: {
        collaborationQuality: 20,
        workloadBalance: 18,
        communicationHealth: 19,
        knowledgeSharing: 18,
      },
      alerts: [],
      calculatedAt: new Date('2024-02-01'),
    };

    it('should validate a correct team health score', () => {
      const result = validateTeamHealthScore(validScore);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject score with overallScore out of range', () => {
      const invalid = { ...validScore, overallScore: -10 };
      const result = validateTeamHealthScore(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Overall score must be a number between 0 and 100');
    });

    it('should reject score with non-array alerts', () => {
      const invalid = { ...validScore, alerts: 'not-an-array' as any };
      const result = validateTeamHealthScore(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Alerts must be an array');
    });
  });

  describe('validateAnomaly', () => {
    const validAnomaly: Anomaly = {
      id: 'anomaly-1',
      developerId: 'dev-1',
      type: 'productivity_drop',
      severity: 'high',
      description: 'Significant drop in commit frequency',
      detectedAt: new Date('2024-01-15'),
      affectedTimeRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-14'),
      },
      validated: false,
    };

    it('should validate a correct anomaly', () => {
      const result = validateAnomaly(validAnomaly);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject anomaly with invalid type', () => {
      const invalid = { ...validAnomaly, type: 'invalid' as any };
      const result = validateAnomaly(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valid anomaly type is required');
    });

    it('should reject anomaly with invalid severity', () => {
      const invalid = { ...validAnomaly, severity: 'critical' as any };
      const result = validateAnomaly(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valid severity is required');
    });

    it('should reject anomaly with non-boolean validated', () => {
      const invalid = { ...validAnomaly, validated: 'yes' as any };
      const result = validateAnomaly(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Validated must be a boolean');
    });
  });

  describe('validateAchievement', () => {
    const validAchievement: Achievement = {
      id: 'achievement-1',
      developerId: 'dev-1',
      type: 'high_productivity',
      title: 'Productivity Champion',
      description: 'Achieved high productivity score for 3 consecutive months',
      criteria: {
        metric: 'productivity_score',
        threshold: 90,
        timeRange: '3_months',
      },
      earnedAt: new Date('2024-01-01'),
      notified: true,
    };

    it('should validate a correct achievement', () => {
      const result = validateAchievement(validAchievement);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject achievement with invalid type', () => {
      const invalid = { ...validAchievement, type: 'invalid' as any };
      const result = validateAchievement(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valid achievement type is required');
    });

    it('should reject achievement with missing criteria', () => {
      const invalid = { ...validAchievement, criteria: undefined as any };
      const result = validateAchievement(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Criteria is required');
    });

    it('should reject achievement with non-boolean notified', () => {
      const invalid = { ...validAchievement, notified: 'yes' as any };
      const result = validateAchievement(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Notified must be a boolean');
    });
  });
});
