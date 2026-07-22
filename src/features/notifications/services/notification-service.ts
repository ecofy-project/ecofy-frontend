import type { NotificationDataSource } from '../data-sources/notification-data-source';
import type {
  NotificationListParams,
  ResendNotificationInput,
  SendNotificationInput,
} from '../types/notification';

export class NotificationService {
  constructor(private readonly dataSource: NotificationDataSource) {}

  listNotifications(params: NotificationListParams) {
    return this.dataSource.listNotifications(params);
  }

  sendNotification(input: SendNotificationInput) {
    return this.dataSource.sendNotification(input);
  }

  resendNotification(input: ResendNotificationInput) {
    return this.dataSource.resendNotification(input);
  }
}
