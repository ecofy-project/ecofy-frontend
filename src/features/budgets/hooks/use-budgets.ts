import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import type {
  Budget,
  BudgetFilters,
  BudgetPage,
  BudgetSort,
  CreateBudgetInput,
  UpdateBudgetInput,
} from '../types/budget';
import { defaultBudgetPageSize } from '../utils/budget-projection';
import {
  normalizeBudgetError,
  type BudgetMutationResult,
} from './budget-errors';

const initialSort: BudgetSort = { field: 'createdAt', direction: 'desc' };

/**
 * Estado da listagem de orçamentos.
 *
 * Durante trocas de página, filtro ou ordenação os dados anteriores continuam
 * visíveis e apenas `isRefreshing` é sinalizado, preservando o layout.
 */
export function useBudgets() {
  const { budgetService } = useAppDependencies();
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<BudgetSort>(initialSort);
  const [filters, setFilters] = useState<BudgetFilters>({});
  const [refreshToken, setRefreshToken] = useState(0);
  const [data, setData] = useState<BudgetPage | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<ApiError | null>(null);
  const loadedRef = useRef(false);

  const params = useMemo(
    () => ({ page, size: defaultBudgetPageSize, sort, filters }),
    [filters, page, sort],
  );

  useEffect(() => {
    let active = true;

    if (loadedRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    budgetService
      .listBudgets(params)
      .then((result) => {
        if (!active) {
          return;
        }

        loadedRef.current = true;
        setData(result);
        setIsLoading(false);
        setIsRefreshing(false);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        setError(normalizeBudgetError(cause));
        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [budgetService, params, refreshToken]);

  const reload = useCallback(
    () => setRefreshToken((current) => current + 1),
    [],
  );

  const changePage = useCallback((nextPage: number) => {
    setPage(Math.max(0, nextPage));
  }, []);

  const changeSort = useCallback((nextSort: BudgetSort) => {
    setSort(nextSort);
    setPage(0);
  }, []);

  const changeFilters = useCallback((nextFilters: BudgetFilters) => {
    setFilters(nextFilters);
    setPage(0);
  }, []);

  const clearSaveError = useCallback(() => setSaveError(null), []);

  const runMutation = useCallback(
    async <TResult>(
      action: () => Promise<TResult>,
    ): Promise<BudgetMutationResult<TResult>> => {
      setIsSaving(true);
      setSaveError(null);

      try {
        const result = await action();
        setIsSaving(false);
        setRefreshToken((current) => current + 1);
        return { ok: true, data: result };
      } catch (cause: unknown) {
        const normalized = normalizeBudgetError(cause);
        setSaveError(normalized);
        setIsSaving(false);
        return { ok: false, error: normalized };
      }
    },
    [],
  );

  const createBudget = useCallback(
    (input: CreateBudgetInput) =>
      runMutation(() => budgetService.createBudget(input)),
    [budgetService, runMutation],
  );

  const updateBudget = useCallback(
    (id: string, input: UpdateBudgetInput) =>
      runMutation(() => budgetService.updateBudget(id, input)),
    [budgetService, runMutation],
  );

  const removeBudget = useCallback(
    (id: string) => runMutation(() => budgetService.removeBudget(id)),
    [budgetService, runMutation],
  );

  /** Recarrega um orçamento específico, usado na resolução de conflito. */
  const refreshBudget = useCallback(
    async (id: string): Promise<Budget | null> => {
      try {
        return await budgetService.getBudget(id);
      } catch {
        return null;
      }
    },
    [budgetService],
  );

  return {
    budgets: data,
    error,
    isLoading,
    isRefreshing,
    isSaving,
    saveError,
    filters,
    sort,
    clearSaveError,
    changeFilters,
    changePage,
    changeSort,
    createBudget,
    updateBudget,
    removeBudget,
    refreshBudget,
    reload,
  };
}
