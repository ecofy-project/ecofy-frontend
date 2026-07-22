import {
  Card,
  ErrorState,
  ForbiddenState,
  NotFoundState,
  Skeleton,
} from '../../../components/ui';
import type { ApiError } from '../../../services/errors/api-error';

/**
 * Traduz o `ApiError` normalizado em estado visual. Mock e API produzem o mesmo
 * modelo, então a interface reage de forma idêntica nos dois modos.
 */
export function ImportErrorState({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry: () => void;
}) {
  const action = { actionLabel: 'Tentar novamente', onAction: onRetry };

  return (
    <Card as="section" className="import-state-card">
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

/** Mantém a estrutura da lista durante o carregamento, sem spinner de página. */
export function ImportHistorySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      aria-label="Carregando histórico de importações"
      className="import-history-skeleton"
      role="status"
    >
      <span className="sr-only">Carregando histórico de importações</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton height="3.25rem" key={index} />
      ))}
    </div>
  );
}

export function ImportDetailsSkeleton() {
  return (
    <div
      aria-label="Carregando detalhes da importação"
      className="import-details-skeleton"
      role="status"
    >
      <span className="sr-only">Carregando detalhes da importação</span>
      <Skeleton height="1.5rem" width="14rem" />
      <Skeleton height="5rem" />
      <Skeleton height="3rem" />
    </div>
  );
}
