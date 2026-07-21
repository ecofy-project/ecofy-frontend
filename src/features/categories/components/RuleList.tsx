import { StatusBadge } from '../../../components/ui';
import type { CategorizationRule, Category } from '../types/categorization';
import {
  describeCondition,
  ruleStatusLabels,
} from '../utils/categorization-labels';

type RuleListProps = {
  rules: readonly CategorizationRule[];
  categories: readonly Category[];
};

export function RuleList({ categories, rules }: RuleListProps) {
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  return (
    <ul aria-label="Regras de categorização" className="rule-list">
      {rules.map((rule) => (
        <li className="rule-list__item" key={rule.id}>
          <div className="rule-list__heading">
            <h3>{rule.name}</h3>
            <StatusBadge tone={rule.status === 'ACTIVE' ? 'success' : 'neutral'}>
              {ruleStatusLabels[rule.status]}
            </StatusBadge>
          </div>
          <ul className="rule-list__conditions">
            {rule.conditions.map((condition, index) => (
              <li key={`${rule.id}-${index}`}>
                {describeCondition(
                  condition.field,
                  condition.operator,
                  condition.value,
                )}
              </li>
            ))}
          </ul>
          <p className="rule-list__meta">
            <span>{categoryNames.get(rule.categoryId) ?? 'Categoria'}</span>
            <span className="numeric">Prioridade {rule.priority}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
