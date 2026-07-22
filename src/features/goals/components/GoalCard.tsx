import { Button, Card, StatusBadge } from '../../../components/ui';
import type { Goal } from '../types/goal';
import {
  formatGoalTarget,
  goalStatusLabel,
  goalStatusTone,
} from '../utils/goal-format';

type GoalCardProps = {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
};

/**
 * Apresenta apenas os campos publicados por `GoalResponse`: nome, valor alvo,
 * moeda e status. O contrato não publica valor acumulado nem percentual, então
 * não há barra de progresso — nada é calculado a partir de transações,
 * orçamentos ou métricas.
 */
export function GoalCard({ goal, onEdit }: GoalCardProps) {
  return (
    <Card as="article" className="goal-card">
      <div className="goal-card__heading">
        <h3>{goal.name}</h3>
        <StatusBadge tone={goalStatusTone(goal.status)}>
          {goalStatusLabel(goal.status)}
        </StatusBadge>
      </div>
      <p className="goal-card__target numeric">
        {formatGoalTarget(goal.targetCents, goal.currency)}
      </p>
      <p className="goal-card__caption">Valor alvo</p>
      {onEdit ? (
        <Button onClick={() => onEdit(goal)} size="sm" variant="ghost">
          Editar meta
        </Button>
      ) : null}
    </Card>
  );
}
