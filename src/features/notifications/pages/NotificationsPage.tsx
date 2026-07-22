import { Alert, Button, Card, EmptyState, useToast } from '../../../components/ui';
import { NotificationList } from '../components/NotificationList';
import {
  NotificationsErrorState,
  NotificationsSkeleton,
} from '../components/NotificationsResourceState';
import { useNotifications } from '../hooks/use-notifications';
import { defaultNotificationLimit } from '../types/notification';

/**
 * Central de notificações. A página não conhece o modo de execução e apresenta
 * apenas o que o serviço devolve, respeitando o limite do contrato.
 */
export function NotificationsPage() {
  const notifications = useNotifications();
  const { showToast } = useToast();
  const items = notifications.notifications;

  async function handleResend(notificationId: string) {
    const result = await notifications.resendNotification(notificationId);

    if (result.ok) {
      showToast({
        title: 'Reenvio solicitado',
        message: 'O serviço de notificações processará o reenvio.',
        tone: 'success',
      });
    }
  }

  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <div>
          <span className="demo-eyebrow">CENTRAL DE ATIVIDADE</span>
          <h1>Notificações</h1>
          <p>
            Alertas de orçamento e novas análises enviados pelo serviço de
            notificações.
          </p>
        </div>
        <Button
          loading={notifications.isRefreshing}
          onClick={notifications.reload}
          variant="outline"
        >
          Atualizar
        </Button>
      </header>

      <p aria-live="polite" className="notifications-status">
        {notifications.isRefreshing ? 'Atualizando informações...' : ''}
      </p>

      {notifications.resendError ? (
        <Alert
          onDismiss={notifications.clearResendError}
          title="Não foi possível solicitar o reenvio"
          tone="danger"
        >
          {notifications.resendError.message}
        </Alert>
      ) : null}

      {notifications.isLoading ? (
        <NotificationsSkeleton />
      ) : notifications.error ? (
        <NotificationsErrorState
          error={notifications.error}
          onRetry={notifications.reload}
        />
      ) : !items || items.length === 0 ? (
        <Card as="section" className="notifications-state-card">
          <EmptyState
            description="Novos alertas aparecerão aqui quando houver atividade na sua conta."
            title="Nenhuma notificação registrada"
          />
        </Card>
      ) : (
        <Card as="section" className="notification-center">
          <NotificationList
            isResending={notifications.isResending}
            notifications={items}
            onResend={handleResend}
          />
          <p className="notifications-limit-note">
            A lista apresenta as {defaultNotificationLimit} notificações mais
            recentes.
          </p>
        </Card>
      )}
    </div>
  );
}
