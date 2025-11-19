/**
 * Feature: dev-performance-tracker, Property 6: Activity data storage round-trip preserves timestamps
 * Validates: Requirements 2.5
 */

import * as fc from 'fast-check';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ActivityModel } from '../schemas';
import { dbConnection } from '../connection';
import { Activity, ActivityType } from '../../types';

describe('Property 6: Activity data storage round-trip preserves timestamps', () => {
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
    await ActivityModel.deleteMany({});
  });

  // Arbitrary for ActivityType
  const activityTypeArb = fc.constantFrom<ActivityType>(
    'commit',
    'pull_request',
    'issue',
    'review'
  );

  // Arbitrary for Activity metadata based on type
  const metadataArb = (type: ActivityType) => {
    switch (type) {
      case 'commit':
        return fc.record({
          commitHash: fc.hexaString({ minLength: 40, maxLength: 40 }),
          linesAdded: fc.nat({ max: 10000 }),
          linesDeleted: fc.nat({ max: 10000 }),
          filesChanged: fc.nat({ max: 100 }),
        });
      case 'pull_request':
        return fc.record({
          prNumber: fc.integer({ min: 1, max: 100000 }),
          linesAdded: fc.nat({ max: 10000 }),
          linesDeleted: fc.nat({ max: 10000 }),
          filesChanged: fc.nat({ max: 100 }),
        });
      case 'issue':
        return fc.record({
          issueNumber: fc.integer({ min: 1, max: 100000 }),
        });
      case 'review':
        return fc.record({
          prNumber: fc.integer({ min: 1, max: 100000 }),
          reviewComments: fc.array(fc.string({ minLength: 1, maxLength: 200 }), {
            minLength: 0,
            maxLength: 10,
          }),
        });
    }
  };

  // Arbitrary for complete Activity
  const activityArb = fc
    .tuple(
      activityTypeArb,
      fc.uuid(),
      fc.uuid(),
      fc.uuid(),
      fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
    )
    .chain(([type, id, developerId, repositoryId, timestamp]) =>
      metadataArb(type).map((metadata) => ({
        id,
        type,
        developerId,
        repositoryId,
        timestamp,
        metadata,
      }))
    );

  it('should preserve timestamps when storing and retrieving activities', async () => {
    await fc.assert(
      fc.asyncProperty(activityArb, async (activity) => {
        // Store the activity
        const activityDoc = new ActivityModel({
          type: activity.type,
          developerId: activity.developerId,
          repositoryId: activity.repositoryId,
          timestamp: activity.timestamp,
          metadata: activity.metadata,
        });

        const saved = await activityDoc.save();

        // Retrieve the activity
        const retrieved = await ActivityModel.findById(saved._id).lean();

        // Verify the activity was retrieved
        expect(retrieved).not.toBeNull();

        if (retrieved) {
          // Check that timestamp is preserved with millisecond precision
          const originalTime = activity.timestamp.getTime();
          const retrievedTime = new Date(retrieved.timestamp).getTime();

          // Timestamps should match exactly
          expect(retrievedTime).toBe(originalTime);

          // Also verify other fields are preserved
          expect(retrieved.type).toBe(activity.type);
          expect(retrieved.developerId).toBe(activity.developerId);
          expect(retrieved.repositoryId).toBe(activity.repositoryId);

          // Verify metadata is preserved
          if (activity.type === 'commit' && activity.metadata.commitHash) {
            expect(retrieved.metadata.commitHash).toBe(activity.metadata.commitHash);
          }
          if (
            (activity.type === 'pull_request' || activity.type === 'review') &&
            activity.metadata.prNumber
          ) {
            expect(retrieved.metadata.prNumber).toBe(activity.metadata.prNumber);
          }
          if (activity.type === 'issue' && activity.metadata.issueNumber) {
            expect(retrieved.metadata.issueNumber).toBe(activity.metadata.issueNumber);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve timestamps across multiple activities', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(activityArb, { minLength: 1, maxLength: 10 }), async (activities) => {
        // Store all activities
        const savedActivities = await Promise.all(
          activities.map((activity) =>
            new ActivityModel({
              type: activity.type,
              developerId: activity.developerId,
              repositoryId: activity.repositoryId,
              timestamp: activity.timestamp,
              metadata: activity.metadata,
            }).save()
          )
        );

        // Retrieve all activities
        const retrievedActivities = await ActivityModel.find({
          _id: { $in: savedActivities.map((a) => a._id) },
        }).lean();

        // Verify all timestamps are preserved
        expect(retrievedActivities.length).toBe(activities.length);

        for (let i = 0; i < activities.length; i++) {
          const original = activities[i];
          const retrieved = retrievedActivities.find(
            (r) => r.developerId === original.developerId && r.type === original.type
          );

          expect(retrieved).toBeDefined();
          if (retrieved) {
            const originalTime = original.timestamp.getTime();
            const retrievedTime = new Date(retrieved.timestamp).getTime();
            expect(retrievedTime).toBe(originalTime);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
