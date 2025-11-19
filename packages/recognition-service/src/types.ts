export interface Achievement {
  id: string;
  name: string;
  description: string;
  criteria: AchievementCriteria;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  icon?: string;
}

export interface AchievementCriteria {
  type: 'metric_threshold' | 'streak' | 'count' | 'custom';
  metric?: string;
  threshold?: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  customEvaluator?: (data: any) => boolean;
}

export interface DeveloperProfile {
  developerId: string;
  points: number;
  achievements: UnlockedAchievement[];
  currentStreaks: Record<string, number>;
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: Date;
  progress: number;
}

export interface RecognitionEvent {
  id: string;
  type: 'achievement_unlocked' | 'tier_upgrade' | 'streak_milestone';
  developerId: string;
  achievementId?: string;
  timestamp: Date;
  data: any;
}

export interface LeaderboardEntry {
  developerId: string;
  rank: number;
  points: number;
  achievementCount: number;
  recentAchievements: string[]; // Achievement names
}

export interface Notification {
  id: string;
  recipientId: string;
  type: 'recognition';
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: Date;
}
