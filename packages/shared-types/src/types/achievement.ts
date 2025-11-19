export type AchievementType = 
  | 'high_productivity' 
  | 'code_quality' 
  | 'collaboration' 
  | 'consistency';

export interface AchievementCriteria {
  metric: string;
  threshold: number;
  timeRange: string;
}

export interface Achievement {
  id: string;
  developerId: string;
  type: AchievementType;
  title: string;
  description: string;
  criteria: AchievementCriteria;
  earnedAt: Date;
  notified: boolean;
}
