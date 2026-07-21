/**
 * Contratos de categorização confirmados em `ms-categorization`.
 *
 * Somente campos e valores realmente publicados pelo microsserviço são
 * representados aqui. Nenhum enum, operador ou propriedade foi inventado.
 */

/** RuleStatus publicado pelo domínio de regras. */
export const ruleStatuses = ['ACTIVE', 'INACTIVE'] as const;

export type RuleStatus = (typeof ruleStatuses)[number];

/** MatchOperator publicado pelo domínio de regras. */
export const matchOperators = [
  'CONTAINS',
  'STARTS_WITH',
  'ENDS_WITH',
  'REGEX',
  'EQUALS_IGNORE_CASE',
  'AMOUNT_GREATER_THAN',
  'AMOUNT_LESS_THAN',
  'CURRENCY_EQUALS',
] as const;

export type MatchOperator = (typeof matchOperators)[number];

/** Campos de transação aceitos por uma condição de regra. */
export const ruleConditionFields = [
  'description',
  'merchant',
  'currency',
  'amount',
] as const;

export type RuleConditionField = (typeof ruleConditionFields)[number];

/** SuggestionStatus publicado pelo domínio de sugestões. */
export const suggestionStatuses = [
  'SUGGESTED',
  'APPLIED_AUTO',
  'APPLIED_MANUAL',
  'REJECTED',
  'UNMATCHED',
] as const;

export type SuggestionStatus = (typeof suggestionStatuses)[number];

export type Category = Readonly<{
  id: string;
  name: string;
  color?: string;
  active: boolean;
}>;

export type CreateCategoryInput = Readonly<{
  name: string;
  color?: string;
}>;

export type RuleCondition = Readonly<{
  field: string;
  operator: MatchOperator;
  value: string;
  weight?: number;
}>;

export type CategorizationRule = Readonly<{
  id: string;
  categoryId: string;
  name: string;
  status: RuleStatus;
  priority: number;
  conditions: readonly RuleCondition[];
  createdAt?: string;
  updatedAt?: string;
}>;

export type CreateRuleInput = Readonly<{
  categoryId: string;
  name: string;
  status: RuleStatus;
  priority: number;
  conditions: readonly RuleCondition[];
}>;

export type ManualCategorizationInput = Readonly<{
  transactionId: string;
  categoryId: string;
  rationale?: string;
}>;

export type ManualCategorizationResult = Readonly<{
  transactionId: string;
  categorized: boolean;
  categoryId?: string;
  suggestionId?: string;
  decision?: string;
  score: number;
}>;

export type CategorizationSuggestion = Readonly<{
  id: string;
  transactionId: string;
  categoryId?: string;
  ruleId?: string;
  status: SuggestionStatus;
  score: number;
  rationale?: string;
}>;

/**
 * Projeção mínima de transação usada apenas para escolher um `transactionId`
 * na categorização manual. O gateway não publica listagem de transações,
 * portanto essa fonte é opcional no Data Source.
 */
export type CategorizableTransaction = Readonly<{
  id: string;
  description: string;
  transactionDate: string;
  amountCents: number;
  currency: string;
  categoryId?: string;
}>;
