import { AchievementEngine } from './AchievementEngine';
import { NotificationService } from './NotificationService';
import { LeaderboardManager } from './LeaderboardManager';
import { DataExporter } from './DataExporter';
import { DeveloperProfile, RecognitionEvent, Achievement } from './types';
import { v4 as uuidv4 } from 'uuid';

export class RecognitionService {
    private achievementEngine: AchievementEngine;
    private notificationService: NotificationService;
    private leaderboardManager: LeaderboardManager;
    private dataExporter: DataExporter;
    private profiles: Map<string, DeveloperProfile> = new Map();

    constructor() {
        this.achievementEngine = new AchievementEngine();
        this.notificationService = new NotificationService();
        this.leaderboardManager = new LeaderboardManager();
        this.dataExporter = new DataExporter();
    }

    public registerAchievement(achievement: Achievement): void {
        this.achievementEngine.registerAchievement(achievement);
    }

    public async processActivity(developerId: string, activityData: any): Promise<RecognitionEvent[]> {
        let profile = this.getOrCreateProfile(developerId);

        // Evaluate achievements
        const newUnlocks = this.achievementEngine.evaluate(developerId, profile, activityData);

        const events: RecognitionEvent[] = [];

        for (const unlock of newUnlocks) {
            // Update profile
            profile.achievements.push(unlock);

            // Create event
            const event: RecognitionEvent = {
                id: uuidv4(),
                type: 'achievement_unlocked',
                developerId,
                achievementId: unlock.achievementId,
                timestamp: new Date(),
                data: { unlock }
            };

            events.push(event);

            // Send notification
            await this.notificationService.sendRecognitionNotification(event);
        }

        return events;
    }

    public getLeaderboard() {
        const allProfiles = Array.from(this.profiles.values());
        return this.leaderboardManager.calculateLeaderboard(allProfiles);
    }

    public exportData(developerId: string, format: 'json' | 'csv' = 'json'): string {
        const profile = this.profiles.get(developerId);
        if (!profile) {
            throw new Error(`Profile not found for ${developerId}`);
        }
        return this.dataExporter.exportProfile(profile, format);
    }

    private getOrCreateProfile(developerId: string): DeveloperProfile {
        if (!this.profiles.has(developerId)) {
            this.profiles.set(developerId, {
                developerId,
                points: 0,
                achievements: [],
                currentStreaks: {}
            });
        }
        return this.profiles.get(developerId)!;
    }
}
