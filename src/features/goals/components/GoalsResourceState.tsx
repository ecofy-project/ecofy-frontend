import {
  Card,
  ErrorState,
  ForbiddenState,
  NotFoundState,
  Skeleton,
} from '../../../components/ui';
import type { ApiError } from '../../../services/errors/api-error';

/** Traduz o `ApiError` normalizado em estado visual, igual em Mock e API. */
export function GoalsErrorState({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry: () => void;
}) {
  const action = { actionLabel: 'Tentar novamente', onAction: onRetry };

  return (
    <Card as="section" className="goals-state-card">
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

export function GoalsSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div
      aria-label="Carregando metas"
      className="demo-card-grid demo-card-grid--goals"
      role="status"
    >
      <span className="sr-only">Carregando metas</span>
      {Array.from({ length: cards }, (_, index) => (
        <Card aria-hidden="true" className="goal-card" key={index}>
          <Skeleton height="1.25rem" width="9rem" />
          <Skeleton height="1.75rem" width="7rem" />
          <Skeleton height="0.85rem" width="5rem" />
        </Card>
      ))}
    </div>
  );
}
