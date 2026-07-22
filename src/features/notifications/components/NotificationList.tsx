import type { Notification } from '../types/notification';
import { NotificationCard } from './NotificationCard';

type NotificationListProps = {
  notifications: readonly Notification[];
  isResending?: boolean;
  onResend?: (notificationId: string) => void;
};

/**
 * Apenas renderiza a coleção recebida, na ordem em que o serviço a devolveu.
 * Não há agrupamento por período: o contrato não garante um recorte confiável
 * para isso.
 */
export function NotificationList({
  isResending,
  notifications,
  onResend,
}: NotificationListProps) {
  return (
    <ol className="notification-list">
      {notifications.map((notification) => (
        <NotificationCard
          isResending={isResending}
          key={notification.id}
          notification={notification}
          {...(onResend ? { onResend } : {})}
        />
      ))}
    </ol>
  );
}
