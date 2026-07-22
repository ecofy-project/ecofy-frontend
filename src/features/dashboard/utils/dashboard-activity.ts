import type { Goal } from '../../goals/types/goal';
import type { Insight } from '../../insights/types/insights';

export type DashboardActivityKind = 'insight' | 'goal';

export type DashboardActivityItem = Readonly<{
  id: string;
  kind: DashboardActivityKind;
  title: string;
  description: string;
  createdAt: string;
}>;

/**
 * Atividade recente derivada apenas de fontes confirmadas.
 *
 * Não existe endpoint de atividade no backend, e criar um seria inventar
 * contrato. A lista é montada a partir do que o próprio bundle do dashboard já
 * publica — insights gerados e metas atualizadas — usando os carimbos de tempo
 * do contrato. O comportamento é idêntico em Mock Mode e API Mode.
 */
export function buildRecentActivity(
  insights: readonly Insight[],
  goals: readonly Goal[],
  limit = 5,
): readonly DashboardActivityItem[] {
  const fromInsights = insights
    .filter((insight): insight is Insight & { createdAt: string } =>
      Boolean(insight.createdAt),
    )
    .map((insight) => ({
      id: `insight-${insight.id}`,
      kind: 'insight' as const,
      title: 'Nova análise registrada',
      description: insight.title,
      createdAt: insight.createdAt,
    }));

  const fromGoals = goals
    .filter((goal): goal is Goal & { updatedAt: string } =>
      Boolean(goal.updatedAt),
    )
    .map((goal) => ({
      id: `goal-${goal.id}`,
      kind: 'goal' as const,
      title: 'Meta atualizada',
      description: goal.name,
      createdAt: goal.updatedAt,
    }));

  return [...fromInsights, ...fromGoals]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt, 'pt-BR'))
    .slice(0, limit);
}
