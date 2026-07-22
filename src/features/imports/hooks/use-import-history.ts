import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import type {
  ImportJobPage,
  ImportJobStatus,
  ImportSort,
} from '../types/import';
import { normalizeImportError } from './import-errors';

const defaultPageSize = 5;
const defaultSort: ImportSort = { field: 'createdAt', direction: 'desc' };

/**
 * Histórico paginado. Os dados anteriores permanecem visíveis durante trocas de
 * página ou filtro; apenas `isRefreshing` é sinalizado.
 */
export function useImportHistory() {
  const { importService } = useAppDependencies();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<ImportJobStatus | undefined>(undefined);
  const [refreshToken, setRefreshToken] = useState(0);
  const [data, setData] = useState<ImportJobPage | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadedRef = useRef(false);

  const params = useMemo(
    () => ({
      page,
      size: defaultPageSize,
      sort: defaultSort,
      ...(status ? { status } : {}),
    }),
    [page, status],
  );

  useEffect(() => {
    let active = true;

    if (loadedRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    importService
      .listJobs(params)
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

        setError(normalizeImportError(cause));
        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [importService, params, refreshToken]);

  const reload = useCallback(
    () => setRefreshToken((current) => current + 1),
    [],
  );

  const changePage = useCallback((nextPage: number) => {
    setPage(Math.max(0, nextPage));
  }, []);

  const changeStatus = useCallback((nextStatus?: ImportJobStatus) => {
    setStatus(nextStatus);
    setPage(0);
  }, []);

  return {
    jobs: data,
    status,
    error,
    isLoading,
    isRefreshing,
    changePage,
    changeStatus,
    reload,
  };
}
