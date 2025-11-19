import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  DeveloperModel,
  RepositoryModel,
  ActivityModel,
  ProductivityScoreModel,
  TeamHealthScoreModel,
  AnomalyModel,
  AchievementModel,
} from '../schemas';
import { dbConnection } from '../connection';
import { Developer, Repository, Activity } from '../../types';

describe('Database CRUD Operations', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await dbConnection.connect({ uri });
  });

  afterAll(async () => {
    await dbConnection.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Promise.all([
      DeveloperModel.deleteMany({}),
      RepositoryModel.deleteMany({}),
      ActivityModel.deleteMany({}),
      ProductivityScoreModel.deleteMany({}),
      TeamHealthScoreModel.deleteMany({}),
      AnomalyModel.deleteMany({}),
      AchievementModel.deleteMany({}),
    ]);
  });

  describe('Developer CRUD', () => {
    const sampleDeveloper = {
      githubUsername: 'johndoe',
      email: 'john@example.com',
      name: 'John Doe',
      role: 'developer' as const,
      teamId: 'team-1',
      joinDate: new Date('2023-01-01'),
      profileData: {
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Software developer',
        location: 'San Francisco',
      },
    };

    it('should create a developer', async () => {
      const developer = new DeveloperModel(sampleDeveloper);
      const saved = await developer.save();

      expect(saved._id).toBeDefined();
      expect(saved.githubUsername).toBe(sampleDeveloper.githubUsername);
      expect(saved.email).toBe(sampleDeveloper.email);
    });

    it('should read a developer', async () => {
      const developer = new DeveloperModel(sampleDeveloper);
      const saved = await developer.save();

      const found = await DeveloperModel.findById(saved._id);
      expect(found).not.toBeNull();
      expect(found?.githubUsername).toBe(sampleDeveloper.githubUsername);
    });

    it('should update a developer', async () => {
      const developer = new DeveloperModel(sampleDeveloper);
      const saved = await developer.save();

      saved.role = 'senior_developer';
      await saved.save();

      const updated = await DeveloperModel.findById(saved._id);
      expect(updated?.role).toBe('senior_developer');
    });

    it('should delete a developer', async () => {
      const developer = new DeveloperModel(sampleDeveloper);
      const saved = await developer.save();

      await DeveloperModel.findByIdAndDelete(saved._id);

      const found = await DeveloperModel.findById(saved._id);
      expect(found).toBeNull();
    });

    it('should enforce unique githubUsername', async () => {
      const developer1 = new DeveloperModel(sampleDeveloper);
      await developer1.save();

      const developer2 = new DeveloperModel(sampleDeveloper);
      await expect(developer2.save()).rejects.toThrow();
    });
  });

  describe('Repository CRUD', () => {
    const sampleRepository = {
      name: 'test-repo',
      url: 'https://github.com/user/test-repo',
      owner: 'user',
      description: 'A test repository',
      primaryLanguage: 'TypeScript',
      isPrivate: false,
      createdAt: new Date('2023-01-01'),
      lastSyncedAt: new Date('2024-01-01'),
    };

    it('should create a repository', async () => {
      const repository = new RepositoryModel(sampleRepository);
      const saved = await repository.save();

      expect(saved._id).toBeDefined();
      expect(saved.name).toBe(sampleRepository.name);
      expect(saved.url).toBe(sampleRepository.url);
    });

    it('should read a repository', async () => {
      const repository = new RepositoryModel(sampleRepository);
      const saved = await repository.save();

      const found = await RepositoryModel.findById(saved._id);
      expect(found).not.toBeNull();
      expect(found?.name).toBe(sampleRepository.name);
    });

    it('should update a repository', async () => {
      const repository = new RepositoryModel(sampleRepository);
      const saved = await repository.save();

      const newSyncDate = new Date('2024-02-01');
      saved.lastSyncedAt = newSyncDate;
      await saved.save();

      const updated = await RepositoryModel.findById(saved._id);
      expect(updated?.lastSyncedAt.getTime()).toBe(newSyncDate.getTime());
    });

    it('should delete a repository', async () => {
      const repository = new RepositoryModel(sampleRepository);
      const saved = await repository.save();

      await RepositoryModel.findByIdAndDelete(saved._id);

      const found = await RepositoryModel.findById(saved._id);
      expect(found).toBeNull();
    });
  });

  describe('Activity CRUD', () => {
    const sampleActivity = {
      type: 'commit' as const,
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

    it('should create an activity', async () => {
      const activity = new ActivityModel(sampleActivity);
      const saved = await activity.save();

      expect(saved._id).toBeDefined();
      expect(saved.type).toBe(sampleActivity.type);
      expect(saved.developerId).toBe(sampleActivity.developerId);
    });

    it('should read an activity', async () => {
      const activity = new ActivityModel(sampleActivity);
      const saved = await activity.save();

      const found = await ActivityModel.findById(saved._id);
      expect(found).not.toBeNull();
      expect(found?.type).toBe(sampleActivity.type);
    });

    it('should query activities by developerId', async () => {
      const activity1 = new ActivityModel(sampleActivity);
      const activity2 = new ActivityModel({
        ...sampleActivity,
        developerId: 'dev-2',
      });

      await activity1.save();
      await activity2.save();

      const found = await ActivityModel.find({ developerId: 'dev-1' });
      expect(found).toHaveLength(1);
      expect(found[0].developerId).toBe('dev-1');
    });

    it('should query activities by repositoryId', async () => {
      const activity1 = new ActivityModel(sampleActivity);
      const activity2 = new ActivityModel({
        ...sampleActivity,
        repositoryId: 'repo-2',
      });

      await activity1.save();
      await activity2.save();

      const found = await ActivityModel.find({ repositoryId: 'repo-1' });
      expect(found).toHaveLength(1);
      expect(found[0].repositoryId).toBe('repo-1');
    });

    it('should query activities by time range', async () => {
      const activity1 = new ActivityModel({
        ...sampleActivity,
        timestamp: new Date('2024-01-01'),
      });
      const activity2 = new ActivityModel({
        ...sampleActivity,
        timestamp: new Date('2024-02-01'),
      });

      await activity1.save();
      await activity2.save();

      const found = await ActivityModel.find({
        timestamp: {
          $gte: new Date('2024-01-01'),
          $lt: new Date('2024-01-15'),
        },
      });

      expect(found).toHaveLength(1);
      expect(found[0].timestamp.getMonth()).toBe(0); // January
    });

    it('should delete an activity', async () => {
      const activity = new ActivityModel(sampleActivity);
      const saved = await activity.save();

      await ActivityModel.findByIdAndDelete(saved._id);

      const found = await ActivityModel.findById(saved._id);
      expect(found).toBeNull();
    });
  });

  describe('ProductivityScore CRUD', () => {
    const sampleScore = {
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
      trend: 'increasing' as const,
      calculatedAt: new Date('2024-02-01'),
    };

    it('should create a productivity score', async () => {
      const score = new ProductivityScoreModel(sampleScore);
      const saved = await score.save();

      expect(saved._id).toBeDefined();
      expect(saved.overallScore).toBe(sampleScore.overallScore);
    });

    it('should read a productivity score', async () => {
      const score = new ProductivityScoreModel(sampleScore);
      const saved = await score.save();

      const found = await ProductivityScoreModel.findById(saved._id);
      expect(found).not.toBeNull();
      expect(found?.overallScore).toBe(sampleScore.overallScore);
    });

    it('should enforce score bounds', async () => {
      const invalidScore = new ProductivityScoreModel({
        ...sampleScore,
        overallScore: 150,
      });

      await expect(invalidScore.save()).rejects.toThrow();
    });
  });

  describe('Model Serialization', () => {
    it('should serialize and deserialize Developer correctly', async () => {
      const developer = new DeveloperModel({
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
      });

      const saved = await developer.save();
      const json = saved.toJSON();

      expect(json.githubUsername).toBe('johndoe');
      expect(json.email).toBe('john@example.com');
      expect(json.profileData.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('should serialize and deserialize Activity correctly', async () => {
      const activity = new ActivityModel({
        type: 'commit',
        developerId: 'dev-1',
        repositoryId: 'repo-1',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        metadata: {
          commitHash: 'abc123',
          linesAdded: 100,
        },
      });

      const saved = await activity.save();
      const json = saved.toJSON();

      expect(json.type).toBe('commit');
      expect(json.metadata.commitHash).toBe('abc123');
      expect(json.metadata.linesAdded).toBe(100);
    });
  });
});
