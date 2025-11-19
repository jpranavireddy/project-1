import { DeveloperProfile, RecognitionEvent } from './types';

export class DataExporter {
    public exportProfile(profile: DeveloperProfile, format: 'json' | 'csv' = 'json'): string {
        if (format === 'csv') {
            return this.toCSV([profile]);
        }
        return JSON.stringify(profile, null, 2);
    }

    public exportEvents(events: RecognitionEvent[], format: 'json' | 'csv' = 'json'): string {
        if (format === 'csv') {
            return this.eventsToCSV(events);
        }
        return JSON.stringify(events, null, 2);
    }

    private toCSV(profiles: DeveloperProfile[]): string {
        const headers = ['developerId', 'points', 'achievementCount'];
        const rows = profiles.map(p =>
            `${p.developerId},${p.points},${p.achievements.length}`
        );
        return [headers.join(','), ...rows].join('\n');
    }

    private eventsToCSV(events: RecognitionEvent[]): string {
        const headers = ['id', 'type', 'developerId', 'timestamp'];
        const rows = events.map(e =>
            `${e.id},${e.type},${e.developerId},${e.timestamp.toISOString()}`
        );
        return [headers.join(','), ...rows].join('\n');
    }
}
