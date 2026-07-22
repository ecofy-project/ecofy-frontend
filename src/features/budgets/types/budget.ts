/**
 * Contratos de orçamento confirmados em `ms-budgeting`.
 *
 * Todos os enums e campos abaixo foram lidos diretamente de `BudgetController`,
 * `CreateBudgetRequest`, `UpdateBudgetRequest`, `BudgetResponse`,
 * `BudgetOverviewResponse` e dos enums de domínio. Nada foi inventado.
 * As divergências entre o contrato real e a especificação da etapa estão
 * documentadas em `docs/BUDGETING_CONTRACTS.md`.
 */

import type { Page } from '../../../services/pagination/pagination';

/** `BudgetStatus` publicado pelo domínio de orçamentos. */
export const budgetStatuses = ['ACTIVE', 'PAUSED', 'ARCHIVED'] as const;

export type BudgetStatus = (typeof budgetStatuses)[number];

/** `BudgetPeriodType` publicado pelo domínio de orçamentos. */
export const budgetPeriodTypes = ['MONTHLY', 'WEEKLY', 'CUSTOM'] as const;

export type BudgetPeriodType = (typeof budgetPeriodTypes)[number];

/**
 * Modelo interno de orçamento.
 *
 * `limitAmount` permanece como decimal em string, exatamente como
 * `BudgetResponse.limitAmount` (`BigDecimal.toPlainString()`). A conversão para
 * `Money` acontece apenas na apresentação, pelo Money Adapter.
 *
 * `version` é opcional porque `BudgetResponse` ainda não publica esse campo. Ele
 * é preservado quando existir e nunca é gerado pelo frontend.
 */
export type Budget = Readonly<{
  id: string;
  categoryId: string;
  periodType: BudgetPeriodType;
  periodStart: string;
  periodEnd: string;
  limitAmount: string;
  currency: string;
  status: BudgetStatus;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}>;

/**
 * Consumo consolidado publicado em `BudgetOverviewResponse.consumptions`.
 * `percentage` reflete `consumedPct`, calculado pelo backend. O frontend nunca
 * recalcula consumo nem percentual.
 */
export type BudgetConsumption = Readonly<{
  budgetId: string;
  consumedAmount: string;
  limitAmount: string;
  percentage: number;
}>;

/**
 * Projeção interna do overview. `alerts` é publicado pelo backend, mas alertas
 * chegam ao usuário por notificações, então não são consumidos nesta etapa.
 */
export type BudgetOverview = Readonly<{
  consumptions: readonly BudgetConsumption[];
}>;

/**
 * `CreateBudgetRequest` sem `userId`: o identificador do usuário é resolvido a
 * partir da sessão dentro do Data Source de API e nunca é pedido no formulário.
 */
export type CreateBudgetInput = Readonly<{
  categoryId: string;
  periodType: BudgetPeriodType;
  periodStart: string;
  periodEnd: string;
  limitAmount: string;
  currency: string;
  status?: BudgetStatus;
}>;

/**
 * `UpdateBudgetRequest` publica apenas estes campos mutáveis. `version` viaja no
 * modelo interno para detecção de conflito e não é enviado ao backend enquanto
 * o contrato não publicar o campo.
 */
export type UpdateBudgetInput = Readonly<{
  newLimitAmount?: string;
  currency?: string;
  status?: BudgetStatus;
  version?: number;
}>;

/** Campos de ordenação aceitos, restritos às propriedades reais do recurso. */
export const budgetSortFields = [
  'createdAt',
  'updatedAt',
  'periodStart',
  'periodEnd',
  'status',
  'categoryId',
] as const;

export type BudgetSortField = (typeof budgetSortFields)[number];

export type BudgetSortDirection = 'asc' | 'desc';

export type BudgetSort = Readonly<{
  field: BudgetSortField;
  direction: BudgetSortDirection;
}>;

/** Filtros aplicados à listagem. Ambos são resolvidos no Data Source. */
export type BudgetFilters = Readonly<{
  status?: BudgetStatus;
  categoryId?: string;
}>;

export type BudgetListParams = Readonly<{
  page: number;
  size: number;
  sort: BudgetSort;
  filters: BudgetFilters;
}>;

export type BudgetPage = Page<Budget>;
