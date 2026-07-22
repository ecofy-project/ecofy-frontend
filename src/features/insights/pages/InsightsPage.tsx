import { Card, EmptyState, Pagination } from '../../../components/ui';
import { GenerateInsightForm } from '../components/GenerateInsightForm';
import { InsightFilters } from '../components/InsightFilters';
import { InsightList } from '../components/InsightList';
import {
  DegradedNotice,
  InsightsErrorState,
  InsightsSkeleton,
} from '../components/InsightsResourceState';
import { InsightsRebuildPanel } from '../components/InsightsRebuildPanel';
import { useInsightList } from '../hooks/use-insight-list';

/**
 * Listagem, recorte e geração de análises. A página não conhece o modo de
 * execução, não monta requisições e não executa nenhum algoritmo analítico.
 */
export function InsightsPage() {
  const insights = useInsightList();
  const page = insights.insights;
  const hasContent = Boolean(page && page.content.length > 0);

  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <div>
          <span className="demo-eyebrow">LEITURAS AUTOMÁTICAS</span>
          <h1>EcoFy Insights</h1>
          <p>
            Análises geradas pelo serviço de insights a partir das suas
            movimentações.
          </p>
        </div>
      </header>

      <GenerateInsightForm
        error={insights.generateError}
        isGenerating={insights.isGenerating}
        onClearError={insights.clearGenerateError}
        onSubmit={insights.generateInsights}
      />

      <section aria-labelledby="insights-list-heading" className="insights-list">
        <div className="demo-section-heading">
          <div>
            <span className="demo-eyebrow">ANÁLISES REGISTRADAS</span>
            <h2 id="insights-list-heading">Insights disponíveis</h2>
          </div>
          <div className="insights-list__filters">
            <InsightFilters
              disabled={insights.isLoading}
              onChange={insights.changeType}
              type={insights.type}
            />
          </div>
        </div>

        <p aria-live="polite" className="insights-list__status">
          {insights.isRefreshing ? 'Atualizando informações...' : ''}
        </p>

        {insights.isDegraded && hasContent ? (
          <DegradedNotice onRetry={insights.reload} />
        ) : null}

        {insights.isLoading ? (
          <InsightsSkeleton />
        ) : insights.error && !hasContent ? (
          <InsightsErrorState error={insights.error} onRetry={insights.reload} />
        ) : !hasContent ? (
          <Card as="section" className="insights-state-card">
            <EmptyState
              description="Analise um período para registrar as primeiras leituras."
              title={
                insights.type
                  ? 'Nenhuma análise deste tipo'
                  : 'Nenhuma análise registrada'
              }
              {...(insights.type
                ? {
                    actionLabel: 'Limpar recorte',
                    onAction: () => insights.changeType(undefined),
                  }
                : {})}
            />
          </Card>
        ) : (
          <div
            className={`insights-list__results ${
              insights.isRefreshing ? 'insights-list__results--updating' : ''
            }`.trim()}
          >
            <InsightList
              insights={page?.content ?? []}
              label="Análises registradas"
            />
            {page ? (
              <Pagination
                onPageChange={insights.changePage}
                page={page.page}
                totalElements={page.totalElements}
                totalPages={page.totalPages}
              />
            ) : null}
          </div>
        )}
      </section>

      {insights.supportsRebuild ? (
        <InsightsRebuildPanel onFinished={insights.reload} />
      ) : null}
    </div>
  );
}
