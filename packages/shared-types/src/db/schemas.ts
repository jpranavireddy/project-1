import mongoose, { Schema, Document } from 'mongoose';
import {
  Developer,
  Repository,
  Activity,
  ProductivityScore,
  TeamHealthScore,
  Anomaly,
  Achievement,
} from '../types';

// Developer Schema
export interface DeveloperDocument extends Omit<Developer, 'id'>, Document {}

const DeveloperSchema = new Schema<DeveloperDocument>(
  {
    githubUsername: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['developer', 'senior_developer', 'team_lead', 'manager'],
    },
    teamId: { type: String, required: true, index: true },
    joinDate: { type: Date, required: true },
    profileData: 
{
      avatar: { type: String, required: true },
      bio: { type: String, required: true },
      location: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// Repository Schema
export interface RepositoryDocument extends Omit<Repository, 'id'>, Document {}

const RepositorySchema = new Schema<RepositoryDocument>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    owner: { type: String, required: true },
    description: { type: String, required: true },
    primaryLanguage: { type: String, required: true },
    isPrivate: { type: Boolean, required: true },
    createdAt: { type: Date, required: true },
    lastSyncedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

RepositorySchema.index({ name: 1, owner: 1 });

// Activity Schema
export interface ActivityDocument extends Omit<Activity, 'id'>, Document {}

const ActivitySchema = new Schema<ActivityDocument>(
  {
    type: {
      type: String,
      required: true,
      enum: ['commit', 'pull_request', 'issue', 'review'],
      index: true,
    },
    developerId: { type: String, required: true, index: true },
    repositoryId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    metadata: {
      commitHash: { type: String },
      prNumber: { type: Number },
      issueNumber: { type: Number },
      linesAdded: { type: Number },
      linesDeleted: { type: Number },
      filesChanged: { type: Number },
      reviewComments: [{ type: String }],
    },
  },
  { timestamps: true }
);

// Compound indexes for common queries
ActivitySchema.index({ developerId: 1, timestamp: -1 });
ActivitySchema.index({ repositoryId: 1, timestamp: -1 });
ActivitySchema.index({ developerId: 1, type: 1, timestamp: -1 });

// ProductivityScore Schema
export interface ProductivityScoreDocument extends Omit<ProductivityScore, 'id'>, Document {}

const ProductivityScoreSchema = new Schema<ProductivityScoreDocument>(
  {
    developerId: { type: String, required: true, index: true },
    timeRange: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    overallScore: { type: Number, required: true, min: 0, max: 100 },
    components: {
      commitFrequency: { type: Number, required: true },
      prCompletionRate: { type: Number, required: true },
      issueResolutionCount: { type: Number, required: true },
      codeReviewParticipation: { type: Number, required: true },
    },
    trend: {
      type: String,
      required: true,
      enum: ['increasing', 'stable', 'decreasing'],
    },
    calculatedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

ProductivityScoreSchema.index({ developerId: 1, 'timeRange.start': -1 });

// TeamHealthScore Schema
export interface TeamHealthScoreDocument extends Omit<TeamHealthScore, 'id'>, Document {}

const TeamHealthScoreSchema = new Schema<TeamHealthScoreDocument>(
  {
    teamId: { type: String, required: true, index: true },
    timeRange: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    overallScore: { type: Number, required: true, min: 0, max: 100 },
    components: {
      collaborationQuality: { type: Number, required: true },
      workloadBalance: { type: Number, required: true },
      communicationHealth: { type: Number, required: true },
      knowledgeSharing: { type: Number, required: true },
    },
    alerts: [
      {
        id: { type: String, required: true },
        type: { type: String, required: true },
        severity: { type: String, required: true, enum: ['low', 'medium', 'high'] },
        message: { type: String, required: true },
        createdAt: { type: Date, required: true },
      },
    ],
    calculatedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

TeamHealthScoreSchema.index({ teamId: 1, 'timeRange.start': -1 });

// Anomaly Schema
export interface AnomalyDocument extends Omit<Anomaly, 'id'>, Document {}

const AnomalySchema = new Schema<AnomalyDocument>(
  {
    developerId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['productivity_drop', 'unusual_pattern', 'quality_issue'],
    },
    severity: { type: String, required: true, enum: ['low', 'medium', 'high'] },
    description: { type: String, required: true },
    detectedAt: { type: Date, required: true },
    affectedTimeRange: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    validated: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

AnomalySchema.index({ developerId: 1, detectedAt: -1 });

// Achievement Schema
export interface AchievementDocument extends Omit<Achievement, 'id'>, Document {}

const AchievementSchema = new Schema<AchievementDocument>(
  {
    developerId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['high_productivity', 'code_quality', 'collaboration', 'consistency'],
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    criteria: {
      metric: { type: String, required: true },
      threshold: { type: Number, required: true },
      timeRange: { type: String, required: true },
    },
    earnedAt: { type: Date, required: true },
    notified: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

AchievementSchema.index({ developerId: 1, earnedAt: -1 });

// Export models
export const DeveloperModel = mongoose.model<DeveloperDocument>('Developer', DeveloperSchema);
export const RepositoryModel = mongoose.model<RepositoryDocument>('Repository', RepositorySchema);
export const ActivityModel = mongoose.model<ActivityDocument>('Activity', ActivitySchema);
export const ProductivityScoreModel = mongoose.model<ProductivityScoreDocument>(
  'ProductivityScore',
  ProductivityScoreSchema
);
export const TeamHealthScoreModel = mongoose.model<TeamHealthScoreDocument>(
  'TeamHealthScore',
  TeamHealthScoreSchema
);
export const AnomalyModel = mongoose.model<AnomalyDocument>('Anomaly', AnomalySchema);
export const AchievementModel = mongoose.model<AchievementDocument>('Achievement', AchievementSchema);
