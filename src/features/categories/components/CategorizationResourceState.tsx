import {
  Card,
  ErrorState,
  ForbiddenState,
  NotFoundState,
  Skeleton,
} from '../../../components/ui';
import type { ApiError } from '../../../services/errors/api-error';

/**
 * Traduz o `ApiError` normalizado em um estado visual. Nenhuma página lê a
 * resposta bruta do backend.
 */
export function CategorizationErrorState({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry: () => void;
}) {
  const action = { actionLabel: 'Tentar novamente', onAction: onRetry };

  return (
    <Card as="section" className="categorization-state-card">
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

export function CategoryListSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div
      aria-label="Carregando categorias"
      className="demo-card-grid demo-card-grid--categories"
      role="status"
    >
      <span className="sr-only">Carregando categorias</span>
      {Array.from({ length: cards }, (_, index) => (
        <Card aria-hidden="true" className="category-card" key={index}>
          <Skeleton height="3.75rem" width="0.45rem" />
          <div className="category-card__copy">
            <Skeleton height="1.25rem" width="8rem" />
            <Skeleton height="0.85rem" width="5rem" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function InlineListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-label="Carregando conteúdo" className="categorization-skeleton-list" role="status">
      <span className="sr-only">Carregando conteúdo</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton height="3rem" key={index} />
      ))}
    </div>
  );
}
