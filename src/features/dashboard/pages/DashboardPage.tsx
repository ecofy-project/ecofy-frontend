import { useMemo } from 'react';
import { useSession } from '../../../app/providers/SessionProvider';
import { navigate } from '../../../app/routing/router';
import { Card } from '../../../components/ui';
import { useBudgetOverview } from '../../budgets/hooks/use-budget-overview';
import { useBudgets } from '../../budgets/hooks/use-budgets';
import { useCategories } from '../../categories/hooks/use-categories';
import { GoalCard } from '../../goals/components/GoalCard';
import { InsightList } from '../../insights/components/InsightList';
import {
  DegradedNotice,
  InsightsErrorState,
  InsightsSkeleton,
} from '../../insights/components/InsightsResourceState';
import { useInsightsBundle } from '../../insights/hooks/use-insights-bundle';
import { DashboardBudgets } from '../components/DashboardBudgets';
import { DashboardMetrics } from '../components/DashboardMetrics';
import { DashboardSection } from '../components/DashboardSection';
import { RecentActivity } from '../components/RecentActivity';
import { buildRecentActivity } from '../utils/dashboard-activity';

const budgetsPreviewLimit = 3;
const insightsPreviewLimit = 3;
const goalsPreviewLimit = 3;

/**
 * Visão analítica consolidada.
 *
 * Todos os números vêm prontos dos Data Sources: nenhuma métrica, consumo ou
 * progresso é calculado aqui. Os orçamentos reutilizam integralmente a feature
 * da Etapa 5.
 */
export function DashboardPage() {
  const { currentUser } = useSession();
  const dashboard = useInsightsBundle();
  const budgets = useBudgets();
  const overview = useBudgetOverview();
  const categories = useCategories();

  const firstName =
    currentUser?.fullName?.trim().split(/\s+/)[0] ||
    currentUser?.email?.split('@')[0] ||
    'você';

  const categoryNames = useMemo(() => {
    const names = new Map<string, string>();
    (categories.categories ?? []).forEach((category) =>
      names.set(category.id, category.name),
    );
    return names;
  }, [categories.categories]);

  const bundle = dashboard.bundle;
  const activity = useMemo(
    () => buildRecentActivity(bundle?.insights ?? [], bundle?.goals ?? []),
    [bundle],
  );
  const hasBundle = bundle !== null;

  return (
    <div className="dashboard-page">
      <header className="dashboard-welcome">
        <div>
          <span className="dashboard-welcome__eyebrow">VISÃO FINANCEIRA</span>
          <h1>Olá, {firstName}</h1>
          <p>
            Seu resumo financeiro, orçamentos, análises e metas em um só lugar.
          </p>
        </div>
      </header>

      <p aria-live="polite" className="dashboard-status">
        {dashboard.isRefreshing ? 'Atualizando informações...' : ''}
      </p>

      {dashboard.isDegraded && hasBundle ? (
        <DegradedNotice onRetry={dashboard.reload} />
      ) : null}

      {dashboard.error && !hasBundle ? (
        <InsightsErrorState error={dashboard.error} onRetry={dashboard.reload} />
      ) : (
        <DashboardMetrics metrics={bundle?.metrics ?? []} />
      )}

      <DashboardSection
        actionLabel="Ver orçamentos"
        actionTo="/budgets"
        description="Limites e consumo publicados pelo serviço de orçamentos."
        title="Orçamentos"
      >
        <DashboardBudgets
          budgets={(budgets.budgets?.content ?? []).slice(
            0,
            budgetsPreviewLimit,
          )}
          categoryNames={categoryNames}
          consumptionByBudget={overview.consumptionByBudget}
          isConsumptionLoading={overview.isLoading}
          isLoading={budgets.isLoading}
          onEdit={() => navigate('/budgets')}
        />
      </DashboardSection>

      <DashboardSection
        actionLabel="Ver todas as análises"
        actionTo="/insights"
        description="Leituras registradas pelo serviço de insights."
        title="EcoFy Insights"
      >
        {dashboard.isLoading ? (
          <InsightsSkeleton cards={insightsPreviewLimit} />
        ) : (
          <InsightList
            insights={(bundle?.insights ?? []).slice(0, insightsPreviewLimit)}
            label="Análises recentes"
          />
        )}
      </DashboardSection>

      <div className="dashboard-split">
        <Card as="section" className="dashboard-panel">
          <DashboardSection
            actionLabel="Ver todas as metas"
            actionTo="/goals"
            description="Objetivos registrados com valor alvo e status."
            title="Metas"
          >
            <div className="dashboard-goal-list">
              {(bundle?.goals ?? []).slice(0, goalsPreviewLimit).map((goal) => (
                <GoalCard goal={goal} key={goal.id} />
              ))}
            </div>
          </DashboardSection>
        </Card>

        <Card as="section" className="dashboard-panel">
          <DashboardSection
            description="Análises geradas e metas atualizadas recentemente."
            title="Atividade recente"
          >
            <RecentActivity items={activity} />
          </DashboardSection>
        </Card>
      </div>
    </div>
  );
}
