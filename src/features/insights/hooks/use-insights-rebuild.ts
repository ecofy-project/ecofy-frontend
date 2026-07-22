import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import {
  isRebuildFinished,
  rebuildModes,
  type RebuildRun,
} from '../types/insights';
import { normalizeInsightsError } from './insights-errors';

/** Intervalo e limite centralizados nesta camada, nunca nos componentes. */
const pollingIntervalMs = 2_000;
const pollingMaxAttempts = 20;

/**
 * Reconstrução de análises ausentes.
 *
 * O polling só existe enquanto o run estiver em processamento, evita chamadas
 * concorrentes, para em estado terminal, encerra ao desmontar e tem limite de
 * tentativas. A ação inteira só é oferecida quando a origem de dados publica
 * reconstrução.
 */
export function useInsightsRebuild(onFinished?: () => void) {
  const { insightsService } = useAppDependencies();
  const [run, setRun] = useState<RebuildRun | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [pollingExhausted, setPollingExhausted] = useState(false);
  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const onFinishedRef = useRef(onFinished);

  onFinishedRef.current = onFinished;

  const stopPolling = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    inFlightRef.current = false;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  const schedulePoll = useCallback(
    (runId: string, attempt: number) => {
      stopPolling();

      if (attempt > pollingMaxAttempts) {
        setPollingExhausted(true);
        return;
      }

      timerRef.current = window.setTimeout(() => {
        if (!mountedRef.current || inFlightRef.current) {
          return;
        }

        const pending = insightsService.getRebuildStatus(runId);

        if (!pending) {
          return;
        }

        inFlightRef.current = true;

        void pending
          .then((updated) => {
            inFlightRef.current = false;

            if (!mountedRef.current) {
              return;
            }

            setRun(updated);

            if (isRebuildFinished(updated)) {
              onFinishedRef.current?.();
              return;
            }

            schedulePoll(runId, attempt + 1);
          })
          .catch((cause: unknown) => {
            inFlightRef.current = false;

            if (mountedRef.current) {
              setError(normalizeInsightsError(cause));
            }
          });
      }, pollingIntervalMs);
    },
    [insightsService, stopPolling],
  );

  const requestRebuild = useCallback(async () => {
    if (isRequesting) {
      return;
    }

    setIsRequesting(true);
    setError(null);
    setPollingExhausted(false);

    try {
      const pending = insightsService.requestRebuild(rebuildModes[0]);

      if (!pending) {
        setIsRequesting(false);
        return;
      }

      const started = await pending;

      if (!mountedRef.current) {
        return;
      }

      setRun(started);
      setIsRequesting(false);

      if (isRebuildFinished(started)) {
        onFinishedRef.current?.();
        return;
      }

      schedulePoll(started.runId, 1);
    } catch (cause: unknown) {
      if (mountedRef.current) {
        setError(normalizeInsightsError(cause));
        setIsRequesting(false);
      }
    }
  }, [insightsService, isRequesting, schedulePoll]);

  const dismiss = useCallback(() => {
    stopPolling();
    setRun(null);
    setError(null);
    setPollingExhausted(false);
  }, [stopPolling]);

  return {
    run,
    error,
    isRequesting,
    isProcessing: run !== null && !isRebuildFinished(run),
    pollingExhausted,
    dismiss,
    requestRebuild,
  };
}
