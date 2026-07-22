import type {
  Notification,
  NotificationListParams,
  ResendNotificationInput,
  SendNotificationInput,
} from '../types/notification';

/**
 * Contrato único consumido pela feature. Mock e API implementam exatamente esta
 * interface, então nenhuma página conhece o modo de execução.
 *
 * `sendNotification` e `resendNotification` existem porque `POST /notifications`
 * e `POST /notifications/resend` estão confirmados no controller. O envio manual
 * não é exposto na navegação principal: não há área administrativa nem regra de
 * produto que o justifique, então o Data Source fica preparado e a interface
 * oferece apenas o reenvio de uma notificação que falhou.
 */
export interface NotificationDataSource {
  listNotifications(
    params: NotificationListParams,
  ): Promise<readonly Notification[]>;
  sendNotification(input: SendNotificationInput): Promise<Notification>;
  resendNotification(input: ResendNotificationInput): Promise<Notification>;
}
