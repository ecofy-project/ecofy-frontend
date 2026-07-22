import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import type {
  GenerateInsightsInput,
  InsightPage,
  InsightType,
} from '../types/insights';
import { defaultInsightPageSize } from '../utils/insight-projection';
import {
  isDegradedError,
  normalizeInsightsError,
  type InsightsMutationResult,
} from './insights-errors';

/**
 * Listagem paginada de insights e solicitação de geração.
 *
 * A geração nunca acontece na renderização: ela só ocorre quando o usuário
 * envia o formulário.
 */
export function useInsightList() {
  const { insightsService } = useAppDependencies();
  const [page, setPage] = useState(0);
  const [type, setType] = useState<InsightType | undefined>(undefined);
  const [refreshToken, setRefreshToken] = useState(0);
  const [data, setData] = useState<InsightPage | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<ApiError | null>(null);
  const loadedRef = useRef(false);

  const params = useMemo(
    () => ({
      page,
      size: defaultInsightPageSize,
      ...(type ? { type } : {}),
    }),
    [page, type],
  );

  useEffect(() => {
    let active = true;

    if (loadedRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    insightsService
      .listInsights(params)
      .then((result) => {
        if (!active) {
          return;
        }

        loadedRef.current = true;
        setData(result);
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
  }, [insightsService, params, refreshToken]);

  const reload = useCallback(
    () => setRefreshToken((current) => current + 1),
    [],
  );

  const changePage = useCallback((nextPage: number) => {
    setPage(Math.max(0, nextPage));
  }, []);

  const changeType = useCallback((nextType?: InsightType) => {
    setType(nextType);
    setPage(0);
  }, []);

  const clearGenerateError = useCallback(() => setGenerateError(null), []);

  const generateInsights = useCallback(
    async (
      input: GenerateInsightsInput,
    ): Promise<InsightsMutationResult<void>> => {
      setIsGenerating(true);
      setGenerateError(null);

      try {
        await insightsService.generateInsights(input);
        setIsGenerating(false);
        setPage(0);
        setRefreshToken((current) => current + 1);
        return { ok: true, data: undefined };
      } catch (cause: unknown) {
        const normalized = normalizeInsightsError(cause);
        setGenerateError(normalized);
        setIsGenerating(false);
        return { ok: false, error: normalized };
      }
    },
    [insightsService],
  );

  return {
    insights: data,
    type,
    error,
    isDegraded: error !== null && isDegradedError(error),
    isLoading,
    isRefreshing,
    isGenerating,
    generateError,
    supportsRebuild: insightsService.supportsRebuild,
    changePage,
    changeType,
    clearGenerateError,
    generateInsights,
    reload,
  };
}
