import { Notification, RecognitionEvent } from './types';
import { v4 as uuidv4 } from 'uuid';

export class NotificationService {
    private notifications: Notification[] = [];

    public async sendRecognitionNotification(event: RecognitionEvent): Promise<Notification> {
        const notification: Notification = {
            id: uuidv4(),
            recipientId: event.developerId,
            type: 'recognition',
            title: this.getTitleForEvent(event),
            message: this.getMessageForEvent(event),
            data: event,
            read: false,
            createdAt: new Date()
        };

        // In a real system, this would push to a message queue or websocket
        this.notifications.push(notification);
        console.log(`Notification sent to ${event.developerId}: ${notification.title}`);

        return notification;
    }

    public getUnreadNotifications(developerId: string): Notification[] {
        return this.notifications.filter(n => n.recipientId === developerId && !n.read);
    }

    public markAsRead(notificationId: string): void {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
        }
    }

    private getTitleForEvent(event: RecognitionEvent): string {
        switch (event.type) {
            case 'achievement_unlocked':
                return 'Achievement Unlocked!';
            case 'tier_upgrade':
                return 'Level Up!';
            case 'streak_milestone':
                return 'Streak Milestone Reached!';
            default:
                return 'New Recognition';
        }
    }

    private getMessageForEvent(event: RecognitionEvent): string {
        // In a real app, we'd look up the achievement name
        if (event.type === 'achievement_unlocked') {
            return `You've unlocked a new achievement!`;
        }
        return 'Congratulations on your recent progress!';
    }
}
