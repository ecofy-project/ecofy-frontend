import {
  Alert,
  Card,
  DegradedState,
  ErrorState,
  ForbiddenState,
  NotFoundState,
  Skeleton,
} from '../../../components/ui';
import type { ApiError } from '../../../services/errors/api-error';
import { isDegradedError } from '../hooks/insights-errors';

/**
 * Traduz o `ApiError` normalizado em estado visual.
 *
 * O estado degradado é identificado por status e código — nunca pelo texto da
 * mensagem — e nunca é apresentado como conteúdo vazio.
 */
export function InsightsErrorState({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry: () => void;
}) {
  const action = { actionLabel: 'Tentar novamente', onAction: onRetry };

  if (isDegradedError(error)) {
    return (
      <Card as="section" className="insights-state-card">
        <DegradedState
          {...action}
          description="Suas informações continuam disponíveis, mas algumas análises podem estar incompletas."
          title="Algumas fontes de dados estão temporariamente indisponíveis"
        />
      </Card>
    );
  }

  return (
    <Card as="section" className="insights-state-card">
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

/**
 * Aviso usado quando já existem dados carregados: informa a degradação sem
 * substituir o conteúdo em tela.
 */
export function DegradedNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert title="Algumas fontes de dados estão temporariamente indisponíveis" tone="warning">
      <p>
        Suas informações continuam disponíveis, mas algumas análises podem estar
        incompletas.
      </p>
      <button className="link-button" onClick={onRetry} type="button">
        Tentar novamente
      </button>
    </Alert>
  );
}

export function InsightsSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div aria-label="Carregando análises" className="insight-grid" role="status">
      <span className="sr-only">Carregando análises</span>
      {Array.from({ length: cards }, (_, index) => (
        <Card aria-hidden="true" className="insight-card" key={index}>
          <Skeleton circle height="2.25rem" width="2.25rem" />
          <div className="insight-card__body">
            <Skeleton height="0.75rem" width="7rem" />
            <Skeleton height="1.25rem" width="12rem" />
            <Skeleton height="0.9rem" width="100%" />
          </div>
        </Card>
      ))}
    </div>
  );
}
