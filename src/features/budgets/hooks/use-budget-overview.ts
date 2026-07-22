import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import type { BudgetConsumption, BudgetOverview } from '../types/budget';
import { normalizeBudgetError } from './budget-errors';

/**
 * Overview de consumo.
 *
 * No modo API o consumo é atualizado pelo backend a partir de eventos, então a
 * revalidação acontece por ação (recarregar, criar, editar ou remover) e nunca
 * por polling contínuo. Os dados atuais permanecem visíveis enquanto a
 * atualização acontece.
 */
export function useBudgetOverview(revalidationToken = 0) {
  const { budgetService } = useAppDependencies();
  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [manualToken, setManualToken] = useState(0);
  const loadedRef = useRef(false);

  useEffect(() => {
    let active = true;

    if (loadedRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    budgetService
      .getOverview()
      .then((result) => {
        if (!active) {
          return;
        }

        loadedRef.current = true;
        setOverview(result);
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
  }, [budgetService, manualToken, revalidationToken]);

  const consumptionByBudget = useMemo(() => {
    const entries = new Map<string, BudgetConsumption>();
    overview?.consumptions.forEach((consumption) =>
      entries.set(consumption.budgetId, consumption),
    );
    return entries;
  }, [overview]);

  const reload = useCallback(() => setManualToken((current) => current + 1), []);

  return {
    consumptionByBudget,
    error,
    isLoading,
    isRefreshing,
    reload,
  };
}
