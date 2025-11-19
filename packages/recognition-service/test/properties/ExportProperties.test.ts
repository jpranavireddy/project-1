import { DataExporter } from '../../src/DataExporter';
import { DeveloperProfile } from '../../src/types';
import * as fc from 'fast-check';

describe('Property 28: Data export compatibility', () => {
    test('export generates valid JSON string', () => {
        fc.assert(
            fc.property(fc.string(), fc.integer(), (devId, points) => {
                const exporter = new DataExporter();
                const profile: DeveloperProfile = {
                    developerId: devId,
                    points: points,
                    achievements: [],
                    currentStreaks: {}
                };

                const json = exporter.exportProfile(profile, 'json');
                const parsed = JSON.parse(json);

                return parsed.developerId === devId && parsed.points === points;
            })
        );
    });

    test('export generates valid CSV format', () => {
        fc.assert(
            fc.property(fc.string(), fc.integer(), (devId, points) => {
                const exporter = new DataExporter();
                const profile: DeveloperProfile = {
                    developerId: devId,
                    points: points,
                    achievements: [],
                    currentStreaks: {}
                };

                const csv = exporter.exportProfile(profile, 'csv');
                const lines = csv.split('\n');

                return lines[0] === 'developerId,points,achievementCount' &&
                    lines[1] === `${devId},${points},0`;
            })
        );
    });
});
