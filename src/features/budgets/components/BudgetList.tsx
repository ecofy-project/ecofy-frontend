import type { Budget, BudgetConsumption } from '../types/budget';
import { BudgetCard } from './BudgetCard';

type BudgetListProps = {
  budgets: readonly Budget[];
  /** Mapa preparado pela página: evita uma requisição por card. */
  categoryNames: ReadonlyMap<string, string>;
  consumptionByBudget: ReadonlyMap<string, BudgetConsumption>;
  isConsumptionLoading?: boolean;
  onEdit: (budget: Budget) => void;
};

/**
 * Apenas renderiza a coleção recebida. Não busca dados, não conhece o modo de
 * execução e não calcula valores financeiros.
 */
export function BudgetList({
  budgets,
  categoryNames,
  consumptionByBudget,
  isConsumptionLoading = false,
  onEdit,
}: BudgetListProps) {
  return (
    <section
      aria-label="Orçamentos cadastrados"
      className="demo-card-grid demo-card-grid--budgets"
    >
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
    </section>
  );
}
