import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import type { ApiError } from '../../../services/errors/api-error';
import {
  isTerminalStatus,
  type ImportError,
  type ImportJob,
} from '../types/import';
import { resolveImportFileType } from '../utils/import-file';
import { isAbortedRequest, normalizeImportError } from './import-errors';

/**
 * Estados do fluxo. `uploading` é um estado de transporte do frontend, não um
 * status de domínio: os status do backend são apenas os cinco confirmados.
 */
export type ImportUploadState =
  | 'idle'
  | 'selected'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'completed_with_errors'
  | 'failed';

/** Intervalo e limite de polling centralizados nesta camada. */
const pollingIntervalMs = 2_000;
const pollingMaxAttempts = 30;

type UploadOutcome = Readonly<{ ok: boolean; error?: ApiError }>;

export function useImportUpload(onFinished?: () => void) {
  const { importService } = useAppDependencies();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [errors, setErrors] = useState<readonly ImportError[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingExhausted, setPollingExhausted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const pollInFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const onFinishedRef = useRef(onFinished);

  onFinishedRef.current = onFinished;

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    pollInFlightRef.current = false;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      stopPolling();
      abortRef.current?.abort();
    };
  }, [stopPolling]);

  /**
   * Carrega os detalhes para obter os erros por linha. O POST devolve apenas o
   * job, então a lista de erros vem sempre da consulta de status.
   */
  const loadDetails = useCallback(
    async (jobId: string) => {
      try {
        const details = await importService.getJobById(jobId);

        if (mountedRef.current) {
          setJob(details.job);
          setErrors(details.errors);
        }

        return details.job;
      } catch (cause: unknown) {
        if (mountedRef.current) {
          setError(normalizeImportError(cause));
        }

        return null;
      }
    },
    [importService],
  );

  /**
   * Polling controlado: só existe um request em voo por vez, o agendamento é
   * único, para em status terminal, no limite de tentativas e ao desmontar.
   */
  const schedulePoll = useCallback(
    (jobId: string, attempt: number) => {
      stopPolling();

      if (attempt > pollingMaxAttempts) {
        setIsPolling(false);
        setPollingExhausted(true);
        return;
      }

      pollTimerRef.current = window.setTimeout(() => {
        if (!mountedRef.current || pollInFlightRef.current) {
          return;
        }

        pollInFlightRef.current = true;

        void loadDetails(jobId).then((updated) => {
          pollInFlightRef.current = false;

          if (!mountedRef.current) {
            return;
          }

          if (!updated || isTerminalStatus(updated.status)) {
            setIsPolling(false);

            if (updated) {
              onFinishedRef.current?.();
            }

            return;
          }

          schedulePoll(jobId, attempt + 1);
        });
      }, pollingIntervalMs);
    },
    [loadDetails, stopPolling],
  );

  const selectFile = useCallback((file: File | null) => {
    setSelectedFile(file);
    setJob(null);
    setErrors([]);
    setError(null);
    setUploadPercent(null);
    setPollingExhausted(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const cancelUpload = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const startUpload = useCallback(async (): Promise<UploadOutcome> => {
    if (!selectedFile || isUploading) {
      return { ok: false };
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsUploading(true);
    setError(null);
    setJob(null);
    setErrors([]);
    setUploadPercent(null);
    setPollingExhausted(false);

    const type = resolveImportFileType(selectedFile.name);

    try {
      const uploaded = await importService.uploadFile(
        { file: selectedFile, ...(type ? { type } : {}) },
        {
          onUploadProgress: (percent) => {
            if (mountedRef.current) {
              setUploadPercent(percent);
            }
          },
          signal: controller.signal,
        },
      );

      if (!mountedRef.current) {
        return { ok: true };
      }

      setJob(uploaded);
      setIsUploading(false);

      if (isTerminalStatus(uploaded.status)) {
        await loadDetails(uploaded.id);
        onFinishedRef.current?.();
        return { ok: true };
      }

      /* Só há polling quando o job volta em PENDING ou RUNNING. */
      setIsPolling(true);
      schedulePoll(uploaded.id, 1);
      onFinishedRef.current?.();
      return { ok: true };
    } catch (cause: unknown) {
      const normalized = normalizeImportError(cause);

      if (mountedRef.current) {
        setIsUploading(false);
        setUploadPercent(null);

        if (!isAbortedRequest(normalized)) {
          setError(normalized);
        }
      }

      return { ok: false, error: normalized };
    } finally {
      abortRef.current = null;
    }
  }, [importService, isUploading, loadDetails, schedulePoll, selectedFile]);

  const reset = useCallback(() => {
    stopPolling();
    setSelectedFile(null);
    setJob(null);
    setErrors([]);
    setError(null);
    setUploadPercent(null);
    setIsPolling(false);
    setPollingExhausted(false);
  }, [stopPolling]);

  const state: ImportUploadState = isUploading
    ? 'uploading'
    : job
      ? job.status === 'COMPLETED'
        ? 'completed'
        : job.status === 'COMPLETED_WITH_ERRORS'
          ? 'completed_with_errors'
          : job.status === 'FAILED'
            ? 'failed'
            : 'processing'
      : selectedFile
        ? 'selected'
        : 'idle';

  return {
    selectedFile,
    state,
    job,
    errors,
    error,
    uploadPercent,
    isUploading,
    isPolling,
    pollingExhausted,
    maxFileSizeBytes: importService.maxFileSizeBytes,
    cancelUpload,
    clearError,
    reset,
    selectFile,
    startUpload,
  };
}
