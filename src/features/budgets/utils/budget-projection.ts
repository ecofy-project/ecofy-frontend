import type { Page } from '../../../services/pagination/pagination';
import type { Budget, BudgetListParams, BudgetSort } from '../types/budget';

/**
 * Projeção de listagem compartilhada por Mock e API.
 *
 * `GET /budgeting/api/budgeting/v1/budgets` publica uma lista completa por
 * usuário, sem `page`, `size`, `sort` ou filtros. Para que a UI trabalhe sempre
 * com o mesmo contrato interno (`Page<Budget>`), a projeção acontece aqui e é
 * usada pelos dois Data Sources — assim Mock e API têm exatamente as mesmas
 * regras de filtro, ordenação e paginação, e nenhuma query inexistente é
 * enviada ao backend.
 */

export const defaultBudgetPageSize = 6;

function readSortValue(budget: Budget, field: BudgetSort['field']): string {
  return budget[field] ?? '';
}

function compareBudgets(a: Budget, b: Budget, sort: BudgetSort): number {
  const left = readSortValue(a, sort.field);
  const right = readSortValue(b, sort.field);
  const comparison = left.localeCompare(right, 'pt-BR');
  const tieBreaker = a.id.localeCompare(b.id, 'pt-BR');
  const result = comparison === 0 ? tieBreaker : comparison;

  return sort.direction === 'asc' ? result : -result;
}

export function projectBudgetPage(
  budgets: readonly Budget[],
  params: BudgetListParams,
): Page<Budget> {
  const filtered = budgets.filter((budget) => {
    if (params.filters.status && budget.status !== params.filters.status) {
      return false;
    }

    return (
      !params.filters.categoryId ||
      budget.categoryId === params.filters.categoryId
    );
  });

  const sorted = [...filtered].sort((a, b) =>
    compareBudgets(a, b, params.sort),
  );
  const size = Math.max(1, params.size);
  const totalElements = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const page = Math.min(Math.max(0, params.page), totalPages - 1);
  const start = page * size;

  return {
    content: sorted.slice(start, start + size),
    page,
    size,
    totalElements,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
  };
}
