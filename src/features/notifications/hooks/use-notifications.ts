import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDependencies } from '../../../app/providers/AppDependenciesProvider';
import {
  adaptApiError,
  ApiErrorException,
  type ApiError,
} from '../../../services/errors/api-error';
import {
  defaultNotificationLimit,
  type Notification,
} from '../types/notification';

/** Todo erro da feature passa pelo Error Adapter antes de chegar à UI. */
function normalizeNotificationError(error: unknown): ApiError {
  return error instanceof ApiErrorException
    ? error.apiError
    : adaptApiError(error);
}

export type NotificationMutationResult =
  | Readonly<{ ok: true; data: Notification }>
  | Readonly<{ ok: false; error: ApiError }>;

/**
 * Listagem limitada de notificações.
 *
 * A carga acontece uma única vez por montagem e em ações explícitas: não há
 * polling permanente, para não gerar requisições contínuas na demonstração nem
 * em API Mode.
 */
export function useNotifications(limit = defaultNotificationLimit) {
  const { notificationService } = useAppDependencies();
  const [notifications, setNotifications] = useState<
    readonly Notification[] | null
  >(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState<ApiError | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const loadedRef = useRef(false);

  useEffect(() => {
    let active = true;

    if (loadedRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    notificationService
      .listNotifications({ limit })
      .then((result) => {
        if (!active) {
          return;
        }

        loadedRef.current = true;
        setNotifications(result);
        setError(null);
        setIsLoading(false);
        setIsRefreshing(false);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        setError(normalizeNotificationError(cause));
        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [limit, notificationService, refreshToken]);

  const reload = useCallback(
    () => setRefreshToken((current) => current + 1),
    [],
  );

  const clearResendError = useCallback(() => setResendError(null), []);

  const resendNotification = useCallback(
    async (notificationId: string): Promise<NotificationMutationResult> => {
      setIsResending(true);
      setResendError(null);

      try {
        const result = await notificationService.resendNotification({
          notificationId,
        });
        setIsResending(false);
        setRefreshToken((current) => current + 1);
        return { ok: true, data: result };
      } catch (cause: unknown) {
        const normalized = normalizeNotificationError(cause);
        setResendError(normalized);
        setIsResending(false);
        return { ok: false, error: normalized };
      }
    },
    [notificationService],
  );

  return {
    notifications,
    error,
    isLoading,
    isRefreshing,
    isResending,
    resendError,
    clearResendError,
    reload,
    resendNotification,
  };
}
