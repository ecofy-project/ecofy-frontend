import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import { isTerminalStatus, type ImportJobDetails } from '../types/import';
import { normalizeImportError } from './import-errors';

const pollingIntervalMs = 2_000;
const pollingMaxAttempts = 30;

/**
 * Detalhes de uma importação, com o mesmo polling controlado do upload: só
 * acontece enquanto o job estiver em PENDING ou RUNNING, para em status
 * terminal, evita requests concorrentes e é encerrado ao desmontar.
 */
export function useImportDetails(jobId: string) {
  const { importService } = useAppDependencies();
  const [details, setDetails] = useState<ImportJobDetails | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pollingExhausted, setPollingExhausted] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const loadedRef = useRef(false);

  useEffect(() => {
    let active = true;
    let timerId: number | null = null;
    let inFlight = false;

    function clearTimer() {
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
    }

    function load(attempt: number) {
      if (inFlight) {
        return;
      }

      inFlight = true;

      importService
        .getJobById(jobId)
        .then((result) => {
          inFlight = false;

          if (!active) {
            return;
          }

          loadedRef.current = true;
          setDetails(result);
          setError(null);
          setIsLoading(false);
          setIsRefreshing(false);

          if (isTerminalStatus(result.job.status)) {
            return;
          }

          if (attempt >= pollingMaxAttempts) {
            setPollingExhausted(true);
            return;
          }

          setIsRefreshing(true);
          timerId = window.setTimeout(() => load(attempt + 1), pollingIntervalMs);
        })
        .catch((cause: unknown) => {
          inFlight = false;

          if (!active) {
            return;
          }

          setError(normalizeImportError(cause));
          setIsLoading(false);
          setIsRefreshing(false);
        });
    }

    if (loadedRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setPollingExhausted(false);
    load(1);

    return () => {
      active = false;
      clearTimer();
    };
  }, [importService, jobId, refreshToken]);

  const reload = useCallback(
    () => setRefreshToken((current) => current + 1),
    [],
  );

  return {
    details,
    error,
    isLoading,
    isRefreshing,
    pollingExhausted,
    reload,
  };
}
