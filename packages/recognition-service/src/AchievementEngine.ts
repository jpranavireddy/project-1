import { Achievement, AchievementCriteria, DeveloperProfile, UnlockedAchievement } from './types';

export class AchievementEngine {
    private achievements: Map<string, Achievement> = new Map();

    constructor(initialAchievements: Achievement[] = []) {
        initialAchievements.forEach(a => this.achievements.set(a.id, a));
    }

    public registerAchievement(achievement: Achievement): void {
        this.achievements.set(achievement.id, achievement);
    }

    public evaluate(
        developerId: string,
        currentProfile: DeveloperProfile,
        activityData: any
    ): UnlockedAchievement[] {
        const newUnlocks: UnlockedAchievement[] = [];

        for (const achievement of this.achievements.values()) {
            // Skip if already unlocked
            if (currentProfile.achievements.some(ua => ua.achievementId === achievement.id)) {
                continue;
            }

            if (this.checkCriteria(achievement.criteria, currentProfile, activityData)) {
                const unlock: UnlockedAchievement = {
                    achievementId: achievement.id,
                    unlockedAt: new Date(),
                    progress: 100
                };
                newUnlocks.push(unlock);
            }
        }

        return newUnlocks;
    }

    private checkCriteria(
        criteria: AchievementCriteria,
        profile: DeveloperProfile,
        data: any
    ): boolean {
        switch (criteria.type) {
            case 'metric_threshold':
                return this.checkMetricThreshold(criteria, data);
            case 'streak':
                return this.checkStreak(criteria, profile);
            case 'count':
                return this.checkCount(criteria, data);
            case 'custom':
                return criteria.customEvaluator ? criteria.customEvaluator(data) : false;
            default:
                return false;
        }
    }

    private checkMetricThreshold(criteria: AchievementCriteria, data: any): boolean {
        if (!criteria.metric || criteria.threshold === undefined) return false;
        const value = data[criteria.metric] || 0;
        return value >= criteria.threshold;
    }

    private checkStreak(criteria: AchievementCriteria, profile: DeveloperProfile): boolean {
        if (!criteria.metric || criteria.threshold === undefined) return false;
        const currentStreak = profile.currentStreaks[criteria.metric] || 0;
        return currentStreak >= criteria.threshold;
    }

    private checkCount(criteria: AchievementCriteria, data: any): boolean {
        if (!criteria.metric || criteria.threshold === undefined) return false;
        const count = data[criteria.metric] || 0;
        return count >= criteria.threshold;
    }
}
