import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  StatusBadge,
  useToast,
} from '../../../components/ui';
import type { IconName } from '../../../components/ui';
import { useNotifications } from '../../demo/hooks/use-demo-data';
import { formatDemoDate } from '../../demo/utils/demo-format';

const notificationIcons: Record<string, IconName> = {
  budget: 'wallet',
  import: 'imports',
  insight: 'insights',
  goal: 'goal',
};

export function NotificationsPage() {
  const notifications = useNotifications();
  const { showToast } = useToast();
  const unreadCount =
    notifications.data?.filter((notification) => !notification.read).length ?? 0;

  async function handleMarkAllRead() {
    const result = await notifications.markAllRead();

    if (result.ok) {
      showToast({
        title: 'Notificações atualizadas',
        message: 'Tudo foi marcado como lido nesta demonstração.',
        tone: 'success',
      });
    }
  }

  if (notifications.isLoading) {
    return <LoadingState label="Carregando notificações" />;
  }

  if (notifications.error && !notifications.data) {
    return (
      <ErrorState
        actionLabel="Tentar novamente"
        description={notifications.error.message}
        onAction={notifications.reload}
      />
    );
  }

  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <div>
          <span className="demo-eyebrow">CENTRAL DE ATIVIDADE</span>
          <h1>Notificações</h1>
          <p>Alertas de orçamento, importação, metas e novas leituras.</p>
        </div>
        <Button
          disabled={unreadCount === 0}
          loading={notifications.isSaving}
          onClick={handleMarkAllRead}
          variant="outline"
        >
          Marcar tudo como lido
        </Button>
      </header>

      {!notifications.data?.length ? (
        <Card as="section">
          <EmptyState
            description="Novos alertas aparecerão aqui quando houver atividade."
            title="Você está em dia"
          />
        </Card>
      ) : (
        <Card as="section" className="notification-center">
          <div className="notification-center__summary">
            <span className="demo-eyebrow">CAIXA DE ENTRADA</span>
            <StatusBadge tone={unreadCount ? 'info' : 'success'}>
              {unreadCount ? `${unreadCount} não lidas` : 'Tudo lido'}
            </StatusBadge>
          </div>
          <ol className="notification-list">
            {notifications.data.map((notification) => (
              <li
                className={notification.read ? '' : 'notification-list__item--unread'}
                key={notification.id}
              >
                <span className="notification-list__icon">
                  <Icon name={notificationIcons[notification.kind] ?? 'bell'} size={19} />
                </span>
                <div>
                  <div>
                    <h2>{notification.title}</h2>
                    {!notification.read ? <i aria-label="Não lida" /> : null}
                  </div>
                  <p>{notification.message}</p>
                  <time dateTime={notification.createdAt}>
                    {formatDemoDate(notification.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
