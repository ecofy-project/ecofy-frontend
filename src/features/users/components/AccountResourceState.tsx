import {
  Card,
  ErrorState,
  ForbiddenState,
  NotFoundState,
  Skeleton,
} from '../../../components/ui';
import type { ApiError } from '../../../services/errors/api-error';

export function AccountResourceError({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry: () => void;
}) {
  const action = { actionLabel: 'Tentar novamente', onAction: onRetry };

  return (
    <Card as="section" className="account-state-card">
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

export function AccountSessionUnavailable() {
  return (
    <Card as="section" className="account-state-card">
      <ErrorState description="Entre novamente para recuperar os dados associados à sua conta." title="Sessão sem usuário associado" />
    </Card>
  );
}

export function AccountPageSkeleton({ cards = 1 }: { cards?: number }) {
  return (
    <div aria-label="Carregando dados da conta" className="account-skeleton" role="status">
      <span className="sr-only">Carregando dados da conta</span>
      <div className="account-skeleton__heading">
        <Skeleton height="0.75rem" width="8rem" />
        <Skeleton height="2rem" width="15rem" />
        <Skeleton height="1rem" width="min(100%, 32rem)" />
      </div>
      <div className="account-skeleton__cards">
        {Array.from({ length: cards }, (_, index) => (
          <Card aria-hidden="true" className="account-skeleton__card" key={index}>
            <Skeleton circle height="3rem" width="3rem" />
            <Skeleton height="1.25rem" width="45%" />
            <Skeleton height="1rem" width="75%" />
            <Skeleton height="1rem" width="58%" />
          </Card>
        ))}
      </div>
    </div>
  );
}
