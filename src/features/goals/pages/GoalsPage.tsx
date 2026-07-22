import { useState } from 'react';
import { useSession } from '../../../app/providers/SessionProvider';
import { Button, Card, EmptyState } from '../../../components/ui';
import { usePreferences } from '../../users/hooks/use-preferences';
import { GoalCard } from '../components/GoalCard';
import { GoalForm } from '../components/GoalForm';
import {
  GoalsErrorState,
  GoalsSkeleton,
} from '../components/GoalsResourceState';
import { useGoals } from '../hooks/use-goals';
import type { Goal } from '../types/goal';

const fallbackCurrency = 'BRL';

/**
 * Metas do usuário. O progresso não é apresentado porque o contrato publica
 * apenas o valor alvo — nada é derivado de transações, orçamentos ou métricas.
 */
export function GoalsPage() {
  const { currentUser } = useSession();
  const goals = useGoals();
  const preferences = usePreferences(currentUser?.id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const defaultCurrency =
    preferences.data?.DEFAULT_CURRENCY ??
    goals.goals?.[0]?.currency ??
    fallbackCurrency;

  function openCreate() {
    goals.clearSaveError();
    setEditingGoal(null);
    setIsFormOpen(true);
  }

  function openEdit(goal: Goal) {
    goals.clearSaveError();
    setEditingGoal(goal);
    setIsFormOpen(true);
  }

  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <div>
          <span className="demo-eyebrow">PLANOS COM PROPÓSITO</span>
          <h1>Metas</h1>
          <p>Objetivos registrados com valor alvo, moeda e status.</p>
        </div>
        <Button leadingIcon="goal" onClick={openCreate}>
          Nova meta
        </Button>
      </header>

      <p aria-live="polite" className="goals-status">
        {goals.isRefreshing ? 'Atualizando informações...' : ''}
      </p>

      {goals.isLoading ? (
        <GoalsSkeleton />
      ) : goals.error ? (
        <GoalsErrorState error={goals.error} onRetry={goals.reload} />
      ) : !goals.goals || goals.goals.length === 0 ? (
        <Card as="section" className="goals-state-card">
          <EmptyState
            actionLabel="Criar meta"
            description="Defina um objetivo com valor alvo para começar seu planejamento."
            onAction={openCreate}
            title="Nenhuma meta criada"
          />
        </Card>
      ) : (
        <section
          aria-label="Metas cadastradas"
          className="demo-card-grid demo-card-grid--goals"
        >
          {goals.goals.map((goal) => (
            <GoalCard goal={goal} key={goal.id} onEdit={openEdit} />
          ))}
        </section>
      )}

      <GoalForm
        defaultCurrency={defaultCurrency}
        error={goals.saveError}
        goal={editingGoal}
        isSaving={goals.isSaving}
        onClearError={goals.clearSaveError}
        onClose={() => setIsFormOpen(false)}
        onCreate={goals.createGoal}
        onUpdate={goals.updateGoal}
        open={isFormOpen}
      />
    </div>
  );
}
