import { useCallback, useMemo, useState } from 'react';
import { useSession } from '../../../app/providers/SessionProvider';
import {
  Button,
  Card,
  Drawer,
  EmptyState,
  Pagination,
} from '../../../components/ui';
import { useCategories } from '../../categories/hooks/use-categories';
import { usePreferences } from '../../users/hooks/use-preferences';
import { BudgetFilters } from '../components/BudgetFilters';
import { BudgetFormModal } from '../components/BudgetFormModal';
import { BudgetList } from '../components/BudgetList';
import {
  BudgetErrorState,
  BudgetListSkeleton,
} from '../components/BudgetResourceState';
import { useBudgetOverview } from '../hooks/use-budget-overview';
import { useBudgets } from '../hooks/use-budgets';
import type {
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
} from '../types/budget';

const fallbackCurrency = 'BRL';

/**
 * Coordena listagem, filtros, paginação, criação, edição e overview. A página
 * não conhece o modo de execução, não monta requisições e não calcula valores
 * financeiros.
 */
export function BudgetsPage() {
  const { currentUser } = useSession();
  const categories = useCategories();
  const budgets = useBudgets();
  const [overviewToken, setOverviewToken] = useState(0);
  const overview = useBudgetOverview(overviewToken);
  const preferences = usePreferences(currentUser?.id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const availableCategories = useMemo(
    () => categories.categories ?? [],
    [categories.categories],
  );

  /** Lookup preparado uma única vez: nenhum card faz requisição própria. */
  const categoryNames = useMemo(() => {
    const names = new Map<string, string>();
    availableCategories.forEach((category) =>
      names.set(category.id, category.name),
    );
    return names;
  }, [availableCategories]);

  const defaultCurrency =
    preferences.data?.DEFAULT_CURRENCY ??
    budgets.budgets?.content[0]?.currency ??
    fallbackCurrency;

  const revalidateOverview = useCallback(
    () => setOverviewToken((current) => current + 1),
    [],
  );

  const {
    changeFilters,
    clearSaveError,
    createBudget,
    removeBudget,
    reload: reloadBudgets,
    updateBudget,
  } = budgets;

  const handleCreate = useCallback(
    async (input: CreateBudgetInput) => {
      const result = await createBudget(input);

      if (result.ok) {
        revalidateOverview();
      }

      return result;
    },
    [createBudget, revalidateOverview],
  );

  const handleUpdate = useCallback(
    async (id: string, input: UpdateBudgetInput) => {
      const result = await updateBudget(id, input);

      if (result.ok) {
        revalidateOverview();
      }

      return result;
    },
    [revalidateOverview, updateBudget],
  );

  const handleRemove = useCallback(
    async (id: string) => {
      const result = await removeBudget(id);

      if (result.ok) {
        revalidateOverview();
      }

      return result;
    },
    [removeBudget, revalidateOverview],
  );

  function openCreate() {
    clearSaveError();
    setEditingBudget(null);
    setIsFormOpen(true);
  }

  function openEdit(budget: Budget) {
    clearSaveError();
    setEditingBudget(budget);
    setIsFormOpen(true);
  }

  function refreshAll() {
    reloadBudgets();
    revalidateOverview();
  }

  const page = budgets.budgets;
  const hasFilters = Boolean(
    budgets.filters.status ?? budgets.filters.categoryId,
  );
  const isUpdating = budgets.isRefreshing || overview.isRefreshing;

  const filtersPanel = (
    <BudgetFilters
      categories={availableCategories}
      disabled={budgets.isLoading}
      filters={budgets.filters}
      onFiltersChange={changeFilters}
      onSortChange={budgets.changeSort}
      sort={budgets.sort}
    />
  );

  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <div>
          <span className="demo-eyebrow">PLANEJAMENTO POR CATEGORIA</span>
          <h1>Orçamentos</h1>
          <p>
            Limites, consumo e período de cada orçamento, exatamente como o
            serviço de budgeting os publica.
          </p>
        </div>
        <Button leadingIcon="wallet" onClick={openCreate}>
          Novo orçamento
        </Button>
      </header>

      <div className="budget-toolbar">
        <Button
          className="budget-toolbar__filters-trigger"
          onClick={() => setIsFilterDrawerOpen(true)}
          variant="outline"
        >
          Filtros e ordenação
        </Button>
        <Button onClick={refreshAll} size="sm" variant="ghost">
          Atualizar informações
        </Button>
        <p aria-live="polite" className="budget-toolbar__status">
          {isUpdating ? 'Atualizando informações...' : ''}
        </p>
      </div>

      <Card as="section" className="budget-filters-panel">
        {filtersPanel}
      </Card>

      {budgets.isLoading ? (
        <BudgetListSkeleton />
      ) : budgets.error ? (
        <BudgetErrorState error={budgets.error} onRetry={reloadBudgets} />
      ) : !page || page.content.length === 0 ? (
        <Card as="section" className="budget-state-card">
          {hasFilters ? (
            <EmptyState
              actionLabel="Limpar filtros"
              description="Nenhum orçamento corresponde aos filtros aplicados."
              onAction={() => changeFilters({})}
              title="Nenhum resultado"
            />
          ) : (
            <EmptyState
              actionLabel="Criar orçamento"
              description="Defina um limite por categoria e período para acompanhar seu consumo."
              onAction={openCreate}
              title="Nenhum orçamento cadastrado"
            />
          )}
        </Card>
      ) : (
        <div
          className={`budget-results ${
            budgets.isRefreshing ? 'budget-results--updating' : ''
          }`.trim()}
        >
          <BudgetList
            budgets={page.content}
            categoryNames={categoryNames}
            consumptionByBudget={overview.consumptionByBudget}
            isConsumptionLoading={overview.isLoading}
            onEdit={openEdit}
          />
          <Pagination
            onPageChange={budgets.changePage}
            page={page.page}
            totalElements={page.totalElements}
            totalPages={page.totalPages}
          />
        </div>
      )}

      {overview.error ? (
        <p className="budget-overview-notice" role="status">
          O consumo não pôde ser carregado agora. Os limites continuam
          disponíveis.
        </p>
      ) : null}

      <Drawer
        onClose={() => setIsFilterDrawerOpen(false)}
        open={isFilterDrawerOpen}
        title="Filtros e ordenação"
      >
        {filtersPanel}
      </Drawer>

      <BudgetFormModal
        budget={editingBudget}
        categories={availableCategories}
        defaultCurrency={defaultCurrency}
        error={budgets.saveError}
        isSaving={budgets.isSaving}
        onClearError={clearSaveError}
        onClose={() => setIsFormOpen(false)}
        onCreate={handleCreate}
        onRefreshBudget={budgets.refreshBudget}
        onRemove={handleRemove}
        onUpdate={handleUpdate}
        open={isFormOpen}
      />
    </div>
  );
}
