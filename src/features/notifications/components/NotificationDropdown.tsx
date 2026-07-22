import { AppLink } from '../../../app/routing/router';
import {
  Dropdown,
  IconButton,
  Skeleton,
  StatusBadge,
} from '../../../components/ui';
import { useNotifications } from '../hooks/use-notifications';
import {
  formatNotificationDate,
  notificationEventLabel,
  notificationStatusLabel,
  notificationStatusTone,
} from '../utils/notification-format';

/** Quantidade exibida no resumo da Topbar. */
const previewLimit = 5;

/**
 * Resumo de notificações na Topbar.
 *
 * Reutiliza o `Dropdown` do Design System, que já trata Escape, clique externo
 * e atributos de menu. Não há contador de não lidas: o contrato não publica
 * marcação de leitura, então o acesso usa apenas o ícone. Também não há polling
 * — a carga acontece na montagem e ao reabrir a página.
 */
export function NotificationDropdown() {
  const { error, isLoading, notifications } = useNotifications(previewLimit);
  const preview = notifications?.slice(0, previewLimit) ?? [];

  return (
    <Dropdown
      label="Notificações recentes"
      trigger={
        <IconButton icon="bell" label="Abrir notificações" />
      }
    >
      <div className="notification-dropdown">
        <p className="notification-dropdown__title">Notificações recentes</p>

        {isLoading ? (
          <div aria-label="Carregando notificações" role="status">
            <span className="sr-only">Carregando notificações</span>
            <Skeleton height="2.5rem" />
            <Skeleton height="2.5rem" />
          </div>
        ) : error ? (
          <p className="notification-dropdown__empty">{error.message}</p>
        ) : preview.length === 0 ? (
          <p className="notification-dropdown__empty">
            Nenhuma notificação registrada.
          </p>
        ) : (
          <ul className="notification-dropdown__list">
            {preview.map((notification) => (
              <li key={notification.id}>
                <span className="notification-dropdown__subject">
                  {notification.subject ??
                    notificationEventLabel(notification.eventType)}
                </span>
                <span className="notification-dropdown__meta">
                  <StatusBadge tone={notificationStatusTone(notification.status)}>
                    {notificationStatusLabel(notification.status)}
                  </StatusBadge>
                  <time dateTime={notification.createdAt}>
                    {formatNotificationDate(notification.createdAt)}
                  </time>
                </span>
              </li>
            ))}
          </ul>
        )}

        <AppLink className="notification-dropdown__link" to="/notifications">
          Ver todas as notificações
        </AppLink>
      </div>
    </Dropdown>
  );
}
