import { Button, Card, ProgressBar, Skeleton, StatusBadge } from '../../../components/ui';
import type { Budget, BudgetConsumption } from '../types/budget';
import {
  budgetPeriodTypeLabel,
  budgetStatusLabel,
  budgetStatusTone,
  formatPeriodRange,
} from '../utils/budget-labels';
import {
  formatBudgetAmount,
  formatPercentage,
} from '../utils/budget-money';

type BudgetCardProps = {
  budget: Budget;
  /** Nome resolvido pela feature de categorização; nunca o UUID técnico. */
  categoryName?: string;
  consumption?: BudgetConsumption;
  isConsumptionLoading?: boolean;
  onEdit: (budget: Budget) => void;
};

/**
 * Apresenta apenas os campos publicados pelo contrato. O consumo e o percentual
 * vêm prontos do overview: nada é recalculado aqui. O identificador do
 * orçamento e a `version` permanecem internos e não são exibidos.
 */
export function BudgetCard({
  budget,
  categoryName,
  consumption,
  isConsumptionLoading = false,
  onEdit,
}: BudgetCardProps) {
  const title = categoryName ?? 'Categoria não identificada';
  const limit = formatBudgetAmount(budget.limitAmount, budget.currency);
  const tone = budgetStatusTone(budget.status);
  const percentage = consumption?.percentage;
  /**
   * O par consumido/limite vem do próprio registro de consumo, mantendo-se
   * coerente com o percentual publicado. O limite do orçamento é apresentado
   * separadamente porque pode ter mudado antes do recálculo do backend.
   */
  const consumedLabel = consumption
    ? `${formatBudgetAmount(consumption.consumedAmount, budget.currency)} de ${formatBudgetAmount(consumption.limitAmount, budget.currency)}`
    : limit;
  const isConsumptionOutdated =
    consumption !== undefined &&
    consumption.limitAmount !== budget.limitAmount;

  return (
    <Card as="article" className="budget-card">
      <div className="budget-card__heading">
        <div className="budget-card__identity">
          <span className="budget-eyebrow">
            {budgetPeriodTypeLabel(budget.periodType)}
          </span>
          <h3>{title}</h3>
          <p className="budget-card__period">
            {formatPeriodRange(budget.periodStart, budget.periodEnd)}
          </p>
        </div>
        <StatusBadge tone={tone}>{budgetStatusLabel(budget.status)}</StatusBadge>
      </div>

      <div className="budget-card__amounts">
        <strong className="numeric">{consumedLabel}</strong>
        <span className="budget-card__limit">Limite de {limit}</span>
      </div>

      {isConsumptionLoading && percentage === undefined ? (
        <Skeleton height="0.5rem" />
      ) : percentage === undefined ? (
        <p className="budget-card__consumption-missing">
          Consumo ainda não informado para este período.
        </p>
      ) : (
        <div className="budget-card__progress">
          <ProgressBar
            label={`${title}: consumo do orçamento`}
            tone={tone}
            value={percentage}
            valueText={`${formatPercentage(percentage)} utilizado`}
          />
          <p className="budget-card__percentage numeric">
            {formatPercentage(percentage)} utilizado
          </p>
          {percentage > 100 ? (
            <p className="budget-card__over-limit">
              Consumo acima do limite informado.
            </p>
          ) : null}
          {isConsumptionOutdated ? (
            <p className="budget-card__consumption-missing">
              O consumo será recalculado pelo serviço com o novo limite.
            </p>
          ) : null}
        </div>
      )}

      <Button
        onClick={() => onEdit(budget)}
        size="sm"
        variant="ghost"
      >
        Editar orçamento
      </Button>
    </Card>
  );
}
