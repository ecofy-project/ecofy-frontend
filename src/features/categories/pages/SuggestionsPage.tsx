import { useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  StatusBadge,
} from '../../../components/ui';
import {
  CategorizationErrorState,
  InlineListSkeleton,
} from '../components/CategorizationResourceState';
import { useCategories } from '../hooks/use-categories';
import { useManualCategorization } from '../hooks/use-manual-categorization';
import { useSuggestionLookup } from '../hooks/use-suggestion-lookup';
import { suggestionStatusLabels } from '../utils/categorization-labels';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * O gateway publica somente a consulta de sugestão por transação. Não existe
 * listagem de sugestões, portanto a página é uma busca sob demanda.
 */
export function SuggestionsPage() {
  const categories = useCategories();
  const { transactions } = useManualCategorization();
  const lookup = useSuggestionLookup();
  const [transactionId, setTransactionId] = useState('');
  const [inputError, setInputError] = useState('');

  const categoryNames = new Map(
    (categories.categories ?? []).map((category) => [
      category.id,
      category.name,
    ]),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = transactionId.trim();
    const invalid = transactions
      ? !normalized
      : !uuidPattern.test(normalized);

    setInputError(
      invalid
        ? transactions
          ? 'Selecione uma transação.'
          : 'Informe o identificador da transação no formato UUID.'
        : '',
    );

    if (invalid) {
      return;
    }

    void lookup.search(normalized);
  }

  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <div>
          <span className="demo-eyebrow">SUGESTÕES</span>
          <h1>Sugestões de categorização</h1>
          <p>
            Consulte a sugestão mais recente registrada pelo serviço para uma
            transação.
          </p>
        </div>
      </header>

      <Card as="section" className="categorization-panel">
        <form className="categorization-form" onSubmit={handleSubmit}>
          {transactions ? (
            <Select
              error={inputError}
              label="Transação"
              onChange={(event) => setTransactionId(event.currentTarget.value)}
              options={transactions.map((transaction) => ({
                value: transaction.id,
                label: transaction.description,
              }))}
              placeholder="Selecione uma transação"
              value={transactionId}
            />
          ) : (
            <Input
              error={inputError}
              helperText="Este ambiente não publica listagem de transações; informe o identificador da transação."
              label="Identificador da transação"
              onChange={(event) => setTransactionId(event.currentTarget.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              value={transactionId}
            />
          )}
          <div className="categorization-form__actions">
            <Button loading={lookup.isLoading} type="submit">
              Buscar sugestão
            </Button>
          </div>
        </form>
      </Card>

      <section aria-live="polite" className="categorization-panel-area">
        {lookup.isLoading ? (
          <InlineListSkeleton rows={2} />
        ) : lookup.error ? (
          <CategorizationErrorState
            error={lookup.error}
            onRetry={() => {
              if (lookup.transactionId) {
                void lookup.search(lookup.transactionId);
              }
            }}
          />
        ) : lookup.suggestion ? (
          <Card as="article" className="suggestion-card">
            <div className="suggestion-card__heading">
              <h2>Sugestão registrada</h2>
              <StatusBadge
                tone={
                  lookup.suggestion.status === 'UNMATCHED' ||
                  lookup.suggestion.status === 'REJECTED'
                    ? 'neutral'
                    : 'success'
                }
              >
                {suggestionStatusLabels[lookup.suggestion.status]}
              </StatusBadge>
            </div>
            <dl className="suggestion-card__details">
              <div>
                <dt>Categoria sugerida</dt>
                <dd>
                  {lookup.suggestion.categoryId
                    ? (categoryNames.get(lookup.suggestion.categoryId) ??
                      'Categoria não listada')
                    : 'Sem categoria associada'}
                </dd>
              </div>
              <div>
                <dt>Pontuação</dt>
                <dd className="numeric">{lookup.suggestion.score}</dd>
              </div>
              {lookup.suggestion.rationale ? (
                <div>
                  <dt>Motivo</dt>
                  <dd>{lookup.suggestion.rationale}</dd>
                </div>
              ) : null}
            </dl>
          </Card>
        ) : lookup.hasSearched ? (
          <Card as="section" className="categorization-state-card">
            <EmptyState
              description="Esta transação ainda não possui sugestão registrada."
              title="Nenhuma sugestão encontrada"
            />
          </Card>
        ) : (
          <Card as="section" className="categorization-state-card">
            <EmptyState
              description="Informe uma transação para consultar a sugestão registrada pelo serviço."
              title="Nenhuma consulta realizada"
            />
          </Card>
        )}
      </section>
    </div>
  );
}
