import {
  Button,
  Card,
  DegradedState,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  useToast,
} from '../../../components/ui';
import { useInsights } from '../../demo/hooks/use-demo-data';
import { formatDemoDate } from '../../demo/utils/demo-format';

export function InsightsPage() {
  const insights = useInsights();
  const { showToast } = useToast();

  async function handleGenerate() {
    const result = await insights.generateInsight();

    if (result.ok) {
      showToast({
        title: 'Insight gerado',
        message: 'Uma nova leitura demonstrativa foi adicionada.',
        tone: 'success',
      });
    }
  }

  if (insights.isLoading) {
    return <LoadingState label="Carregando insights" />;
  }

  if (insights.error && !insights.data) {
    const State = insights.error.status === 503 ? DegradedState : ErrorState;
    return (
      <State
        actionLabel="Tentar novamente"
        description={insights.error.message}
        onAction={insights.reload}
      />
    );
  }

  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <div>
          <span className="demo-eyebrow">LEITURAS AUTOMÁTICAS</span>
          <h1>EcoFy Insights</h1>
          <p>Sinais simples que transformam números em próximas decisões.</p>
        </div>
        <Button
          leadingIcon="insights"
          loading={insights.isSaving}
          onClick={handleGenerate}
        >
          Gerar insight
        </Button>
      </header>

      {!insights.data?.length ? (
        <Card as="section">
          <EmptyState
            actionLabel="Gerar insight"
            description="Gere uma leitura demonstrativa para visualizar este módulo."
            onAction={handleGenerate}
            title="Nenhum insight disponível"
          />
        </Card>
      ) : (
        <section aria-label="Insights" className="insights-showcase">
          {insights.data.map((insight, index) => (
            <Card
              as="article"
              className={`insight-feature ${index === 0 ? 'insight-feature--primary' : ''}`}
              key={insight.id}
            >
              <span className="insight-feature__icon">
                <Icon name="insights" size={20} />
              </span>
              <div>
                <span className="demo-eyebrow">{insight.periodLabel}</span>
                <h2>{insight.title}</h2>
                <p>{insight.message}</p>
                <time dateTime={insight.createdAt}>
                  Gerado em {formatDemoDate(insight.createdAt)}
                </time>
              </div>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
