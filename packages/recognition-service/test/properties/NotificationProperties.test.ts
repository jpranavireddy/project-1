import { NotificationService } from '../../src/NotificationService';
import { RecognitionEvent } from '../../src/types';
import * as fc from 'fast-check';

describe('Property 26: Recognition notifications', () => {
    test('recognition events trigger notifications', async () => {
        await fc.assert(
            fc.asyncProperty(fc.string(), fc.string(), async (devId, achId) => {
                const service = new NotificationService();
                const event: RecognitionEvent = {
                    id: 'evt-1',
                    type: 'achievement_unlocked',
                    developerId: devId,
                    achievementId: achId,
                    timestamp: new Date(),
                    data: {}
                };

                const notification = await service.sendRecognitionNotification(event);

                return notification.recipientId === devId &&
                    notification.type === 'recognition' &&
                    !notification.read;
            })
        );
    });
});
