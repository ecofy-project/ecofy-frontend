import { useCallback, useEffect, useState } from 'react';
import type { ApiError } from '../../../services/errors/api-error';
import {
  normalizeCategorizationError,
  type CategorizationMutationResult,
} from './categorization-errors';

type ResourceState<T> = {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
};

/**
 * Carregamento padrão da feature: mantém dados, erro e loading separados e
 * expõe uma mutação que reaproveita o mesmo Error Adapter.
 */
export function useCategorizationResource<T>(loader: () => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    error: null,
    isLoading: true,
  });
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<ApiError | null>(null);

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, error: null, isLoading: true }));

    loader()
      .then((data) => {
        if (active) {
          setState({ data, error: null, isLoading: false });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState((current) => ({
            ...current,
            error: normalizeCategorizationError(error),
            isLoading: false,
          }));
        }
      });

    return () => {
      active = false;
    };
  }, [loader, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  const clearMutationError = useCallback(() => setMutationError(null), []);

  const mutate = useCallback(
    async <TResult>(
      action: () => Promise<TResult>,
      applyToData?: (current: T | null, result: TResult) => T | null,
    ): Promise<CategorizationMutationResult<TResult>> => {
      setIsMutating(true);
      setMutationError(null);

      try {
        const result = await action();

        if (applyToData) {
          setState((current) => ({
            ...current,
            data: applyToData(current.data, result),
          }));
        }

        setIsMutating(false);
        return { ok: true, data: result };
      } catch (error: unknown) {
        const normalized = normalizeCategorizationError(error);
        setMutationError(normalized);
        setIsMutating(false);
        return { ok: false, error: normalized };
      }
    },
    [],
  );

  return {
    ...state,
    isMutating,
    mutationError,
    clearMutationError,
    mutate,
    reload,
  };
}
