import { Card, EmptyState, Skeleton } from '../../../components/ui';
import { BudgetCard } from '../../budgets/components/BudgetCard';
import type { Budget, BudgetConsumption } from '../../budgets/types/budget';

type DashboardBudgetsProps = {
  budgets: readonly Budget[];
  categoryNames: ReadonlyMap<string, string>;
  consumptionByBudget: ReadonlyMap<string, BudgetConsumption>;
  isLoading: boolean;
  isConsumptionLoading: boolean;
  onEdit: (budget: Budget) => void;
};

/**
 * Resumo de orçamentos. Reutiliza integralmente a feature da Etapa 5:
 * o mesmo `BudgetCard`, os mesmos tipos e o mesmo overview. Os dados chegam de
 * duas requisições da feature de budgets — nunca uma por cartão.
 */
export function DashboardBudgets({
  budgets,
  categoryNames,
  consumptionByBudget,
  isConsumptionLoading,
  isLoading,
  onEdit,
}: DashboardBudgetsProps) {
  if (isLoading) {
    return (
      <div
        aria-label="Carregando orçamentos"
        className="demo-card-grid demo-card-grid--budgets"
        role="status"
      >
        <span className="sr-only">Carregando orçamentos</span>
        {Array.from({ length: 3 }, (_, index) => (
          <Card aria-hidden="true" className="budget-card" key={index}>
            <Skeleton height="1.25rem" width="9rem" />
            <Skeleton height="1.5rem" width="70%" />
            <Skeleton height="0.5rem" />
          </Card>
        ))}
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <EmptyState
        description="Defina um limite por categoria para acompanhar seu consumo."
        title="Nenhum orçamento cadastrado"
      />
    );
  }

  return (
    <div className="demo-card-grid demo-card-grid--budgets">
      {budgets.map((budget) => (
        <BudgetCard
          budget={budget}
          categoryName={categoryNames.get(budget.categoryId)}
          consumption={consumptionByBudget.get(budget.id)}
          isConsumptionLoading={isConsumptionLoading}
          key={budget.id}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
