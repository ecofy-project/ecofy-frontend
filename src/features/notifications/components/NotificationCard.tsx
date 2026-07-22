import { Button, Icon, StatusBadge, type IconName } from '../../../components/ui';
import type { DomainEventType, Notification } from '../types/notification';
import {
  formatNotificationDate,
  notificationChannelLabel,
  notificationEventLabel,
  notificationStatusLabel,
  notificationStatusTone,
} from '../utils/notification-format';

const eventIcons: Record<DomainEventType, IconName> = {
  BUDGET_ALERT: 'wallet',
  INSIGHT_CREATED: 'insights',
};

type NotificationCardProps = {
  notification: Notification;
  isResending?: boolean;
  onResend?: (notificationId: string) => void;
};

/**
 * Apresenta somente campos publicados por `NotificationResponse`: evento,
 * canal, assunto, corpo, status e datas. O destino (dado pessoal) e o payload
 * bruto não são mapeados e, portanto, não aparecem. O contrato não possui
 * marcação de leitura, prioridade ou categoria, então nada disso é inventado.
 */
export function NotificationCard({
  isResending = false,
  notification,
  onResend,
}: NotificationCardProps) {
  const canResend = onResend && notification.status === 'FAILED';

  return (
    <li className="notification-card">
      <span aria-hidden="true" className="notification-card__icon">
        <Icon name={eventIcons[notification.eventType]} size={19} />
      </span>
      <div className="notification-card__body">
        <div className="notification-card__heading">
          <h3>{notification.subject ?? notificationEventLabel(notification.eventType)}</h3>
          <StatusBadge tone={notificationStatusTone(notification.status)}>
            {notificationStatusLabel(notification.status)}
          </StatusBadge>
        </div>
        {notification.body ? <p>{notification.body}</p> : null}
        <div className="notification-card__meta">
          <span>{notificationEventLabel(notification.eventType)}</span>
          <span>{notificationChannelLabel(notification.channel)}</span>
          {notification.createdAt ? (
            <time dateTime={notification.createdAt}>
              {formatNotificationDate(notification.createdAt)}
            </time>
          ) : null}
          {notification.attemptCount > 1 ? (
            <span>{notification.attemptCount} tentativas</span>
          ) : null}
        </div>
        {canResend ? (
          <Button
            loading={isResending}
            onClick={() => onResend(notification.id)}
            size="sm"
            variant="outline"
          >
            Reenviar
          </Button>
        ) : null}
      </div>
    </li>
  );
}
