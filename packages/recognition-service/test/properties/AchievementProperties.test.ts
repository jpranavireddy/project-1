import { AchievementEngine } from '../../src/AchievementEngine';
import { Achievement, DeveloperProfile } from '../../src/types';
import * as fc from 'fast-check';

describe('Property 25: Achievement threshold detection', () => {
    test('crossing threshold triggers achievement unlock', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 1000 }), (threshold) => {
                const engine = new AchievementEngine();
                const achievement: Achievement = {
                    id: 'test-ach',
                    name: 'Test',
                    description: 'Test',
                    tier: 'bronze',
                    points: 10,
                    criteria: {
                        type: 'metric_threshold',
                        metric: 'commits',
                        threshold: threshold
                    }
                };
                engine.registerAchievement(achievement);

                const profile: DeveloperProfile = {
                    developerId: 'dev1',
                    points: 0,
                    achievements: [],
                    currentStreaks: {}
                };

                // Activity matching threshold
                const unlocks = engine.evaluate('dev1', profile, { commits: threshold });
                return unlocks.length === 1 && unlocks[0].achievementId === 'test-ach';
            })
        );
    });
});

describe('Property 27: Custom achievement criteria', () => {
    test('custom evaluator is applied correctly', () => {
        fc.assert(
            fc.property(fc.integer(), (value) => {
                const engine = new AchievementEngine();
                const achievement: Achievement = {
                    id: 'custom-ach',
                    name: 'Custom',
                    description: 'Custom',
                    tier: 'gold',
                    points: 50,
                    criteria: {
                        type: 'custom',
                        customEvaluator: (data) => data.value % 2 === 0 // Unlock on even numbers
                    }
                };
                engine.registerAchievement(achievement);

                const profile: DeveloperProfile = {
                    developerId: 'dev1',
                    points: 0,
                    achievements: [],
                    currentStreaks: {}
                };

                const unlocks = engine.evaluate('dev1', profile, { value });

                if (value % 2 === 0) {
                    return unlocks.length === 1;
                } else {
                    return unlocks.length === 0;
                }
            })
        );
    });
});
