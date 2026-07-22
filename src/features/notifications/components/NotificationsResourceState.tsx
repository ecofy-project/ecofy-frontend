import {
  Card,
  ErrorState,
  ForbiddenState,
  NotFoundState,
  Skeleton,
} from '../../../components/ui';
import type { ApiError } from '../../../services/errors/api-error';

/** Traduz o `ApiError` normalizado em estado visual, igual em Mock e API. */
export function NotificationsErrorState({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry: () => void;
}) {
  const action = { actionLabel: 'Tentar novamente', onAction: onRetry };

  return (
    <Card as="section" className="notifications-state-card">
      {error.status === 403 ? (
        <ForbiddenState {...action} description={error.message} />
      ) : error.status === 404 ? (
        <NotFoundState {...action} description={error.message} />
      ) : (
        <ErrorState {...action} description={error.message} />
      )}
    </Card>
  );
}

export function NotificationsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div
      aria-label="Carregando notificações"
      className="notifications-skeleton"
      role="status"
    >
      <span className="sr-only">Carregando notificações</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton height="4.5rem" key={index} />
      ))}
    </div>
  );
}
