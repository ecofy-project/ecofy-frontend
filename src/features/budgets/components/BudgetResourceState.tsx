import {
  Card,
  ErrorState,
  ForbiddenState,
  NotFoundState,
  Skeleton,
} from '../../../components/ui';
import type { ApiError } from '../../../services/errors/api-error';

/**
 * Traduz o `ApiError` normalizado em estado visual. Nenhuma página lê a
 * resposta bruta do backend, e nenhum detalhe interno é exibido.
 */
export function BudgetErrorState({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry: () => void;
}) {
  const action = { actionLabel: 'Tentar novamente', onAction: onRetry };

  return (
    <Card as="section" className="budget-state-card">
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

export function BudgetListSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div
      aria-label="Carregando orçamentos"
      className="demo-card-grid demo-card-grid--budgets"
      role="status"
    >
      <span className="sr-only">Carregando orçamentos</span>
      {Array.from({ length: cards }, (_, index) => (
        <Card aria-hidden="true" className="budget-card" key={index}>
          <div className="budget-card__heading">
            <div className="budget-card__identity">
              <Skeleton height="0.75rem" width="5rem" />
              <Skeleton height="1.25rem" width="9rem" />
              <Skeleton height="0.85rem" width="11rem" />
            </div>
            <Skeleton height="1.5rem" width="4.5rem" />
          </div>
          <Skeleton height="1.25rem" width="70%" />
          <Skeleton height="0.5rem" />
        </Card>
      ))}
    </div>
  );
}
