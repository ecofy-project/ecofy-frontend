import { useSession } from '../../../app/providers/SessionProvider';
import {
  Card,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  ProgressBar,
  ProgressRing,
  StatusBadge,
} from '../../../components/ui';
import type { BadgeTone, IconName } from '../../../components/ui';
import { useDashboard } from '../../demo/hooks/use-demo-data';
import type { DemoBudget, DemoMoney } from '../../demo/types/demo';
import { formatCurrency, fromCents } from '../../../services/money/money';

function formatMoney(money: DemoMoney) {
  return formatCurrency(fromCents(money.cents, money.currency));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function percentage(spent: DemoMoney, limit: DemoMoney) {
  return limit.cents > 0 ? Math.round((spent.cents / limit.cents) * 100) : 0;
}

function budgetTone(budget: DemoBudget): BadgeTone {
  const used = percentage(budget.spent, budget.limit);

  if (budget.status === 'PAUSED') return 'paused';
  if (used > 100) return 'danger';
  if (used >= 80) return 'near-limit';
  return 'success';
}

const activityIcons: Record<string, IconName> = {
  budget: 'wallet',
  import: 'imports',
  insight: 'insights',
  goal: 'goal',
};

function SectionHeading({
  description,
  title,
}: {
  description?: string;
  title: string;
}) {
  return (
    <div className="dashboard-section__heading">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { currentUser } = useSession();
  const dashboard = useDashboard();
  const firstName =
    currentUser?.fullName?.trim().split(/\s+/)[0] ||
    currentUser?.email?.split('@')[0] ||
    'você';

  if (dashboard.isLoading) {
    return <LoadingState label="Carregando resumo financeiro" />;
  }

  if (dashboard.error && !dashboard.data) {
    return (
      <Card as="section">
        <ErrorState
          actionLabel="Tentar novamente"
          description={dashboard.error.message}
          onAction={dashboard.reload}
        />
      </Card>
    );
  }

  if (!dashboard.data || dashboard.data.metrics.length === 0) {
    return (
      <Card as="section">
        <EmptyState
          description="Importe suas primeiras transações para visualizar gastos, orçamentos e insights."
          title="Seu resumo financeiro começa aqui"
        />
      </Card>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-welcome">
        <div>
          <span className="dashboard-welcome__eyebrow">
            VISÃO FINANCEIRA · {dashboard.data.periodLabel.toUpperCase()}
          </span>
          <h1>Olá, {firstName}. Seu mês está no caminho certo.</h1>
          <p>Veja o que merece atenção agora e avance com tranquilidade.</p>
        </div>
        <StatusBadge tone="success">Ritmo saudável</StatusBadge>
      </header>

      <section aria-label="Métricas do período" className="dashboard-metrics demo-metrics">
        {dashboard.data.metrics.map((metric) => {
          const visual =
            metric.key === 'TOTAL_SPENT'
              ? { icon: 'wallet' as IconName, modifier: '' }
              : metric.key === 'INCOME'
                ? { icon: 'dashboard' as IconName, modifier: 'dashboard-metric__icon--teal' }
                : { icon: 'insights' as IconName, modifier: 'dashboard-metric__icon--violet' };
          return (
            <Card as="article" className="dashboard-metric" key={metric.key}>
              <span className={`dashboard-metric__icon ${visual.modifier}`.trim()}>
                <Icon name={visual.icon} size={18} />
              </span>
              <span className="dashboard-metric__label">{metric.label}</span>
              <strong className="dashboard-metric__value">
                {'amount' in metric
                  ? formatMoney(metric.amount)
                  : `${metric.percentage.toLocaleString('pt-BR')}%`}
              </strong>
              <span className="dashboard-metric__helper">{metric.helperText}</span>
            </Card>
          );
        })}
      </section>

      <section className="dashboard-section" aria-labelledby="budgets-heading">
        <div id="budgets-heading">
          <SectionHeading
            description="Valores reais da demonstração comparados aos limites definidos."
            title="Orçamentos principais"
          />
        </div>
        <div className="budget-list">
          {dashboard.data.budgets.slice(0, 4).map((budget) => {
            const used = percentage(budget.spent, budget.limit);
            const tone = budgetTone(budget);
            return (
              <article className="budget-row" key={budget.id}>
                <div className="budget-row__top">
                  <div>
                    <h3>{budget.categoryName}</h3>
                    <p className="numeric">
                      {formatMoney(budget.spent)} de {formatMoney(budget.limit)}
                    </p>
                  </div>
                  <StatusBadge tone={tone}>
                    {budget.status === 'PAUSED'
                      ? 'Pausado'
                      : used > 100
                        ? 'Acima do limite'
                        : 'Ativo'}
                  </StatusBadge>
                </div>
                <ProgressBar
                  label={`${budget.categoryName}: ${used}% do orçamento utilizado`}
                  tone={tone}
                  value={used}
                />
                <span className="budget-row__percent numeric">{used}% utilizado</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="insights-heading">
        <div id="insights-heading">
          <SectionHeading
            description="Leituras automáticas baseadas no mesmo cenário financeiro."
            title="EcoFy Insights"
          />
        </div>
        <div className="insight-grid">
          {dashboard.data.insights.map((insight) => (
            <article className="insight-card" key={insight.id}>
              <span className="insight-card__icon">
                <Icon name="insights" size={19} />
              </span>
              <span className="insight-card__period">{insight.periodLabel}</span>
              <h3>{insight.title}</h3>
              <p>{insight.message}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-split">
        <Card as="section" className="dashboard-panel">
          <SectionHeading
            description="Objetivos construídos com valores explícitos."
            title="Metas"
          />
          <div className="goal-list">
            {dashboard.data.goals.map((goal) => {
              const progress = Math.round(
                (goal.saved.cents / goal.target.cents) * 100,
              );
              return (
                <article className="goal-row" key={goal.id}>
                  <ProgressRing label={goal.name} tone="success" value={progress} />
                  <div className="goal-row__copy">
                    <h3>{goal.name}</h3>
                    <p className="numeric">
                      {formatMoney(goal.saved)} de {formatMoney(goal.target)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </Card>

        <Card as="section" className="dashboard-panel">
          <SectionHeading
            description="Mudanças recentes nesta demonstração."
            title="Atividade recente"
          />
          <ol className="activity-list">
            {dashboard.data.activity.map((activity) => (
              <li key={activity.id}>
                <span className="activity-list__icon">
                  <Icon name={activityIcons[activity.kind] ?? 'info'} size={17} />
                </span>
                <div>
                  <h3>{activity.title}</h3>
                  <p>{activity.description}</p>
                  <time dateTime={activity.createdAt}>
                    {formatDate(activity.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </section>
    </div>
  );
}
