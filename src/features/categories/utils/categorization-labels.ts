import type {
  MatchOperator,
  RuleConditionField,
  RuleStatus,
  SuggestionStatus,
} from '../types/categorization';

export const ruleStatusLabels: Readonly<Record<RuleStatus, string>> = {
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa',
};

export const ruleConditionFieldLabels: Readonly<
  Record<RuleConditionField, string>
> = {
  description: 'Descrição',
  merchant: 'Estabelecimento',
  currency: 'Moeda',
  amount: 'Valor',
};

export const matchOperatorLabels: Readonly<Record<MatchOperator, string>> = {
  CONTAINS: 'Contém',
  STARTS_WITH: 'Começa com',
  ENDS_WITH: 'Termina com',
  REGEX: 'Expressão regular',
  EQUALS_IGNORE_CASE: 'É igual a',
  AMOUNT_GREATER_THAN: 'É maior que',
  AMOUNT_LESS_THAN: 'É menor que',
  CURRENCY_EQUALS: 'Moeda é igual a',
};

export const suggestionStatusLabels: Readonly<
  Record<SuggestionStatus, string>
> = {
  SUGGESTED: 'Sugerida',
  APPLIED_AUTO: 'Aplicada automaticamente',
  APPLIED_MANUAL: 'Aplicada manualmente',
  REJECTED: 'Rejeitada',
  UNMATCHED: 'Sem correspondência',
};

/**
 * Operadores oferecidos por campo, conforme as combinações efetivamente
 * avaliadas pelo `RuleEngine` do ms-categorization. `CURRENCY_EQUALS` existe no
 * enum publicado, mas o motor não o avalia em nenhum campo — por isso não é
 * oferecido, evitando a criação de regras que nunca correspondem.
 */
export const operatorsByField: Readonly<
  Record<RuleConditionField, readonly [MatchOperator, ...MatchOperator[]]>
> = {
  description: [
    'CONTAINS',
    'STARTS_WITH',
    'ENDS_WITH',
    'EQUALS_IGNORE_CASE',
    'REGEX',
  ],
  merchant: [
    'CONTAINS',
    'STARTS_WITH',
    'ENDS_WITH',
    'EQUALS_IGNORE_CASE',
    'REGEX',
  ],
  currency: ['EQUALS_IGNORE_CASE', 'CONTAINS'],
  amount: ['AMOUNT_GREATER_THAN', 'AMOUNT_LESS_THAN'],
};

export function describeCondition(
  field: string,
  operator: MatchOperator,
  value: string,
) {
  const fieldLabel =
    ruleConditionFieldLabels[field as RuleConditionField] ?? field;

  return `${fieldLabel} ${matchOperatorLabels[operator].toLowerCase()} “${value}”`;
}
