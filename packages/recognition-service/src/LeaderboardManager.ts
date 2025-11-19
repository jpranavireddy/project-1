import { DeveloperProfile, LeaderboardEntry } from './types';

export class LeaderboardManager {
    public calculateLeaderboard(profiles: DeveloperProfile[]): LeaderboardEntry[] {
        // Sort by points descending
        const sortedProfiles = [...profiles].sort((a, b) => b.points - a.points);

        return sortedProfiles.map((profile, index) => ({
            developerId: profile.developerId,
            rank: index + 1,
            points: profile.points,
            achievementCount: profile.achievements.length,
            recentAchievements: this.getRecentAchievementIds(profile)
        }));
    }

    public getRank(developerId: string, leaderboard: LeaderboardEntry[]): number {
        const entry = leaderboard.find(e => e.developerId === developerId);
        return entry ? entry.rank : -1;
    }

    public getTopPerformers(leaderboard: LeaderboardEntry[], limit: number = 10): LeaderboardEntry[] {
        return leaderboard.slice(0, limit);
    }

    private getRecentAchievementIds(profile: DeveloperProfile): string[] {
        // Sort achievements by unlock date descending and take top 3
        return [...profile.achievements]
            .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
            .slice(0, 3)
            .map(a => a.achievementId);
    }
}
