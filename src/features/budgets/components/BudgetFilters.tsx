import { Select } from '../../../components/ui';
import type { Category } from '../../categories/types/categorization';
import {
  budgetSortFields,
  budgetStatuses,
  type BudgetFilters as BudgetFiltersValue,
  type BudgetSort,
  type BudgetSortDirection,
  type BudgetSortField,
  type BudgetStatus,
} from '../types/budget';
import { budgetStatusLabel } from '../utils/budget-labels';

type BudgetFiltersProps = {
  filters: BudgetFiltersValue;
  sort: BudgetSort;
  categories: readonly Category[];
  disabled?: boolean;
  onFiltersChange: (filters: BudgetFiltersValue) => void;
  onSortChange: (sort: BudgetSort) => void;
};

const sortFieldLabels: Record<BudgetSortField, string> = {
  createdAt: 'Data de criação',
  updatedAt: 'Última atualização',
  periodStart: 'Início do período',
  periodEnd: 'Fim do período',
  status: 'Status',
  categoryId: 'Categoria',
};

const directionOptions: { value: BudgetSortDirection; label: string }[] = [
  { value: 'desc', label: 'Decrescente' },
  { value: 'asc', label: 'Crescente' },
];

/**
 * Filtros e ordenação da listagem.
 *
 * `GET /budgets` publica somente o recorte por usuário: não há filtro nem
 * ordenação no servidor. Por isso os controles abaixo são aplicados sobre a
 * coleção retornada, com regras idênticas em Mock Mode e API Mode, e nenhuma
 * query inexistente é enviada ao backend. Os campos de ordenação são
 * exclusivamente propriedades reais do recurso.
 */
export function BudgetFilters({
  categories,
  disabled = false,
  filters,
  onFiltersChange,
  onSortChange,
  sort,
}: BudgetFiltersProps) {
  return (
    <div className="budget-filters">
      <Select
        disabled={disabled}
        label="Status"
        onChange={(event) => {
          const value = event.currentTarget.value;
          onFiltersChange({
            ...filters,
            ...(value ? { status: value as BudgetStatus } : { status: undefined }),
          });
        }}
        options={[
          { value: '', label: 'Todos os status' },
          ...budgetStatuses.map((status) => ({
            value: status,
            label: budgetStatusLabel(status),
          })),
        ]}
        value={filters.status ?? ''}
      />
      <Select
        disabled={disabled}
        label="Categoria"
        onChange={(event) => {
          const value = event.currentTarget.value;
          onFiltersChange({
            ...filters,
            ...(value ? { categoryId: value } : { categoryId: undefined }),
          });
        }}
        options={[
          { value: '', label: 'Todas as categorias' },
          ...categories.map((category) => ({
            value: category.id,
            label: category.name,
          })),
        ]}
        value={filters.categoryId ?? ''}
      />
      <Select
        disabled={disabled}
        label="Ordenar por"
        onChange={(event) =>
          onSortChange({
            ...sort,
            field: event.currentTarget.value as BudgetSortField,
          })
        }
        options={budgetSortFields.map((field) => ({
          value: field,
          label: sortFieldLabels[field],
        }))}
        value={sort.field}
      />
      <Select
        disabled={disabled}
        label="Direção"
        onChange={(event) =>
          onSortChange({
            ...sort,
            direction: event.currentTarget.value as BudgetSortDirection,
          })
        }
        options={directionOptions}
        value={sort.direction}
      />
    </div>
  );
}
