import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import type { InsightsBundle } from '../types/insights';
import { isDegradedError, normalizeInsightsError } from './insights-errors';

/**
 * Bundle do dashboard.
 *
 * Quando a resposta é degradada, os dados já carregados são preservados: o
 * estado degradado nunca é apresentado como conteúdo vazio.
 */
export function useInsightsBundle() {
  const { insightsService } = useAppDependencies();
  const [bundle, setBundle] = useState<InsightsBundle | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const loadedRef = useRef(false);

  useEffect(() => {
    let active = true;

    if (loadedRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    insightsService
      .getDashboard()
      .then((result) => {
        if (!active) {
          return;
        }

        loadedRef.current = true;
        setBundle(result);
        setError(null);
        setIsLoading(false);
        setIsRefreshing(false);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        setError(normalizeInsightsError(cause));
        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [insightsService, refreshToken]);

  const reload = useCallback(
    () => setRefreshToken((current) => current + 1),
    [],
  );

  /** Substitui o bundle após uma geração bem-sucedida, sem novo request. */
  const applyBundle = useCallback((next: InsightsBundle) => {
    loadedRef.current = true;
    setBundle(next);
    setError(null);
  }, []);

  return {
    bundle,
    error,
    isDegraded: error !== null && isDegradedError(error),
    isLoading,
    isRefreshing,
    applyBundle,
    reload,
  };
}
